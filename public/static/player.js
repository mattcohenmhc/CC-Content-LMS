// Player JavaScript
const PRESENTATION_ID = window.PRESENTATION_ID
let playerState = {
  presentation: null,
  slides: [],
  currentSlideIndex: 0,
  isPlaying: false,
  audioElement: null,
  showingQuiz: false
}

// Initialize player
document.addEventListener('DOMContentLoaded', async () => {
  await loadPresentation()
  renderPlayer()
  setupKeyboardControls()
})

async function loadPresentation() {
  try {
    const response = await axios.get(`/api/player/${PRESENTATION_ID}`)
    if (response.data.success) {
      playerState.presentation = response.data.presentation
      playerState.slides = response.data.slides
    }
  } catch (error) {
    console.error('Error loading presentation:', error)
    document.getElementById('player').innerHTML = `
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-800">Failed to load presentation</h2>
        </div>
      </div>
    `
  }
}

function renderPlayer() {
  const container = document.getElementById('player')
  container.innerHTML = `
    <div class="slide-content" id="slide-content">
      <!-- Slide content will be rendered here -->
    </div>
    
    <div class="slide-controls">
      <div class="flex items-center gap-4">
        <button onclick="previousSlide()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span id="slide-counter" class="text-sm">1 / ${playerState.slides.length}</span>
        <button onclick="nextSlide()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <div class="flex items-center gap-4">
        ${playerState.presentation?.settings?.enable_narration ? `
          <button id="narration-toggle" onclick="toggleNarration()" 
                  class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
            <i class="fas fa-volume-up"></i>
          </button>
        ` : ''}
        
        <button onclick="toggleFullscreen()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
          <i class="fas fa-expand"></i>
        </button>
        
        <button onclick="window.close()" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded">
          <i class="fas fa-times"></i> Exit
        </button>
      </div>
    </div>
  `

  renderSlide()
}

function renderSlide() {
  const slide = playerState.slides[playerState.currentSlideIndex]
  if (!slide) return

  const contentContainer = document.getElementById('slide-content')
  
  // Check if quiz should be shown
  if (slide.quiz_enabled && slide.quiz_data && !playerState.showingQuiz) {
    renderQuiz(slide.quiz_data)
    return
  }

  // Render slide content
  const animationClass = slide.animations?.[0]?.animation_type 
    ? `animation-${slide.animations[0].animation_type}` 
    : 'animation-fade'

  contentContainer.innerHTML = `
    <div class="${animationClass} max-w-5xl w-full">
      ${slide.title ? `<h1 class="text-5xl font-bold text-gray-800 mb-8 text-center">${slide.title}</h1>` : ''}
      
      <div class="bg-white rounded-2xl shadow-2xl p-12">
        ${renderSlideContent(slide.content)}
      </div>
    </div>
  `

  // Update counter
  document.getElementById('slide-counter').textContent = 
    `${playerState.currentSlideIndex + 1} / ${playerState.slides.length}`

  // Play narration if enabled
  if (playerState.presentation.settings?.enable_narration && slide.narration_audio_url) {
    playNarration(slide.narration_audio_url)
  }

  // Track progress
  trackProgress()
}

function renderSlideContent(content) {
  if (!content) return '<p class="text-gray-600 text-center">No content available</p>'

  if (typeof content === 'string') {
    return `<div class="prose prose-lg max-w-none">${content}</div>`
  }

  // Handle structured content
  let html = ''
  if (content.text) {
    html += `<p class="text-xl text-gray-700 leading-relaxed mb-6">${content.text}</p>`
  }
  if (content.bullets) {
    html += `
      <ul class="space-y-4 text-lg">
        ${content.bullets.map(bullet => `
          <li class="flex items-start gap-3">
            <i class="fas fa-check-circle text-green-500 mt-1"></i>
            <span>${bullet}</span>
          </li>
        `).join('')}
      </ul>
    `
  }
  if (content.image) {
    html += `<img src="${content.image}" alt="Slide image" class="w-full rounded-lg mt-6">`
  }

  return html || '<p class="text-gray-600 text-center">Slide content</p>'
}

function renderQuiz(quizData) {
  const contentContainer = document.getElementById('slide-content')
  playerState.showingQuiz = true

  contentContainer.innerHTML = `
    <div class="quiz-container animation-fade">
      <div class="text-center mb-6">
        <i class="fas fa-question-circle text-5xl text-blue-600 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-800">Quick Quiz</h2>
      </div>

      <div class="mb-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">${quizData.question}</h3>
        
        ${quizData.question_type === 'multiple_choice' ? `
          <div class="space-y-3">
            ${quizData.options.map((option, index) => `
              <label class="flex items-center gap-3 p-4 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
                <input type="radio" name="quiz-answer" value="${option}" class="w-5 h-5">
                <span class="text-lg">${option}</span>
              </label>
            `).join('')}
          </div>
        ` : ''}

        ${quizData.question_type === 'true_false' ? `
          <div class="space-y-3">
            <label class="flex items-center gap-3 p-4 border rounded-lg hover:bg-blue-50 cursor-pointer">
              <input type="radio" name="quiz-answer" value="true" class="w-5 h-5">
              <span class="text-lg">True</span>
            </label>
            <label class="flex items-center gap-3 p-4 border rounded-lg hover:bg-blue-50 cursor-pointer">
              <input type="radio" name="quiz-answer" value="false" class="w-5 h-5">
              <span class="text-lg">False</span>
            </label>
          </div>
        ` : ''}

        ${quizData.question_type === 'short_answer' ? `
          <textarea id="quiz-short-answer" rows="4" 
                    class="w-full p-4 border rounded-lg"
                    placeholder="Type your answer here..."></textarea>
        ` : ''}
      </div>

      <div id="quiz-feedback" class="hidden mb-4"></div>

      <button onclick="submitQuiz('${JSON.stringify(quizData).replace(/'/g, "\\'")}' )" 
              class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
        Submit Answer
      </button>
    </div>
  `
}

function submitQuiz(quizDataStr) {
  const quizData = JSON.parse(quizDataStr)
  let userAnswer = null

  if (quizData.question_type === 'short_answer') {
    userAnswer = document.getElementById('quiz-short-answer')?.value
  } else {
    const selected = document.querySelector('input[name="quiz-answer"]:checked')
    userAnswer = selected?.value
  }

  if (!userAnswer) {
    alert('Please provide an answer')
    return
  }

  // Check answer
  const isCorrect = checkAnswer(userAnswer, quizData.correct_answer)
  
  const feedback = document.getElementById('quiz-feedback')
  feedback.classList.remove('hidden')
  feedback.className = `p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`
  feedback.innerHTML = `
    <div class="flex items-center gap-2 mb-2">
      <i class="fas fa-${isCorrect ? 'check-circle' : 'times-circle'} text-xl"></i>
      <strong>${isCorrect ? 'Correct!' : 'Incorrect'}</strong>
    </div>
    ${quizData.explanation ? `<p class="text-sm">${quizData.explanation}</p>` : ''}
    <button onclick="continueFromQuiz()" 
            class="mt-3 bg-${isCorrect ? 'green' : 'red'}-600 text-white px-4 py-2 rounded hover:bg-${isCorrect ? 'green' : 'red'}-700">
      Continue
    </button>
  `

  // Track quiz result
  trackProgress({ quiz_result: { correct: isCorrect, answer: userAnswer } })
}

function checkAnswer(userAnswer, correctAnswer) {
  if (Array.isArray(correctAnswer)) {
    return correctAnswer.some(ans => 
      ans.toLowerCase().trim() === userAnswer.toLowerCase().trim()
    )
  }
  return correctAnswer.toLowerCase().trim() === userAnswer.toLowerCase().trim()
}

function continueFromQuiz() {
  playerState.showingQuiz = false
  nextSlide()
}

function nextSlide() {
  if (playerState.currentSlideIndex < playerState.slides.length - 1) {
    playerState.currentSlideIndex++
    renderSlide()
  } else {
    showCompletionScreen()
  }
}

function previousSlide() {
  if (playerState.currentSlideIndex > 0) {
    playerState.showingQuiz = false
    playerState.currentSlideIndex--
    renderSlide()
  }
}

function showCompletionScreen() {
  const contentContainer = document.getElementById('slide-content')
  contentContainer.innerHTML = `
    <div class="text-center animation-fade">
      <i class="fas fa-graduation-cap text-8xl text-green-500 mb-6"></i>
      <h1 class="text-5xl font-bold text-gray-800 mb-4">Congratulations!</h1>
      <p class="text-2xl text-gray-600 mb-8">You've completed this presentation</p>
      <div class="flex gap-4 justify-center">
        <button onclick="playerState.currentSlideIndex = 0; renderSlide()" 
                class="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 text-lg">
          <i class="fas fa-redo mr-2"></i> Restart
        </button>
        <button onclick="window.close()" 
                class="bg-gray-600 text-white px-8 py-4 rounded-lg hover:bg-gray-700 text-lg">
          <i class="fas fa-times mr-2"></i> Exit
        </button>
      </div>
    </div>
  `
}

function playNarration(audioUrl) {
  if (playerState.audioElement) {
    playerState.audioElement.pause()
  }

  playerState.audioElement = new Audio(audioUrl)
  playerState.audioElement.play().catch(err => {
    console.error('Failed to play narration:', err)
  })
}

function toggleNarration() {
  if (!playerState.audioElement) return

  const button = document.getElementById('narration-toggle')
  if (playerState.audioElement.paused) {
    playerState.audioElement.play()
    button.innerHTML = '<i class="fas fa-volume-up"></i>'
  } else {
    playerState.audioElement.pause()
    button.innerHTML = '<i class="fas fa-volume-mute"></i>'
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

function setupKeyboardControls() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault()
      nextSlide()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      previousSlide()
    } else if (e.key === 'Escape') {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    }
  })
}

async function trackProgress(additionalData = {}) {
  try {
    await axios.post(`/api/player/${PRESENTATION_ID}/progress`, {
      slide_number: playerState.currentSlideIndex + 1,
      completed: playerState.currentSlideIndex === playerState.slides.length - 1,
      ...additionalData
    })
  } catch (error) {
    console.error('Error tracking progress:', error)
  }
}
