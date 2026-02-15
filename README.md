# LMS Presentation Studio

## Project Overview
- **Name**: LMS Presentation Studio
- **Goal**: Transform PPTX and PDF presentations into interactive LMS learning experiences with AI
- **Features**: 
  - Upload PPTX/PDF presentations
  - AI-powered conversion using GenSpark Slides
  - Interactive slide editor with prompt-based changes
  - LMS-style animations and navigation
  - Automated quiz generation
  - Slide narration with ElevenLabs
  - Webhook export to Cohen Coaching platform
  - Embeddable player for LMS integration

## Architecture

### Technology Stack
- **Backend**: Hono (Cloudflare Workers)
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Vanilla JS + TailwindCSS
- **AI Services**: GenSpark Slides API
- **Narration**: ElevenLabs API
- **Deployment**: Cloudflare Pages

### Data Models
- **Presentations**: Tracks uploaded files and processing status
- **Slides**: Individual slide content with animations, quizzes, and narration
- **Exports**: Webhook export tracking for Cohen Coaching integration

## 🚀 User Flow

### **Step 1: Upload Presentation**
1. User uploads PPTX or PDF file via drag & drop
2. Configure settings:
   - Enable/disable narration with voice selection
   - Set quiz frequency (after each slide or custom count)
   - Enter webhook URL for Cohen Coaching export (optional)
3. Click "Generate AI Presentation"

### **Step 2: GenSpark AI Processing**
1. File is saved to database with "processing" status
2. System prepares GenSpark request with:
   - Professional design instructions
   - LMS-specific formatting
   - Brand consistency requirements
3. User is redirected to editor page

### **Step 3: Launch GenSpark Editor**
1. Editor page displays "Launch GenSpark AI Editor" button
2. User clicks to trigger GenSpark slides creation
3. GenSpark SuperAgent creates professional slides (calls `create_agent` tool)
4. GenSpark editor loads in iframe for user to edit

### **Step 4: Edit with GenSpark SuperAgent**
Users can make changes using GenSpark's AI editor:
- **Prompt for changes** across entire deck or specific slides
- **Change images** - AI can find and replace images
- **Modify layouts** - Adjust slide structure and design
- **Update content** - Edit text, add/remove elements
- **Apply branding** - Consistent colors, fonts, themes
- **Add animations** - LMS-style click-through animations
- **Generate quizzes** - AI creates quiz questions from content
- **Add narration** - Text-to-speech for each slide

### **Step 5: Export Presentation**
After editing is complete, user chooses export destination:

**Option 1: Export to Webhook (Cohen Coaching)**
- Sends complete presentation data via webhook
- Includes all slides, quizzes, narration URLs, animations
- Tracked in exports table with status

**Option 2: Export to Google Drive**
- Opens GenSpark project URL in new tab
- User can export from GenSpark to Google Slides
- Or download as PDF/PPTX

### **Step 6: Play in LMS**
- Presentation can be viewed in full-screen player
- LMS-style navigation with keyboard controls
- Animated transitions between slides
- Interactive quizzes with instant feedback
- Audio narration (if enabled)
- Progress tracking

---

## 🔄 Integration Flow Details

### **Upload to Editor Flow:**
```
Upload PPTX/PDF 
  → Save to database (status: processing)
  → Prepare GenSpark request data
  → Redirect to editor page
  → Show "Launch GenSpark" button
  → User clicks button
  → Call create_agent (slides task)
  → GenSpark creates AI slides
  → Editor iframe loads with project URL
  → User edits in GenSpark SuperAgent
```

### **Export Flow:**
```
User finishes editing
  → Clicks "Export" button
  → Choose: Webhook or Google Drive
  
  If Webhook:
    → Fetch all slides from database
    → Format as JSON with metadata
    → Send POST to webhook URL
    → Track export status
    → Show confirmation
    
  If Google Drive:
    → Open GenSpark project URL
    → User exports from GenSpark UI
    → Download or save to Google Drive
```

---

### ✅ Currently Implemented
1. **File Upload System**
   - Drag & drop PPTX/PDF upload
   - File type validation
   - Base64 encoding for processing

2. **Presentation Settings**
   - Enable/disable narration
   - Voice selection
   - Quiz configuration (after each slide or custom count)
   - Webhook URL for export

3. **Database Schema**
   - Presentations table with status tracking
   - Slides table with full content support
   - Exports table for webhook tracking
   - Proper indexes and foreign keys

4. **API Routes**
   - `/api/presentations` - CRUD operations
   - `/api/slides` - Slide management
   - `/api/editor` - Editor integration
   - `/api/player` - Player data and view
   - `/api/webhooks` - Export functionality

5. **Slide Player**
   - Full-screen LMS-style player
   - Keyboard navigation (arrow keys, space)
   - Animated slide transitions
   - Quiz integration with feedback
   - Narration controls
   - Progress tracking
   - Completion screen

6. **Frontend Interface**
   - Modern, responsive UI
   - Presentation library
   - Upload wizard with settings
   - Real-time status updates

### 🔨 To Be Implemented

1. **GenSpark Integration**
   - Call `create_agent` API for slides generation
   - Handle task callbacks
   - Embed editor iframe
   - Sync slides from editor

2. **ElevenLabs Narration**
   - Generate audio for slides
   - Upload to storage (R2)
   - Link audio URLs to slides

3. **Quiz Generation**
   - Use GenSpark AI to create quizzes
   - Auto-distribute based on settings
   - Support multiple question types

4. **Cohen Coaching Webhook**
   - Format export data
   - Handle authentication
   - Retry logic for failed exports

5. **Editor Enhancements**
   - Animation controls UI
   - Image replacement
   - Layout changes
   - Brand theme application

## API Endpoints

### Presentations
- `GET /api/presentations` - List all presentations
- `GET /api/presentations/:id` - Get single presentation with slides
- `POST /api/presentations/upload` - Upload PPTX/PDF
- `POST /api/presentations/:id/genspark` - Update GenSpark task info
- `PATCH /api/presentations/:id/status` - Update status
- `DELETE /api/presentations/:id` - Delete presentation

### Slides
- `GET /api/slides/:presentation_id` - Get all slides
- `GET /api/slides/:presentation_id/:slide_id` - Get single slide
- `POST /api/slides/:presentation_id` - Create/update slide
- `PATCH /api/slides/:presentation_id/:slide_id/animations` - Update animations
- `PATCH /api/slides/:presentation_id/:slide_id/narration` - Update narration
- `PATCH /api/slides/:presentation_id/:slide_id/quiz` - Update quiz
- `DELETE /api/slides/:presentation_id/:slide_id` - Delete slide

### Editor
- `GET /api/editor/:presentation_id` - Get editor URL
- `POST /api/editor/:presentation_id/sync` - Sync slides from editor
- `POST /api/editor/:presentation_id/generate-quizzes` - Generate quiz configuration
- `POST /api/editor/:presentation_id/generate-narration` - Prepare narration jobs
- `POST /api/editor/:presentation_id/update-narration` - Update narration URLs

### Player
- `GET /api/player/:presentation_id` - Get player data
- `GET /api/player/:presentation_id/view` - Render player HTML
- `POST /api/player/:presentation_id/progress` - Track progress

### Webhooks
- `POST /api/webhooks/:presentation_id/export` - Export to Cohen Coaching
- `GET /api/webhooks/:presentation_id/exports` - Get export history
- `POST /api/webhooks/genspark/callback` - GenSpark callback handler

## Development Setup

### Prerequisites
- Node.js 18+
- Wrangler CLI
- Cloudflare account

### Local Development

```bash
# Install dependencies
npm install

# Initialize local database
npm run db:migrate:local

# Build the project
npm run build

# Start development server with PM2
pm2 start ecosystem.config.cjs

# Test the server
npm test

# View logs
pm2 logs webapp --nostream
```

### Database Commands

```bash
# Apply migrations to local database
npm run db:migrate:local

# Apply migrations to production
npm run db:migrate:prod

# Seed local database (if seed.sql exists)
npm run db:seed

# Reset local database
npm run db:reset

# Query local database
npm run db:console:local
```

## Deployment

### Cloudflare Pages Deployment

1. **Setup Cloudflare API Key**
   - Get API key from Cloudflare dashboard
   - Set in Deploy tab or use `wrangler login`

2. **Create D1 Database**
   ```bash
   npx wrangler d1 create webapp-production
   # Update database_id in wrangler.jsonc
   ```

3. **Apply Migrations**
   ```bash
   npm run db:migrate:prod
   ```

4. **Deploy**
   ```bash
   npm run deploy:prod
   ```

5. **Set Environment Variables**
   ```bash
   # Add API keys as secrets
   npx wrangler pages secret put ELEVENLABS_API_KEY --project-name webapp
   npx wrangler pages secret put GENSPARK_API_KEY --project-name webapp
   ```

### Configuration Files
- `wrangler.jsonc` - Cloudflare configuration
- `vite.config.ts` - Build configuration
- `ecosystem.config.cjs` - PM2 configuration for local dev
- `package.json` - Dependencies and scripts

## Integration with Cohen Coaching

### Webhook Export Format

```json
{
  "presentation_id": "uuid",
  "genspark_project_url": "https://genspark.ai/agents?id=...",
  "original_filename": "lesson.pptx",
  "total_slides": 10,
  "created_at": "2026-02-15T12:00:00Z",
  "settings": {
    "enable_narration": true,
    "enable_quizzes": true,
    "quiz_frequency": "custom",
    "quiz_count": 3
  },
  "slides": [
    {
      "id": "uuid",
      "slide_number": 1,
      "title": "Introduction",
      "content": {...},
      "animations": [...],
      "narration_audio_url": "https://...",
      "quiz_enabled": false,
      "quiz_data": null
    }
  ]
}
```

### Embedding the Player

```html
<iframe 
  src="https://webapp.pages.dev/api/player/PRESENTATION_ID/view"
  width="100%"
  height="600px"
  frameborder="0"
  allowfullscreen>
</iframe>
```

## Next Steps

1. **Integrate GenSpark API** - Call `create_agent` for slide generation
2. **Add ElevenLabs integration** - Generate narration audio
3. **Implement quiz AI** - Use GenSpark to create quiz questions
4. **Test webhook export** - Validate with Cohen Coaching API
5. **Add authentication** - User management and permissions
6. **Enhance editor** - More customization options
7. **Add analytics** - Track learner engagement

## URLs
- **GitHub**: https://github.com/mattcohenmhc/CC-Content-LMS
- **Production**: (Deploy to get URL)

## Status
- ✅ **Core Backend**: Complete
- ✅ **Database Schema**: Complete
- ✅ **Frontend UI**: Complete
- ✅ **Player**: Complete
- 🔨 **GenSpark Integration**: Pending
- 🔨 **Narration**: Pending
- 🔨 **Production Deploy**: Pending

## Last Updated
2026-02-15

---

## 📝 Implementation Summary (Latest Update)

### ✅ What's Working Now:
1. **Complete Upload Flow** - Upload PPTX/PDF with settings configuration
2. **GenSpark Integration Prepared** - Request data formatted for create_agent
3. **Editor Launch UI** - Button to trigger GenSpark AI slide creation
4. **Dual Export Options** - Webhook (Cohen Coaching) or Google Drive
5. **Full Database Schema** - All tables and relationships complete
6. **LMS Player** - Complete with quizzes, animations, narration support
7. **Responsive UI** - Modern interface with TailwindCSS

### 🔧 Integration Point for Production:

The app is ready for GenSpark integration. To make it production-ready:

**Backend Call to create_agent:**
```typescript
// In src/routes/genspark.ts - add actual create_agent call
const agentResponse = await create_agent({
  task_type: 'slides',
  task_name: fileName,
  query: query,
  instructions: instructions
})

// Then save the response
await updatePresentationWithAgentInfo(
  presentationId,
  agentResponse.task_id,
  agentResponse.project_url
)
```

The frontend will then automatically:
- Load the GenSpark editor in an iframe
- Allow user to edit with AI prompts
- Provide export options when done

### 🎯 Current User Experience:

1. Upload → Settings → Click "Generate"
2. Redirected to editor with "Launch GenSpark AI Editor" button
3. Click button → (Simulated agent creation for demo)
4. Edit in GenSpark SuperAgent interface
5. Export via Webhook or Google Drive
6. View in LMS Player with full interactivity

### 📍 Live URLs:
- **Application**: https://3000-i1par5ljavte6nc7nl001-cbeee0f9.sandbox.novita.ai
- **GitHub**: https://github.com/mattcohenmhc/CC-Content-LMS

