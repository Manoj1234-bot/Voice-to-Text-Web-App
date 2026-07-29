// ----- DOM References -----
const micBtn = document.getElementById('micBtn');
const micIcon = document.getElementById('micIcon');
const micLabel = document.getElementById('micLabel');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const transcriptText = document.getElementById('transcriptText');
const languageSelect = document.getElementById('languageSelect');
const wordCount = document.getElementById('wordCount');
const charCount = document.getElementById('charCount');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const errorMsg = document.getElementById('errorMsg');

// ----- Check Browser Support -----
// Web Speech API is prefixed as "webkitSpeechRecognition" in Chrome/Edge.
// It is NOT supported in Firefox as of writing.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let isListening = false;
let finalTranscript = '';

// ----- Initialize Speech Recognition -----
function initRecognition() {
  if (!SpeechRecognition) {
    errorMsg.textContent = 'Speech Recognition is not supported in this browser. Try Chrome or Edge.';
    micBtn.disabled = true;
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;       // keep listening until manually stopped
  recognition.interimResults = true;   // show live partial results as you speak
  recognition.lang = languageSelect.value;

  recognition.onresult = handleResult;
  recognition.onerror = handleError;
  recognition.onend = handleEnd;
}

// ----- Handle Speech Results -----
function handleResult(event) {
  let interimTranscript = '';

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;

    if (event.results[i].isFinal) {
      finalTranscript += transcript + ' ';
    } else {
      interimTranscript += transcript;
    }
  }

  // Show final (committed) text + interim (still-being-spoken) text in gray-ish preview
  transcriptText.value = finalTranscript + interimTranscript;
  updateStats();
}

// ----- Handle Errors -----
function handleError(event) {
  const errorMessages = {
    'no-speech': 'No speech detected. Try speaking again.',
    'audio-capture': 'No microphone found. Please connect a microphone.',
    'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
    'network': 'Network error occurred during recognition.',
  };

  errorMsg.textContent = errorMessages[event.error] || `Error: ${event.error}`;
  stopListening();
}

// ----- Handle Recognition End (browser sometimes stops on its own) -----
function handleEnd() {
  if (isListening) {
    // If we're still supposed to be listening but it stopped (this can
    // happen after brief silence), restart it automatically.
    recognition.start();
  }
}

// ----- Start / Stop Listening -----
function startListening() {
  errorMsg.textContent = '';
  recognition.lang = languageSelect.value;
  recognition.start();
  isListening = true;

  micBtn.classList.add('listening');
  micIcon.textContent = '⏹️';
  micLabel.textContent = 'Stop Listening';
  statusDot.classList.add('active');
  statusText.textContent = 'Listening...';
}

function stopListening() {
  isListening = false; // set BEFORE calling stop so onend doesn't auto-restart
  if (recognition) recognition.stop();

  micBtn.classList.remove('listening');
  micIcon.textContent = '🎤';
  micLabel.textContent = 'Start Listening';
  statusDot.classList.remove('active');
  statusText.textContent = 'Not listening';
}

function toggleListening() {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
}

// ----- Stats -----
function updateStats() {
  const text = transcriptText.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  charCount.textContent = `${text.length} characters`;
}

// ----- Copy to Clipboard -----
async function copyTranscript() {
  const text = transcriptText.value.trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    const original = copyBtn.textContent;
    copyBtn.textContent = '✅ Copied!';
    setTimeout(() => (copyBtn.textContent = original), 1500);
  } catch (err) {
    errorMsg.textContent = 'Could not copy to clipboard.';
  }
}

// ----- Download as .txt -----
function downloadTranscript() {
  const text = transcriptText.value.trim();
  if (!text) return;

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `voice-transcript-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ----- Clear Transcript -----
function clearTranscript() {
  transcriptText.value = '';
  finalTranscript = '';
  updateStats();
}

// ----- Manual edits to the textarea should also update finalTranscript -----
transcriptText.addEventListener('input', () => {
  finalTranscript = transcriptText.value;
  updateStats();
});

// ----- Language change while not listening -----
languageSelect.addEventListener('change', () => {
  if (recognition) recognition.lang = languageSelect.value;
});

// ----- Event Listeners -----
micBtn.addEventListener('click', toggleListening);
copyBtn.addEventListener('click', copyTranscript);
downloadBtn.addEventListener('click', downloadTranscript);
clearBtn.addEventListener('click', clearTranscript);

// ----- Init -----
initRecognition();
updateStats();