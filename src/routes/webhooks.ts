import { Hono } from 'hono'
import type { Bindings } from '../types'

const webhooks = new Hono<{ Bindings: Bindings }>()

// Export presentation to webhook or Google Drive
webhooks.post('/:presentation_id/export', async (c) => {
  const presentationId = c.req.param('presentation_id')
  
  try {
    const body = await c.req.json().catch(() => ({}))
    const exportType = body.export_type || 'webhook' // 'webhook' or 'google_drive'
    const customWebhookUrl = body.webhook_url
    
    // Get presentation
    const presentation = await c.env.DB.prepare(`
      SELECT * FROM presentations WHERE id = ?
    `).bind(presentationId).first()

    if (!presentation) {
      return c.json({ success: false, error: 'Presentation not found' }, 404)
    }

    // Get all slides
    const { results: slides } = await c.env.DB.prepare(`
      SELECT * FROM slides 
      WHERE presentation_id = ? 
      ORDER BY slide_number ASC
    `).bind(presentationId).all()

    // Parse settings
    const settings = presentation.settings ? JSON.parse(presentation.settings as string) : {}
    const webhookUrl = customWebhookUrl || settings.webhook_url

    // Prepare export data
    const exportData = {
      presentation_id: presentationId,
      genspark_project_url: presentation.genspark_project_url,
      original_filename: presentation.original_filename,
      total_slides: slides.length,
      created_at: presentation.created_at,
      settings: settings,
      slides: slides.map((slide: any) => ({
        id: slide.id,
        slide_number: slide.slide_number,
        title: slide.title,
        content: slide.content ? JSON.parse(slide.content) : null,
        animations: slide.animations ? JSON.parse(slide.animations) : [],
        narration_audio_url: slide.narration_audio_url,
        quiz_enabled: slide.quiz_enabled === 1,
        quiz_data: slide.quiz_data ? JSON.parse(slide.quiz_data) : null,
      }))
    }

    if (exportType === 'google_drive') {
      // For Google Drive export, return download link
      // In production, this would use Google Drive API
      return c.json({ 
        success: true, 
        export_type: 'google_drive',
        download_url: presentation.genspark_project_url, // GenSpark project URL as download
        data: exportData,
        message: 'Presentation ready for Google Drive. Use the GenSpark project URL to access and export.'
      })
    }

    // Webhook export
    if (!webhookUrl) {
      return c.json({ success: false, error: 'No webhook URL configured' }, 400)
    }

    // Create export record
    const exportId = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT INTO exports (id, presentation_id, webhook_url, export_status, created_at)
      VALUES (?, ?, ?, 'pending', datetime('now'))
    `).bind(exportId, presentationId, webhookUrl).run()

    // Send to webhook
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GenSpark-LMS-Exporter/1.0'
        },
        body: JSON.stringify(exportData)
      })

      if (!webhookResponse.ok) {
        throw new Error(`Webhook returned ${webhookResponse.status}`)
      }

      // Update export record
      await c.env.DB.prepare(`
        UPDATE exports 
        SET export_status = 'completed',
            export_data = ?,
            completed_at = datetime('now')
        WHERE id = ?
      `).bind(JSON.stringify(exportData), exportId).run()

      return c.json({ 
        success: true, 
        export_id: exportId,
        export_type: 'webhook',
        message: 'Presentation exported successfully to webhook'
      })
    } catch (webhookError) {
      // Update export record with error
      await c.env.DB.prepare(`
        UPDATE exports 
        SET export_status = 'error',
            error_message = ?
        WHERE id = ?
      `).bind(String(webhookError), exportId).run()

      return c.json({ 
        success: false, 
        error: 'Failed to send to webhook',
        details: String(webhookError)
      }, 500)
    }
  } catch (error) {
    console.error('Error exporting presentation:', error)
    return c.json({ success: false, error: 'Failed to export presentation' }, 500)
  }
})

// Get export history
webhooks.get('/:presentation_id/exports', async (c) => {
  const presentationId = c.req.param('presentation_id')
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM exports 
      WHERE presentation_id = ? 
      ORDER BY created_at DESC
    `).bind(presentationId).all()

    return c.json({ success: true, exports: results })
  } catch (error) {
    console.error('Error fetching exports:', error)
    return c.json({ success: false, error: 'Failed to fetch exports' }, 500)
  }
})

// Webhook receiver for GenSpark callbacks (optional)
webhooks.post('/genspark/callback', async (c) => {
  try {
    const { task_id, status, project_url } = await c.req.json()

    // Find presentation by task_id
    const presentation = await c.env.DB.prepare(`
      SELECT id FROM presentations WHERE genspark_task_id = ?
    `).bind(task_id).first()

    if (!presentation) {
      return c.json({ success: false, error: 'Presentation not found' }, 404)
    }

    // Update presentation status
    await c.env.DB.prepare(`
      UPDATE presentations 
      SET status = ?,
          genspark_project_url = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(status, project_url, presentation.id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Error processing callback:', error)
    return c.json({ success: false, error: 'Failed to process callback' }, 500)
  }
})

export default webhooks
