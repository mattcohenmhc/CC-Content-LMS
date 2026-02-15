import { Hono } from 'hono'
import type { Bindings } from '../types'

const player = new Hono<{ Bindings: Bindings }>()

// Get player data for a presentation
player.get('/:presentation_id', async (c) => {
  const presentationId = c.req.param('presentation_id')
  
  try {
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

    // Parse JSON fields
    const parsedSlides = slides.map((slide: any) => ({
      ...slide,
      content: slide.content ? JSON.parse(slide.content) : null,
      animations: slide.animations ? JSON.parse(slide.animations) : [],
      quiz_data: slide.quiz_data ? JSON.parse(slide.quiz_data) : null,
    }))

    const settings = presentation.settings ? JSON.parse(presentation.settings as string) : {}

    return c.json({ 
      success: true, 
      presentation: {
        ...presentation,
        settings
      },
      slides: parsedSlides,
      total_slides: slides.length
    })
  } catch (error) {
    console.error('Error fetching player data:', error)
    return c.json({ success: false, error: 'Failed to fetch player data' }, 500)
  }
})

// Track player progress (optional analytics)
player.post('/:presentation_id/progress', async (c) => {
  const presentationId = c.req.param('presentation_id')
  
  try {
    const { slide_number, completed, quiz_results } = await c.req.json()

    // You could store analytics in another table if needed
    // For now, just return success
    
    return c.json({ 
      success: true,
      message: 'Progress tracked'
    })
  } catch (error) {
    console.error('Error tracking progress:', error)
    return c.json({ success: false, error: 'Failed to track progress' }, 500)
  }
})

// Render the player HTML
player.get('/:presentation_id/view', async (c) => {
  const presentationId = c.req.param('presentation_id')
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LMS Player</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; overflow: hidden; }
          .slide-container { 
            width: 100vw; 
            height: 100vh; 
            display: flex;
            flex-direction: column;
          }
          .slide-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .slide-controls {
            background: #1e293b;
            color: white;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .animation-fade { animation: fadeIn 0.5s; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .animation-slide { animation: slideIn 0.5s; }
          @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
          .quiz-container {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            max-width: 600px;
            margin: 0 auto;
          }
        </style>
    </head>
    <body>
        <div id="player" class="slide-container"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/player.js"></script>
        <script>
          window.PRESENTATION_ID = '${presentationId}';
        </script>
    </body>
    </html>
  `)
})

export default player
