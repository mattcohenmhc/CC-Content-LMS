import { Hono } from 'hono'
import type { Bindings, Presentation, PresentationSettings } from '../types'

const presentations = new Hono<{ Bindings: Bindings }>()

// Get all presentations for a user
presentations.get('/', async (c) => {
  const userId = c.req.query('user_id') || 'default_user'
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM presentations 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(userId).all()

    return c.json({ success: true, presentations: results })
  } catch (error) {
    console.error('Error fetching presentations:', error)
    return c.json({ success: false, error: 'Failed to fetch presentations' }, 500)
  }
})

// Get single presentation
presentations.get('/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const presentation = await c.env.DB.prepare(`
      SELECT * FROM presentations WHERE id = ?
    `).bind(id).first()

    if (!presentation) {
      return c.json({ success: false, error: 'Presentation not found' }, 404)
    }

    // Get slides for this presentation
    const { results: slides } = await c.env.DB.prepare(`
      SELECT * FROM slides 
      WHERE presentation_id = ? 
      ORDER BY slide_number ASC
    `).bind(id).all()

    return c.json({ 
      success: true, 
      presentation,
      slides 
    })
  } catch (error) {
    console.error('Error fetching presentation:', error)
    return c.json({ success: false, error: 'Failed to fetch presentation' }, 500)
  }
})

// Upload and create presentation
presentations.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('user_id') as string || 'default_user'
    const settingsStr = formData.get('settings') as string
    
    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400)
    }

    const settings: PresentationSettings = settingsStr ? JSON.parse(settingsStr) : {}
    const fileType = file.name.endsWith('.pdf') ? 'pdf' : 'pptx'
    const presentationId = crypto.randomUUID()

    // Read file content
    const fileBuffer = await file.arrayBuffer()
    const base64File = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)))

    // Insert into database
    await c.env.DB.prepare(`
      INSERT INTO presentations (id, user_id, original_filename, original_file_type, status, settings, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'processing', ?, datetime('now'), datetime('now'))
    `).bind(
      presentationId,
      userId,
      file.name,
      fileType,
      JSON.stringify(settings)
    ).run()

    // Return presentation ID for GenSpark processing
    return c.json({ 
      success: true, 
      presentation_id: presentationId,
      file_data: base64File,
      file_name: file.name,
      settings 
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return c.json({ success: false, error: 'Failed to upload file' }, 500)
  }
})

// Update presentation with GenSpark task info
presentations.post('/:id/genspark', async (c) => {
  const id = c.req.param('id')
  
  try {
    const { task_id, project_url, status } = await c.req.json()

    await c.env.DB.prepare(`
      UPDATE presentations 
      SET genspark_task_id = ?, 
          genspark_project_url = ?, 
          status = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(task_id, project_url, status || 'processing', id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Error updating presentation:', error)
    return c.json({ success: false, error: 'Failed to update presentation' }, 500)
  }
})

// Update presentation status
presentations.patch('/:id/status', async (c) => {
  const id = c.req.param('id')
  
  try {
    const { status } = await c.req.json()

    await c.env.DB.prepare(`
      UPDATE presentations 
      SET status = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(status, id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Error updating status:', error)
    return c.json({ success: false, error: 'Failed to update status' }, 500)
  }
})

// Delete presentation
presentations.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    await c.env.DB.prepare(`DELETE FROM presentations WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting presentation:', error)
    return c.json({ success: false, error: 'Failed to delete presentation' }, 500)
  }
})

export default presentations
