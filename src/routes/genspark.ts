import { Hono } from 'hono'
import type { Bindings } from '../types'

const genspark = new Hono<{ Bindings: Bindings }>()

// IMPORTANT: This endpoint should be called from the backend to trigger create_agent
// For actual implementation, you would need to import and call the create_agent function
// For now, this prepares the data structure that create_agent expects

// Create GenSpark slides from uploaded file
genspark.post('/create-slides', async (c) => {
  try {
    const { presentation_id, file_name, file_data, settings } = await c.req.json()

    if (!presentation_id || !file_name || !file_data) {
      return c.json({ success: false, error: 'Missing required parameters' }, 400)
    }

    // Update status to processing
    await c.env.DB.prepare(`
      UPDATE presentations 
      SET status = 'processing',
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(presentation_id).run()

    // Prepare instructions for GenSpark
    const instructions = `
You are a professional presentation designer and LMS content creator.

Task: Convert the uploaded ${file_name.endsWith('.pdf') ? 'PDF' : 'PowerPoint'} presentation into a modern, professional slide deck suitable for an LMS (Learning Management System).

Requirements:
1. Maintain the original content and structure
2. Apply a clean, modern design with consistent branding
3. Use professional color schemes and typography
4. Make each slide self-contained as a lesson
5. Add clear titles and organize content logically
6. Ensure readability and visual hierarchy
7. Use bullet points, images, and diagrams where appropriate

${settings.enable_quizzes ? `
8. Prepare quiz questions based on content (user will configure placement later)
` : ''}

${settings.enable_narration ? `
9. Ensure content is suitable for audio narration
` : ''}

Output: A complete presentation with all slides properly formatted and ready for LMS use.

The user will be able to edit the slides using your SuperAgent editor interface. They can:
- Prompt for changes to any slide or across the entire deck
- Change images and layouts
- Modify text and styling
- Add animations for LMS-style navigation
- Generate quizzes with custom settings
- Add narration to slides

After they finish editing, they will export the final presentation to their LMS platform.
    `.trim()

    const query = `Create a professional LMS presentation from "${file_name}". Transform the content into modern, clean slides with consistent design theme and make each slide its own lesson. Apply professional branding and ensure the presentation is ready for interactive learning.`

    // Build the request body for create_agent
    const requestBody = {
      task_type: 'slides',
      task_name: file_name.replace(/\.(pptx|pdf)$/i, ''),
      query: query,
      instructions: instructions
    }

    // Store the request for the frontend to use
    return c.json({ 
      success: true,
      presentation_id,
      genspark_request: requestBody,
      message: 'Ready to create GenSpark slides. The editor will launch the agent.'
    })

  } catch (error) {
    console.error('Error preparing GenSpark slides:', error)
    return c.json({ success: false, error: 'Failed to prepare slides creation' }, 500)
  }
})

// Update presentation with GenSpark agent info
genspark.post('/update-agent-info', async (c) => {
  try {
    const { presentation_id, task_id, session_id, project_url } = await c.req.json()

    if (!presentation_id) {
      return c.json({ success: false, error: 'Missing presentation_id' }, 400)
    }

    await c.env.DB.prepare(`
      UPDATE presentations 
      SET genspark_task_id = ?,
          genspark_project_url = ?,
          status = 'completed',
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(task_id || session_id, project_url, presentation_id).run()

    return c.json({ 
      success: true,
      message: 'Agent info updated successfully'
    })

  } catch (error) {
    console.error('Error updating agent info:', error)
    return c.json({ success: false, error: 'Failed to update agent info' }, 500)
  }
})

export default genspark
