import { Hono } from 'hono'
import type { Bindings } from '../types'

const editor = new Hono<{ Bindings: Bindings }>()

// This route handles the GenSpark SuperAgent editor integration
// The editor will be opened in an iframe pointing to the GenSpark project URL

// Get editor URL for a presentation
editor.get('/:presentation_id', async (c) => {
  const presentationId = c.req.param('presentation_id')
  
  try {
    const presentation = await c.env.DB.prepare(`
      SELECT genspark_project_url FROM presentations WHERE id = ?
    `).bind(presentationId).first()

    if (!presentation) {
      return c.json({ success: false, error: 'Presentation not found' }, 404)
    }

    return c.json({ 
      success: true, 
      editor_url: presentation.genspark_project_url 
    })
  } catch (error) {
    console.error('Error fetching editor URL:', error)
    return c.json({ success: false, error: 'Failed to fetch editor URL' }, 500)
  }
})

// Handle editor updates (from GenSpark callbacks or manual sync)
editor.post('/:presentation_id/sync', async (c) => {
  const presentationId = c.req.param('presentation_id')
  
  try {
    const { slides } = await c.req.json()

    // Update all slides from GenSpark editor
    for (const slide of slides) {
      await c.env.DB.prepare(`
        INSERT INTO slides (
          id, presentation_id, slide_number, title, content, 
          animations, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          slide_number = excluded.slide_number,
          title = excluded.title,
          content = excluded.content,
          animations = excluded.animations,
          updated_at = datetime('now')
      `).bind(
        slide.id || crypto.randomUUID(),
        presentationId,
        slide.slide_number,
        slide.title,
        JSON.stringify(slide.content),
        JSON.stringify(slide.animations || [])
      ).run()
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Error syncing slides:', error)
    return c.json({ success: false, error: 'Failed to sync slides' }, 500)
  }
})

// Generate quizzes for slides using AI prompt
editor.post('/:presentation_id/generate-quizzes', async (c) => {
  const presentationId = c.req.param('presentation_id')
  
  try {
    const { frequency, count, custom_slides } = await c.req.json()

    // Get all slides
    const { results: slides } = await c.env.DB.prepare(`
      SELECT * FROM slides 
      WHERE presentation_id = ? 
      ORDER BY slide_number ASC
    `).bind(presentationId).all()

    // Determine which slides should have quizzes
    let quizSlides: any[] = []
    
    if (frequency === 'after_each') {
      quizSlides = slides
    } else if (custom_slides && custom_slides.length > 0) {
      quizSlides = slides.filter((s: any) => custom_slides.includes(s.id))
    } else if (count) {
      // Distribute quizzes evenly
      const interval = Math.floor(slides.length / count)
      quizSlides = slides.filter((_: any, i: number) => i % interval === interval - 1)
    }

    // Note: Quiz generation would happen via GenSpark AI in the editor
    // This endpoint prepares the configuration for quiz placement
    
    return c.json({ 
      success: true, 
      quiz_slides: quizSlides.map((s: any) => s.id),
      message: 'Quiz configuration prepared. Use GenSpark editor to generate quiz content.'
    })
  } catch (error) {
    console.error('Error generating quizzes:', error)
    return c.json({ success: false, error: 'Failed to generate quizzes' }, 500)
  }
})

// Generate narration for slides
editor.post('/:presentation_id/generate-narration', async (c) => {
  const presentationId = c.req.param('presentation_id')
  
  try {
    const { voice_id, slide_ids } = await c.req.json()

    // Get slides to narrate
    const { results: slides } = await c.env.DB.prepare(`
      SELECT * FROM slides 
      WHERE presentation_id = ? 
      ${slide_ids ? 'AND id IN (' + slide_ids.map(() => '?').join(',') + ')' : ''}
      ORDER BY slide_number ASC
    `).bind(presentationId, ...(slide_ids || [])).all()

    // Extract text content for narration
    const narrationJobs = slides.map((slide: any) => ({
      slide_id: slide.id,
      text: slide.narration_text || slide.title || 'Slide content',
      voice_id
    }))

    return c.json({ 
      success: true, 
      narration_jobs: narrationJobs,
      message: 'Narration jobs prepared. Process with ElevenLabs API on client side.'
    })
  } catch (error) {
    console.error('Error preparing narration:', error)
    return c.json({ success: false, error: 'Failed to prepare narration' }, 500)
  }
})

// Update narration URLs after generation
editor.post('/:presentation_id/update-narration', async (c) => {
  const presentationId = c.req.param('presentation_id')
  
  try {
    const { narrations } = await c.req.json()

    for (const narration of narrations) {
      await c.env.DB.prepare(`
        UPDATE slides 
        SET narration_audio_url = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(narration.audio_url, narration.slide_id).run()
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Error updating narration:', error)
    return c.json({ success: false, error: 'Failed to update narration' }, 500)
  }
})

export default editor
