import { Hono } from 'hono'
import type { Bindings, Slide, SlideAnimation, Quiz } from '../types'

const slides = new Hono<{ Bindings: Bindings }>()

// Get all slides for a presentation
slides.get('/:presentation_id', async (c) => {
  const presentationId = c.req.param('presentation_id')
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM slides 
      WHERE presentation_id = ? 
      ORDER BY slide_number ASC
    `).bind(presentationId).all()

    return c.json({ success: true, slides: results })
  } catch (error) {
    console.error('Error fetching slides:', error)
    return c.json({ success: false, error: 'Failed to fetch slides' }, 500)
  }
})

// Get single slide
slides.get('/:presentation_id/:slide_id', async (c) => {
  const slideId = c.req.param('slide_id')
  
  try {
    const slide = await c.env.DB.prepare(`
      SELECT * FROM slides WHERE id = ?
    `).bind(slideId).first()

    if (!slide) {
      return c.json({ success: false, error: 'Slide not found' }, 404)
    }

    return c.json({ success: true, slide })
  } catch (error) {
    console.error('Error fetching slide:', error)
    return c.json({ success: false, error: 'Failed to fetch slide' }, 500)
  }
})

// Create or update slide
slides.post('/:presentation_id', async (c) => {
  const presentationId = c.req.param('presentation_id')
  
  try {
    const slideData = await c.req.json()
    const slideId = slideData.id || crypto.randomUUID()

    await c.env.DB.prepare(`
      INSERT INTO slides (
        id, presentation_id, slide_number, title, content, 
        animations, narration_text, narration_audio_url,
        quiz_enabled, quiz_data, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        animations = excluded.animations,
        narration_text = excluded.narration_text,
        narration_audio_url = excluded.narration_audio_url,
        quiz_enabled = excluded.quiz_enabled,
        quiz_data = excluded.quiz_data,
        updated_at = datetime('now')
    `).bind(
      slideId,
      presentationId,
      slideData.slide_number,
      slideData.title,
      JSON.stringify(slideData.content),
      JSON.stringify(slideData.animations || []),
      slideData.narration_text,
      slideData.narration_audio_url,
      slideData.quiz_enabled ? 1 : 0,
      JSON.stringify(slideData.quiz_data || null)
    ).run()

    return c.json({ success: true, slide_id: slideId })
  } catch (error) {
    console.error('Error saving slide:', error)
    return c.json({ success: false, error: 'Failed to save slide' }, 500)
  }
})

// Update slide animations
slides.patch('/:presentation_id/:slide_id/animations', async (c) => {
  const slideId = c.req.param('slide_id')
  
  try {
    const { animations } = await c.req.json()

    await c.env.DB.prepare(`
      UPDATE slides 
      SET animations = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(JSON.stringify(animations), slideId).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Error updating animations:', error)
    return c.json({ success: false, error: 'Failed to update animations' }, 500)
  }
})

// Update slide narration
slides.patch('/:presentation_id/:slide_id/narration', async (c) => {
  const slideId = c.req.param('slide_id')
  
  try {
    const { narration_text, narration_audio_url } = await c.req.json()

    await c.env.DB.prepare(`
      UPDATE slides 
      SET narration_text = ?,
          narration_audio_url = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(narration_text, narration_audio_url, slideId).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Error updating narration:', error)
    return c.json({ success: false, error: 'Failed to update narration' }, 500)
  }
})

// Update slide quiz
slides.patch('/:presentation_id/:slide_id/quiz', async (c) => {
  const slideId = c.req.param('slide_id')
  
  try {
    const { quiz_enabled, quiz_data } = await c.req.json()

    await c.env.DB.prepare(`
      UPDATE slides 
      SET quiz_enabled = ?,
          quiz_data = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(quiz_enabled ? 1 : 0, JSON.stringify(quiz_data), slideId).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Error updating quiz:', error)
    return c.json({ success: false, error: 'Failed to update quiz' }, 500)
  }
})

// Delete slide
slides.delete('/:presentation_id/:slide_id', async (c) => {
  const slideId = c.req.param('slide_id')
  
  try {
    await c.env.DB.prepare(`DELETE FROM slides WHERE id = ?`).bind(slideId).run()
    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting slide:', error)
    return c.json({ success: false, error: 'Failed to delete slide' }, 500)
  }
})

export default slides
