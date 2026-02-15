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

## Features

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
