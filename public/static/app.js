// Main application JavaScript
const API_BASE = '/api'
let currentUser = 'default_user' // In production, get from auth

// State management
const state = {
  presentations: [],
  currentPresentation: null,
  currentSlides: [],
  isLoading: false
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initApp()
})

async function initApp() {
  renderApp()
  await loadPresentations()
}

function renderApp() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="min-h-screen">
      <!-- Header -->
      <header class="gradient-bg text-white py-6 px-8 shadow-lg">
        <div class="max-w-7xl mx-auto">
          <h1 class="text-3xl font-bold flex items-center gap-3">
            <i class="fas fa-graduation-cap"></i>
            LMS Presentation Studio
          </h1>
          <p class="text-blue-100 mt-2">Transform presentations into interactive learning experiences</p>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-8 py-12">
        <!-- Upload Section -->
        <section class="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <i class="fas fa-cloud-upload-alt text-blue-600"></i>
            Upload Presentation
          </h2>
          
          <div id="upload-area" class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer">
            <i class="fas fa-file-upload text-6xl text-gray-400 mb-4"></i>
            <p class="text-xl text-gray-600 mb-2">Drop your PPTX or PDF here</p>
            <p class="text-sm text-gray-500 mb-4">or click to browse</p>
            <input type="file" id="file-input" accept=".pptx,.pdf" class="hidden">
            <button onclick="document.getElementById('file-input').click()" 
                    class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              <i class="fas fa-folder-open mr-2"></i>
              Choose File
            </button>
          </div>

          <!-- Settings -->
          <div id="upload-settings" class="mt-8 hidden">
            <h3 class="text-lg font-semibold mb-4">Presentation Settings</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Narration Settings -->
              <div class="border rounded-lg p-4">
                <label class="flex items-center gap-2 mb-3">
                  <input type="checkbox" id="enable-narration" class="w-5 h-5">
                  <span class="font-medium">Enable Slide Narration</span>
                </label>
                <div id="narration-options" class="ml-7 hidden">
                  <label class="text-sm text-gray-600">Voice:</label>
                  <select id="narration-voice" class="w-full mt-1 p-2 border rounded">
                    <option value="default">Default Voice</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                  </select>
                </div>
              </div>

              <!-- Quiz Settings -->
              <div class="border rounded-lg p-4">
                <label class="flex items-center gap-2 mb-3">
                  <input type="checkbox" id="enable-quizzes" class="w-5 h-5">
                  <span class="font-medium">Enable Quizzes</span>
                </label>
                <div id="quiz-options" class="ml-7 hidden">
                  <label class="text-sm text-gray-600">Frequency:</label>
                  <select id="quiz-frequency" class="w-full mt-1 p-2 border rounded">
                    <option value="after_each">After Each Slide</option>
                    <option value="custom">Custom Number</option>
                  </select>
                  <div id="quiz-count-container" class="mt-2 hidden">
                    <input type="number" id="quiz-count" min="1" placeholder="Number of quizzes" 
                           class="w-full p-2 border rounded">
                  </div>
                </div>
              </div>

              <!-- Webhook Settings -->
              <div class="border rounded-lg p-4 md:col-span-2">
                <label class="text-sm font-medium text-gray-700">Cohen Coaching Webhook URL:</label>
                <input type="url" id="webhook-url" 
                       placeholder="https://cohencoaching.com/api/webhook" 
                       class="w-full mt-1 p-2 border rounded">
                <p class="text-xs text-gray-500 mt-1">Presentation will be exported to this URL when complete</p>
              </div>
            </div>

            <button onclick="startProcessing()" 
                    class="mt-6 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto">
              <i class="fas fa-magic"></i>
              Generate AI Presentation
            </button>
          </div>
        </section>

        <!-- Loading Indicator -->
        <div id="loading" class="hidden bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
          <div class="animate-spin text-6xl text-blue-600 mb-4">
            <i class="fas fa-spinner"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Processing Your Presentation</h3>
          <p class="text-gray-600">This may take a few minutes...</p>
          <div id="processing-status" class="mt-4 text-sm text-gray-500"></div>
        </div>

        <!-- Presentations List -->
        <section class="bg-white rounded-xl shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <i class="fas fa-folder-open text-blue-600"></i>
            Your Presentations
          </h2>
          <div id="presentations-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Presentations will be loaded here -->
          </div>
        </section>
      </main>
    </div>
  `

  // Set up event listeners
  setupEventListeners()
}

function setupEventListeners() {
  // File input
  const fileInput = document.getElementById('file-input')
  fileInput.addEventListener('change', handleFileSelect)

  // Drag and drop
  const uploadArea = document.getElementById('upload-area')
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault()
    uploadArea.classList.add('border-blue-500', 'bg-blue-50')
  })
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('border-blue-500', 'bg-blue-50')
  })
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault()
    uploadArea.classList.remove('border-blue-500', 'bg-blue-50')
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  })

  // Settings toggles
  document.getElementById('enable-narration')?.addEventListener('change', (e) => {
    document.getElementById('narration-options').classList.toggle('hidden', !e.target.checked)
  })
  document.getElementById('enable-quizzes')?.addEventListener('change', (e) => {
    document.getElementById('quiz-options').classList.toggle('hidden', !e.target.checked)
  })
  document.getElementById('quiz-frequency')?.addEventListener('change', (e) => {
    document.getElementById('quiz-count-container').classList.toggle('hidden', e.target.value !== 'custom')
  })
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) handleFile(file)
}

function handleFile(file) {
  if (!file.name.match(/\.(pptx|pdf)$/i)) {
    alert('Please upload a PPTX or PDF file')
    return
  }

  state.selectedFile = file
  document.getElementById('upload-settings').classList.remove('hidden')
  document.getElementById('upload-area').innerHTML = `
    <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
    <p class="text-xl text-gray-800 font-medium">${file.name}</p>
    <p class="text-sm text-gray-500 mt-2">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
    <button onclick="location.reload()" 
            class="mt-4 text-blue-600 hover:text-blue-700">
      <i class="fas fa-times mr-1"></i> Change File
    </button>
  `
}

async function startProcessing() {
  if (!state.selectedFile) return

  // Get settings
  const settings = {
    enable_narration: document.getElementById('enable-narration').checked,
    narration_voice: document.getElementById('narration-voice').value,
    enable_quizzes: document.getElementById('enable-quizzes').checked,
    quiz_frequency: document.getElementById('quiz-frequency').value,
    quiz_count: parseInt(document.getElementById('quiz-count').value) || 0,
    webhook_url: document.getElementById('webhook-url').value
  }

  // Upload file
  const formData = new FormData()
  formData.append('file', state.selectedFile)
  formData.append('user_id', currentUser)
  formData.append('settings', JSON.stringify(settings))

  document.getElementById('loading').classList.remove('hidden')
  updateProcessingStatus('Uploading file...')

  try {
    const uploadResponse = await axios.post(`${API_BASE}/presentations/upload`, formData)
    const { presentation_id, file_name } = uploadResponse.data

    updateProcessingStatus('Preparing GenSpark AI Slides...')

    // Prepare GenSpark request
    const gensparkPrepResponse = await axios.post(`${API_BASE}/genspark/create-slides`, {
      presentation_id,
      file_name,
      settings
    })

    if (!gensparkPrepResponse.data.success) {
      throw new Error(gensparkPrepResponse.data.error || 'Failed to prepare slides')
    }

    updateProcessingStatus('Creating AI slides with GenSpark... This may take a few minutes.')

    // Call GenSpark create_agent API
    const gensparkRequest = gensparkPrepResponse.data.genspark_request
    
    // Note: Since create_agent is a tool available on the backend, 
    // we need to make a backend call that uses the tool
    // For now, let's redirect to editor where user can manually trigger it
    // In production, backend would call create_agent directly
    
    // Store the request in session/state for the editor to use
    sessionStorage.setItem('genspark_request', JSON.stringify(gensparkRequest))
    sessionStorage.setItem('presentation_id', presentation_id)
    
    updateProcessingStatus('Redirecting to GenSpark editor...')
    
    setTimeout(() => {
      window.location.href = `/editor/${presentation_id}`
    }, 1500)

  } catch (error) {
    console.error('Processing error:', error)
    alert('Failed to process presentation: ' + (error.response?.data?.error || error.message))
    document.getElementById('loading').classList.add('hidden')
  }
}

function updateProcessingStatus(message) {
  document.getElementById('processing-status').textContent = message
}

async function loadPresentations() {
  try {
    const response = await axios.get(`${API_BASE}/presentations?user_id=${currentUser}`)
    state.presentations = response.data.presentations
    renderPresentations()
  } catch (error) {
    console.error('Error loading presentations:', error)
  }
}

function renderPresentations() {
  const container = document.getElementById('presentations-list')
  
  if (state.presentations.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-500">
        <i class="fas fa-folder-open text-6xl mb-4 opacity-50"></i>
        <p class="text-lg">No presentations yet. Upload one to get started!</p>
      </div>
    `
    return
  }

  container.innerHTML = state.presentations.map(pres => `
    <div class="card bg-white border rounded-lg p-6 shadow hover:shadow-lg">
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="font-semibold text-lg text-gray-800 mb-1">${pres.original_filename}</h3>
          <span class="inline-block px-2 py-1 text-xs rounded ${getStatusColor(pres.status)}">
            ${pres.status}
          </span>
        </div>
        <i class="fas fa-file-${pres.original_file_type === 'pdf' ? 'pdf' : 'powerpoint'} text-3xl ${pres.original_file_type === 'pdf' ? 'text-red-500' : 'text-orange-500'}"></i>
      </div>
      
      <p class="text-sm text-gray-500 mb-4">
        <i class="far fa-calendar"></i>
        ${new Date(pres.created_at).toLocaleDateString()}
      </p>

      <div class="flex gap-2">
        ${pres.status === 'completed' ? `
          <button onclick="openEditor('${pres.id}')" 
                  class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            <i class="fas fa-edit mr-1"></i> Edit
          </button>
          <button onclick="openPlayer('${pres.id}')" 
                  class="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
            <i class="fas fa-play mr-1"></i> Play
          </button>
          <button onclick="exportPresentation('${pres.id}')" 
                  class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm">
            <i class="fas fa-download"></i>
          </button>
        ` : `
          <button disabled class="flex-1 bg-gray-300 text-gray-600 px-4 py-2 rounded text-sm cursor-not-allowed">
            Processing...
          </button>
        `}
      </div>
    </div>
  `).join('')
}

function getStatusColor(status) {
  const colors = {
    'uploading': 'bg-gray-200 text-gray-700',
    'processing': 'bg-yellow-200 text-yellow-800',
    'completed': 'bg-green-200 text-green-800',
    'error': 'bg-red-200 text-red-800'
  }
  return colors[status] || colors.uploading
}

function openEditor(presentationId) {
  window.location.href = `/editor/${presentationId}`
}

function openPlayer(presentationId) {
  window.open(`/api/player/${presentationId}/view`, '_blank')
}

async function exportPresentation(presentationId) {
  if (!confirm('Export this presentation to Cohen Coaching platform?')) return

  try {
    const response = await axios.post(`${API_BASE}/webhooks/${presentationId}/export`)
    if (response.data.success) {
      alert('Presentation exported successfully!')
    } else {
      alert('Export failed: ' + response.data.error)
    }
  } catch (error) {
    console.error('Export error:', error)
    alert('Failed to export presentation')
  }
}
