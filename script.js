// --- DECK AND COUNT VARIABLES ---
let deck = [];
let runningCount = 0;
let totalDecks = 6;

// --- GAME STATE VARIABLES ---
let playerPoints = 1000;
let streak = 0;
let trainerGameOver = false;

// --- ADDED: DIFFICULTY & TIMER VARIABLES ---
let difficulty = 'beginner';
let timerId = null;
const difficultySettings = {
    beginner:     { time: 4000, autoDeal: 1200, penalty: 'none' },
    intermediate: { time: 2500, autoDeal: 1000, penalty: 'gameover' },
    advanced:     { time: 1500, autoDeal: 700,  penalty: 'gameover' },
    professional: { time: 1000, autoDeal: 500,  penalty: 'gameover' }
};

// --- DOM ELEMENT REFERENCES ---
// ... (all your existing consts remain the same)
const timerContainerEl = document.getElementById('timer-container');
const timerBarEl = document.getElementById('timer-bar');

// --- (All existing functions like createDeck, shuffle, getCardCountValue remain the same) ---

// --- UI & STATE UPDATE ---
function updateUI() {
    // ... (rest of your updateUI function is the same)
    // ADDED: Disable betting input when trainer is active to prevent confusion
    betAmountEl.disabled = !guessControlsEl.classList.contains('hidden');
}

// --- TIMER LOGIC ---
function startTimer() {
    timerContainerEl.classList.remove('hidden');
    timerBarEl.style.transition = 'none'; // Reset transition for instant fill
    timerBarEl.style.width = '100%';

    // Force a repaint to ensure the bar is full before transition starts
    void timerBarEl.offsetWidth; 

    const level = difficultySettings[difficulty];
    timerBarEl.style.transition = `width ${level.time / 1000}s linear`;
    timerBarEl.style.width = '0%';
    
    // Set a timeout to handle what happens when the timer runs out
    timerId = setTimeout(() => {
        handleTimeout();
    }, level.time);
}

function stopTimer() {
    clearTimeout(timerId);
    timerId = null;
    timerContainerEl.classList.add('hidden');
}

function handleTimeout() {
    const level = difficultySettings[difficulty];
    const correctValue = getCardCountValue(currentCardForTrainer);
    
    stopTimer(); // Clear any lingering timer state
    
    if (level.penalty === 'gameover') {
        trainerGameOver = true;
        feedbackMessageEl.textContent = `Time's up! Game Over. Final Streak: ${streak}`;
        feedbackMessageEl.className = 'incorrect';
        guessControlsEl.classList.add('hidden');
        drawCardBtn.classList.remove('hidden');
        drawCardBtn.disabled = true;
        streak = 0;
    } else { // Beginner mode
        feedbackMessageEl.textContent = `Time's up! The card value was ${correctValue}.`;
        feedbackMessageEl.className = 'incorrect';
        runningCount += correctValue;
        setTimeout(startTrainerCard, 1500); // Give user time to read message
    }
    updateUI();
}

// --- INTERACTIVE TRAINER LOGIC (UPDATED) ---
function startTrainerCard() {
    // ... (existing code to check deck length)
    
    currentCardForTrainer = deck.pop();
    currentCardEl.textContent = `${currentCardForTrainer.value}${currentCardForTrainer.suit}`;

    drawCardBtn.classList.add('hidden');
    guessControlsEl.classList.remove('hidden');
    feedbackMessageEl.textContent = '';
    
    updateUI();
    startTimer(); // START THE TIMER!
}

function handleGuess(e) {
    if (trainerGameOver || !timerId) return; // Ignore clicks if game is over or timer isn't running
    
    stopTimer(); // Player made a guess, stop the timer!
    
    const userGuess = parseInt(e.target.dataset.value, 10);
    const correctValue = getCardCountValue(currentCardForTrainer);
    
    runningCount += correctValue;

    if (userGuess === correctValue) {
        streak++;
        playerPoints += 10;
        feedbackMessageEl.textContent = `Correct! +10 Points`;
        feedbackMessageEl.className = 'correct';
        // Auto-deal with speed based on difficulty
        setTimeout(startTrainerCard, difficultySettings[difficulty].autoDeal);
    } else {
        trainerGameOver = true;
        feedbackMessageEl.textContent = `Incorrect! Game Over. Final Streak: ${streak}`;
        feedbackMessageEl.className = 'incorrect';
        guessControlsEl.classList.add('hidden');
        drawCardBtn.classList.remove('hidden');
        drawCardBtn.disabled = true;
        streak = 0;
    }
    updateUI();
}

function resetShoe() {
    stopTimer(); // Ensure no timers are running
    totalDecks = parseInt(deckCountSelectorEl.value, 10);
    difficulty = document.querySelector('input[name="difficulty"]:checked').value;
    
    deck = createDeck(totalDecks);
    runningCount = 0;
    streak = 0;
    trainerGameOver = false;

    // ... (rest of resetShoe function is the same)
    
    feedbackMessageEl.textContent = 'Press "Start Training" to begin!';
    drawCardBtn.disabled = false;
    timerContainerEl.classList.add('hidden'); // Hide timer on reset
}

// --- (Rest of the Blackjack logic remains unchanged) ---

// --- INITIALIZATION ---
function initializeApp() {
    // ... (existing code)
    timerContainerEl.classList.add('hidden'); // Ensure timer is hidden on first load
}

// Run the app
initializeApp();
