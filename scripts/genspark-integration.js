/**
 * GenSpark Agent Integration Script
 * 
 * This script demonstrates how to integrate the create_agent tool
 * Since create_agent is only available in the AI assistant environment,
 * you have two options for production:
 * 
 * Option 1: Call this endpoint from your application
 * Option 2: Implement direct API integration with GenSpark
 */

const axios = require('axios');

// Your webapp API endpoint
const WEBAPP_API = 'http://localhost:3000/api';

/**
 * This function should be called by the AI assistant that has access to create_agent
 * In production, you would need to set up a service that can call create_agent
 */
async function createGenSparkSlides(presentationId) {
  try {
    // Step 1: Get the agent parameters from your webapp
    const response = await axios.post(`${WEBAPP_API}/genspark/launch-agent`, {
      presentation_id: presentationId
    });

    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    const params = response.data.create_agent_params;
    
    console.log('Creating GenSpark agent with params:', params);

    // Step 2: Call create_agent (this requires AI assistant environment)
    // NOTE: This is pseudo-code - create_agent is only available in AI environment
    /*
    const agentResponse = await create_agent({
      task_type: params.task_type,
      task_name: params.task_name,
      query: params.query,
      instructions: params.instructions
    });
    */

    // For demo purposes, simulate the response
    const agentResponse = {
      task_id: `task-${Date.now()}`,
      session_id: `session-${Date.now()}`,
      project_url: `https://www.genspark.ai/agents?id=${Date.now()}`,
      status: 'success'
    };

    console.log('GenSpark agent created:', agentResponse);

    // Step 3: Update your webapp with the agent info
    await axios.post(`${WEBAPP_API}/genspark/update-agent-info`, {
      presentation_id: presentationId,
      task_id: agentResponse.task_id,
      session_id: agentResponse.session_id,
      project_url: agentResponse.project_url
    });

    console.log('✅ Presentation updated with GenSpark agent info');

    return agentResponse;

  } catch (error) {
    console.error('Error creating GenSpark slides:', error.message);
    throw error;
  }
}

/**
 * Example usage
 */
async function main() {
  // Example: Create slides for a presentation
  const presentationId = 'your-presentation-id-here';
  
  try {
    const result = await createGenSparkSlides(presentationId);
    console.log('\n✅ Success! GenSpark editor URL:', result.project_url);
  } catch (error) {
    console.error('\n❌ Failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createGenSparkSlides };
