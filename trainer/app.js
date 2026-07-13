// ============================================================
// INDUSTRIEMEISTER TRAINER - App Logic
// ============================================================

let currentTopic = '';
let currentMode = '';
let currentIndex = 0;
let sessionQuestions = [];
let sessionCorrect = 0;
let sessionWrong = 0;
let totalCorrect = parseInt(localStorage.getItem('im_correct') || '0');
let totalWrong = parseInt(localStorage.getItem('im_wrong') || '0');
let cardFlipped = false;

function updateStatsDisplay() {
  document.getElementById('stat-correct').textContent = `✅ ${totalCorrect} Richtig`;
  document.getElementById('stat-wrong').textContent = `❌ ${totalWrong} Falsch`;
}

function resetStats() {
  totalCorrect = 0;
  totalWrong = 0;
  localStorage.removeItem('im_correct');
  localStorage.removeItem('im_wrong');
  updateStatsDisplay();
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function showScreen(id) {
  ['start-screen', 'trainer-screen', 'result-screen'].forEach(s => {
    document.getElementById(s).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
}

function startSession(topic, mode) {
  currentTopic = topic;
  currentMode = mode;
  currentIndex = 0;
  sessionCorrect = 0;
  sessionWrong = 0;
  sessionQuestions = shuffle(QUESTIONS[topic]);
  document.getElementById('trainer-title').textContent =
    (topic === 'organisation' ? '🗂️ Organisation' : '🔧 Technik') +
    ' · ' + (mode === 'karteikarte' ? 'Karteikarten' : 'Multiple Choice');
  showScreen('trainer-screen');
  document.getElementById('mode-karteikarte').classList.add('hidden');
  document.getElementById('mode-multiple').classList.add('hidden');
  document.getElementById('mode-' + mode).classList.remove('hidden');
  loadQuestion();
}

function retrySession() {
  startSession(currentTopic, currentMode);
}

function loadQuestion() {
  const total = sessionQuestions.length;
  const q = sessionQuestions[currentIndex];
  document.getElementById('progress-indicator').textContent = `${currentIndex + 1} / ${total}`;

  if (currentMode === 'karteikarte') {
    cardFlipped = false;
    const inner = document.getElementById('card-inner');
    inner.classList.remove('flipped');
    document.getElementById('card-question').textContent = q.frage;
    document.getElementById('card-answer').textContent = q.antwort;
  } else {
    loadMCQuestion(q);
  }
}

// ===== KARTEIKARTE =====
function flipCard() {
  const inner = document.getElementById('card-inner');
  cardFlipped = !cardFlipped;
  inner.classList.toggle('flipped', cardFlipped);
}

function markCard(correct) {
  if (correct) {
    sessionCorrect++;
    totalCorrect++;
  } else {
    sessionWrong++;
    totalWrong++;
  }
  localStorage.setItem('im_correct', totalCorrect);
  localStorage.setItem('im_wrong', totalWrong);
  updateStatsDisplay();
  nextQuestion();
}

// ===== MULTIPLE CHOICE =====
function loadMCQuestion(q) {
  document.getElementById('mc-question').textContent = q.frage;
  const container = document.getElementById('mc-options');
  container.innerHTML = '';
  const feedback = document.getElementById('mc-feedback');
  feedback.className = 'mc-feedback hidden';
  feedback.textContent = '';
  document.getElementById('mc-next-btn').classList.add('hidden');

  const opts = q.optionen.map((text, i) => ({ text, i }));
  // shuffle options while tracking correct answer
  const shuffled = shuffle(opts);

  shuffled.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'mc-option';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => handleMCAnswer(opt.i === q.richtig, btn, shuffled, q));
    container.appendChild(btn);
  });
}

function handleMCAnswer(isCorrect, clickedBtn, shuffled, q) {
  const container = document.getElementById('mc-options');
  const allBtns = container.querySelectorAll('.mc-option');
  const feedback = document.getElementById('mc-feedback');

  allBtns.forEach((btn, idx) => {
    btn.classList.add('disabled');
    if (shuffled[idx].i === q.richtig) btn.classList.add('correct');
  });

  if (isCorrect) {
    clickedBtn.classList.add('correct');
    feedback.textContent = '✅ Richtig!';
    feedback.className = 'mc-feedback correct-fb';
    sessionCorrect++;
    totalCorrect++;
  } else {
    clickedBtn.classList.add('wrong');
    feedback.textContent = '❌ Falsch! Richtige Antwort ist markiert.';
    feedback.className = 'mc-feedback wrong-fb';
    sessionWrong++;
    totalWrong++;
  }

  localStorage.setItem('im_correct', totalCorrect);
  localStorage.setItem('im_wrong', totalWrong);
  updateStatsDisplay();
  document.getElementById('mc-next-btn').classList.remove('hidden');
}

// ===== NAVIGATION =====
function nextQuestion() {
  currentIndex++;
  if (currentIndex >= sessionQuestions.length) {
    showResult();
  } else {
    loadQuestion();
  }
}

function showResult() {
  showScreen('result-screen');
  const pct = Math.round((sessionCorrect / sessionQuestions.length) * 100);
  let emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚';
  document.getElementById('result-details').innerHTML =
    `${emoji} <strong>${pct}%</strong> richtig<br>
    ✅ ${sessionCorrect} Richtig &nbsp; ❌ ${sessionWrong} Falsch<br>
    Gesamt: ${sessionQuestions.length} Fragen`;
}

function goHome() {
  showScreen('start-screen');
  updateStatsDisplay();
}

// Init
updateStatsDisplay();
