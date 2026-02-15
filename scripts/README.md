# GenSpark Integration Scripts

## Overview

These scripts help integrate the GenSpark `create_agent` tool with your LMS Presentation Studio.

## The Challenge

The `create_agent` tool is only available in the AI assistant's environment, NOT in:
- Cloudflare Workers (where your app runs)
- Regular Node.js servers
- Browser JavaScript

## Solutions

### Option 1: AI Assistant Integration (Recommended for Development)

Have the AI assistant run the integration:

1. User uploads presentation in webapp
2. User clicks "Launch GenSpark AI Editor"
3. Webapp prepares the parameters
4. You (the developer) ask the AI assistant: 
   ```
   "Please create GenSpark slides for presentation ID: <id>"
   ```
5. AI assistant calls `create_agent` with the parameters
6. AI assistant updates the webapp with the result

### Option 2: GenSpark API Integration (For Production)

Contact GenSpark to get direct API access:

1. Get GenSpark API credentials
2. Implement API calls in your backend
3. Replace the `create_agent` calls with API requests

## Files

### `create-genspark-agent.sh`

Bash script to fetch parameters and display them:

```bash
chmod +x scripts/create-genspark-agent.sh
./scripts/create-genspark-agent.sh <presentation-id>
```

### `genspark-integration.js`

Node.js example showing the integration flow:

```javascript
const { createGenSparkSlides } = require('./scripts/genspark-integration');
await createGenSparkSlides('presentation-id');
```

## Manual Integration Steps

### 1. Get Agent Parameters

```bash
curl -X POST http://localhost:3000/api/genspark/launch-agent \
  -H "Content-Type: application/json" \
  -d '{"presentation_id": "YOUR_ID"}'
```

Response:
```json
{
  "success": true,
  "create_agent_params": {
    "task_type": "slides",
    "task_name": "presentation",
    "query": "Create professional LMS presentation...",
    "instructions": "You are a professional presentation designer..."
  }
}
```

### 2. Call create_agent (AI Assistant Only)

```javascript
const response = await create_agent({
  task_type: "slides",
  task_name: "presentation",
  query: "...",
  instructions: "..."
});
```

### 3. Update Webapp

```bash
curl -X POST http://localhost:3000/api/genspark/update-agent-info \
  -H "Content-Type: application/json" \
  -d '{
    "presentation_id": "YOUR_ID",
    "task_id": "task-123",
    "project_url": "https://www.genspark.ai/agents?id=123"
  }'
```

## Testing Without create_agent

The webapp currently simulates the create_agent call for testing:
- Upload works
- Editor UI shows
- Export works
- All features except real GenSpark generation work

## Production Deployment

For production with real GenSpark integration:

1. **Option A**: Contact GenSpark for API access
2. **Option B**: Set up a service with AI assistant that can call create_agent
3. **Option C**: Modify to use GenSpark's public API (if available)

## Questions?

Check the main README.md for more details or contact support.
