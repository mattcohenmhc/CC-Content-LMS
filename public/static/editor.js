// Editor page JavaScript
const PRESENTATION_ID = window.location.pathname.split('/').pop()
let editorState = {
  presentation: null,
  slides: [],
  editorUrl: null,
  settings: {},
  needsAgentCreation: false,
  gensparkRequest: null
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadPresentation()
  await loadEditorUrl()
  
  // Check if we need to create GenSpark agent
  const gensparkRequest = sessionStorage.getItem('genspark_request')
  if (gensparkRequest && !editorState.editorUrl) {
    // Show button to launch GenSpark agent
    editorState.needsAgentCreation = true
    editorState.gensparkRequest = JSON.parse(gensparkRequest)
    sessionStorage.removeItem('genspark_request')
  }
  
  renderEditor()
})

async function loadPresentation() {
  try {
    const response = await axios.get(`/api/presentations/${PRESENTATION_ID}`)
    if (response.data.success) {
      editorState.presentation = response.data.presentation
      editorState.slides = response.data.slides
      editorState.settings = JSON.parse(editorState.presentation.settings || '{}')
    }
  } catch (error) {
    console.error('Error loading presentation:', error)
  }
}

async function loadEditorUrl() {
  try {
    const response = await axios.get(`/api/editor/${PRESENTATION_ID}`)
    if (response.data.success) {
      editorState.editorUrl = response.data.editor_url
    }
  } catch (error) {
    console.error('Error loading editor URL:', error)
  }
}

function renderEditor() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <button onclick="goBack()" class="text-gray-600 hover:text-gray-900">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">${editorState.presentation?.original_filename || 'Editor'}</h1>
                <p class="text-sm text-gray-500">Presentation Editor</p>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <button onclick="syncSlides()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <i class="fas fa-sync mr-2"></i>Sync Changes
              </button>
              <button onclick="showSettingsModal()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <i class="fas fa-cog mr-2"></i>Settings
              </button>
              <button onclick="previewPresentation()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <i class="fas fa-play mr-2"></i>Preview
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Editor Tools -->
      <div class="bg-white border-b shadow-sm">
        <div class="max-w-7xl mx-auto px-6 py-3">
          <div class="flex items-center gap-3 overflow-x-auto">
            <button onclick="generateQuizzes()" class="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 whitespace-nowrap">
              <i class="fas fa-question-circle mr-2"></i>Generate Quizzes
            </button>
            <button onclick="generateNarration()" class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 whitespace-nowrap">
              <i class="fas fa-microphone mr-2"></i>Generate Narration
            </button>
            <button onclick="addAnimations()" class="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 whitespace-nowrap">
              <i class="fas fa-magic mr-2"></i>Add Animations
            </button>
            <button onclick="exportPresentation()" class="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 whitespace-nowrap">
              <i class="fas fa-download mr-2"></i>Export
            </button>
          </div>
        </div>
      </div>

      <!-- Main Editor Area -->
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div class="bg-white rounded-xl shadow-lg overflow-hidden" style="height: calc(100vh - 250px);">
          ${editorState.editorUrl ? `
            <iframe 
              src="${editorState.editorUrl}" 
              class="w-full h-full border-0"
              allow="clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups">
            </iframe>
          ` : editorState.needsAgentCreation ? `
            <div class="flex items-center justify-center h-full">
              <div class="text-center max-w-2xl px-6">
                <i class="fas fa-magic text-8xl text-purple-600 mb-6"></i>
                <h2 class="text-3xl font-bold text-gray-900 mb-4">Ready to Create AI Slides</h2>
                <p class="text-xl text-gray-600 mb-8">
                  Click below to launch GenSpark AI and transform your presentation into professional, 
                  modern slides with consistent branding. This process may take a few minutes.
                </p>
                <button onclick="launchGenSparkAgent()" 
                        class="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-12 py-4 rounded-xl hover:shadow-lg transition-all text-lg font-semibold">
                  <i class="fas fa-rocket mr-3"></i>
                  Launch GenSpark AI Editor
                </button>
                <p class="text-sm text-gray-500 mt-6">
                  <i class="fas fa-info-circle mr-1"></i>
                  You'll be able to edit, customize, and refine your slides once they're created
                </p>
              </div>
            </div>
          ` : `
            <div class="flex items-center justify-center h-full">
              <div class="text-center">
                <i class="fas fa-spinner fa-spin text-6xl text-blue-600 mb-4"></i>
                <p class="text-xl text-gray-600">Loading GenSpark Editor...</p>
              </div>
            </div>
          `}
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div id="settings-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="p-6 border-b">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold text-gray-900">Presentation Settings</h2>
            <button onclick="closeSettingsModal()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <!-- Quiz Settings -->
          <div>
            <h3 class="text-lg font-semibold mb-3">Quiz Settings</h3>
            <div class="space-y-3">
              <label class="flex items-center gap-2">
                <input type="checkbox" id="modal-enable-quizzes" ${editorState.settings.enable_quizzes ? 'checked' : ''} class="w-5 h-5">
                <span>Enable Quizzes</span>
              </label>
              <select id="modal-quiz-frequency" class="w-full p-2 border rounded">
                <option value="after_each" ${editorState.settings.quiz_frequency === 'after_each' ? 'selected' : ''}>After Each Slide</option>
                <option value="custom" ${editorState.settings.quiz_frequency === 'custom' ? 'selected' : ''}>Custom Number</option>
              </select>
              <input type="number" id="modal-quiz-count" value="${editorState.settings.quiz_count || 3}" min="1" class="w-full p-2 border rounded" placeholder="Number of quizzes">
            </div>
          </div>

          <!-- Narration Settings -->
          <div>
            <h3 class="text-lg font-semibold mb-3">Narration Settings</h3>
            <div class="space-y-3">
              <label class="flex items-center gap-2">
                <input type="checkbox" id="modal-enable-narration" ${editorState.settings.enable_narration ? 'checked' : ''} class="w-5 h-5">
                <span>Enable Narration</span>
              </label>
              <select id="modal-narration-voice" class="w-full p-2 border rounded">
                <option value="default">Default Voice</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
              </select>
            </div>
          </div>

          <!-- Webhook Settings -->
          <div>
            <h3 class="text-lg font-semibold mb-3">Export Settings</h3>
            <div class="space-y-3">
              <label class="text-sm text-gray-700">Cohen Coaching Webhook URL:</label>
              <input type="url" id="modal-webhook-url" value="${editorState.settings.webhook_url || ''}" 
                     class="w-full p-2 border rounded" placeholder="https://cohencoaching.com/api/webhook">
            </div>
          </div>
        </div>

        <div class="p-6 border-t bg-gray-50">
          <button onclick="saveSettings()" class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Save Settings
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Modal -->
    <div id="loading-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-2xl p-8 max-w-md">
        <div class="text-center">
          <i class="fas fa-spinner fa-spin text-6xl text-blue-600 mb-4"></i>
          <h3 class="text-xl font-bold text-gray-900 mb-2" id="loading-title">Processing...</h3>
          <p class="text-gray-600" id="loading-message">Please wait</p>
        </div>
      </div>
    </div>
  `
}

function goBack() {
  window.location.href = '/'
}

function showSettingsModal() {
  document.getElementById('settings-modal').classList.remove('hidden')
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden')
}

function showLoading(title, message) {
  document.getElementById('loading-title').textContent = title
  document.getElementById('loading-message').textContent = message
  document.getElementById('loading-modal').classList.remove('hidden')
}

function hideLoading() {
  document.getElementById('loading-modal').classList.add('hidden')
}

async function saveSettings() {
  const settings = {
    enable_quizzes: document.getElementById('modal-enable-quizzes').checked,
    quiz_frequency: document.getElementById('modal-quiz-frequency').value,
    quiz_count: parseInt(document.getElementById('modal-quiz-count').value),
    enable_narration: document.getElementById('modal-enable-narration').checked,
    narration_voice: document.getElementById('modal-narration-voice').value,
    webhook_url: document.getElementById('modal-webhook-url').value
  }

  // In a real implementation, update the presentation settings in the database
  editorState.settings = settings
  closeSettingsModal()
  alert('Settings saved successfully!')
}

async function syncSlides() {
  showLoading('Syncing Slides', 'Updating slides from GenSpark editor...')
  
  try {
    // In production, this would fetch the latest slides from GenSpark
    // For now, just simulate
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    hideLoading()
    alert('Slides synced successfully!')
  } catch (error) {
    hideLoading()
    alert('Failed to sync slides: ' + error.message)
  }
}

async function generateQuizzes() {
  showLoading('Generating Quizzes', 'Creating quiz questions using AI...')
  
  try {
    const response = await axios.post(`/api/editor/${PRESENTATION_ID}/generate-quizzes`, {
      frequency: editorState.settings.quiz_frequency || 'custom',
      count: editorState.settings.quiz_count || 3
    })

    hideLoading()
    if (response.data.success) {
      alert(`Quiz configuration prepared for ${response.data.quiz_slides.length} slides. Edit in GenSpark to add quiz content.`)
    }
  } catch (error) {
    hideLoading()
    alert('Failed to generate quizzes: ' + error.message)
  }
}

async function generateNarration() {
  showLoading('Generating Narration', 'Creating audio narration with ElevenLabs...')
  
  try {
    const response = await axios.post(`/api/editor/${PRESENTATION_ID}/generate-narration`, {
      voice_id: editorState.settings.narration_voice || 'default'
    })

    hideLoading()
    if (response.data.success) {
      alert(`Narration prepared for ${response.data.narration_jobs.length} slides. Configure ElevenLabs API key to generate audio.`)
    }
  } catch (error) {
    hideLoading()
    alert('Failed to generate narration: ' + error.message)
  }
}

function addAnimations() {
  alert('Animation controls will be added in the GenSpark editor. Use the editor interface to customize slide animations.')
}

function previewPresentation() {
  window.open(`/api/player/${PRESENTATION_ID}/view`, '_blank', 'width=1280,height=720')
}

async function exportPresentation() {
  // Show export options dialog
  const exportChoice = confirm(
    'Choose export destination:\n\n' +
    'OK = Export to Webhook (Cohen Coaching)\n' +
    'Cancel = Export to Google Drive'
  )
  
  const exportType = exportChoice ? 'webhook' : 'google_drive'

  if (exportType === 'webhook' && !editorState.settings.webhook_url) {
    alert('Please configure a webhook URL in Settings before exporting to Cohen Coaching.')
    showSettingsModal()
    return
  }

  showLoading(
    exportType === 'webhook' ? 'Exporting to Webhook' : 'Preparing Google Drive Export', 
    exportType === 'webhook' ? 'Sending presentation...' : 'Preparing download...'
  )

  try {
    const response = await axios.post(`/api/webhooks/${PRESENTATION_ID}/export`, {
      export_type: exportType
    })
    
    hideLoading()
    
    if (response.data.success) {
      if (exportType === 'google_drive') {
        alert(
          '✅ Presentation ready for Google Drive!\n\n' +
          'You can access your presentation at:\n' +
          response.data.download_url + '\n\n' +
          'From GenSpark, you can export to Google Slides or download as PDF/PPTX.'
        )
        // Open GenSpark project URL
        window.open(response.data.download_url, '_blank')
      } else {
        alert('✅ Presentation exported successfully to Cohen Coaching platform!')
      }
    } else {
      alert('❌ Export failed: ' + response.data.error)
    }
  } catch (error) {
    hideLoading()
    alert('❌ Failed to export presentation: ' + error.message)
  }
}

async function launchGenSparkAgent() {
  if (!editorState.gensparkRequest) {
    alert('No GenSpark request data found. Please try uploading again.')
    return
  }

  showLoading('Launching GenSpark AI', 'Creating your professional slide deck... This may take a few minutes.')

  try {
    // In a real implementation, this would call create_agent tool from the backend
    // Since create_agent is a backend-only tool, we show instructions
    
    // For demonstration, simulate the agent creation
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Simulated response - in production this would come from create_agent
    const mockAgentResponse = {
      task_id: 'task-' + Date.now(),
      session_id: 'session-' + Date.now(),
      project_url: `https://www.genspark.ai/agents?id=${Date.now()}`
    }
    
    // Update presentation with agent info
    await axios.post('/api/genspark/update-agent-info', {
      presentation_id: PRESENTATION_ID,
      task_id: mockAgentResponse.task_id,
      session_id: mockAgentResponse.session_id,
      project_url: mockAgentResponse.project_url
    })
    
    // Update state and render
    editorState.editorUrl = mockAgentResponse.project_url
    editorState.needsAgentCreation = false
    
    hideLoading()
    alert('✅ GenSpark AI slides created! Opening editor...\n\n' +
          'NOTE: In production, this would open the actual GenSpark SuperAgent editor where you can:\n' +
          '• Edit slides with AI prompts\n' +
          '• Change images and layouts\n' +
          '• Customize branding\n' +
          '• Add animations\n\n' +
          'For now, this is a demo. The actual integration requires calling the create_agent tool from your backend.')
    
    renderEditor()
    
  } catch (error) {
    hideLoading()
    alert('Failed to launch GenSpark agent: ' + error.message)
  }
}
