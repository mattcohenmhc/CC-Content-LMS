#!/bin/bash

# GenSpark Agent Creation Script
# This script is meant to be run by the AI assistant that has access to create_agent

WEBAPP_URL="http://localhost:3000"
PRESENTATION_ID=$1

if [ -z "$PRESENTATION_ID" ]; then
  echo "Usage: $0 <presentation_id>"
  echo ""
  echo "Example: $0 123e4567-e89b-12d3-a456-426614174000"
  exit 1
fi

echo "🚀 Creating GenSpark slides for presentation: $PRESENTATION_ID"
echo ""

# Get the agent parameters from webapp
echo "📡 Fetching presentation details..."
RESPONSE=$(curl -s -X POST "$WEBAPP_URL/api/genspark/launch-agent" \
  -H "Content-Type: application/json" \
  -d "{\"presentation_id\": \"$PRESENTATION_ID\"}")

echo "$RESPONSE" | jq .

# Check if successful
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo ""
  echo "✅ Agent parameters prepared!"
  echo ""
  echo "📋 To complete the integration, call create_agent with these parameters:"
  echo "$RESPONSE" | jq '.create_agent_params'
  echo ""
  echo "💡 The AI assistant needs to call create_agent from its environment"
  echo "   This cannot be done from Cloudflare Workers"
else
  echo ""
  echo "❌ Failed to prepare agent parameters"
  echo "$RESPONSE" | jq -r '.error'
  exit 1
fi
