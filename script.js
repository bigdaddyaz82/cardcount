// --- DECK AND COUNT VARIABLES ---
let deck = [];
let runningCount = 0;
let totalDecks = 6;
// ADDED: Card counter for quiz trigger
let cardsSinceLastQuiz = 0;

// --- GAME STATE VARIABLES ---
let playerPoints = 1000;
let streak = 0;
let trainerGameOver = false;

// ADDED: QUIZ VARIABLES
const BET_QUIZ_INTERVAL = 15; // Ask a betting question every 15 correct cards
let isQuizActive = false;

// --- DIFFICULTY & TIMER VARIABLES ---
let difficulty = 'beginner';
let timerId = null;
const difficultySettings = {
    beginner:     { time: 4000, autoDeal: 1200, penalty: 'none' },
    intermediate: { time: 2500, autoDeal: 1000, penalty: 'gameover' },
    advanced:     { time: 1500, autoDeal: 700,  penalty: 'gameover' },
    professional: { time: 1000, autoDeal: 500,  penalty: 'gameover' }
};

// --- DOM ELEMENT REFERENCES ---
const runningCountEl = document.getElementById('runningCount');
const trueCountEl = document.getElementById('trueCount');
const decksRemainingEl = document.getElementById('decksRemaining');
const playerPointsEl = document.getElementById('playerPoints');
const streakCounterEl = document.getElementById('streakCounter');
const currentCardEl = document.getElementById('currentCard');
const feedbackMessageEl = document.getElementById('feedbackMessage');
const guessControlsEl = document.getElementById('guess-controls');
const drawCardBtn = document.getElementById('drawCardBtn');
const resetShoeBtn = document.getElementById('resetShoeBtn');
const deckCountSelectorEl = document.getElementById('deck-count-selector');
const timerContainerEl = document.getElementById('timer-container');
const timerBarEl = document.getElementById('timer-bar');

// ADDED: Quiz Modal Elements
const quizModalEl = document.getElementById('betting-quiz-modal');
const quizQuestionEl = document.getElementById('quiz-question');
const quizOptionsEl = document.getElementById('quiz-options');
const quizFeedbackEl = document.getElementById('quiz-feedback');

// --- MINI BLACKJACK GAME DOM ELEMENTS ---
const dealerHandEl = document.getElementById('dealerHand');
const playerHandEl = document.getElementById('playerHand');
const betAmountEl = document.getElementById('betAmount');
const newHandBtn = document.getElementById('newHandBtn');
const hitBtn = document.getElementById('hitBtn');
const standBtn = document.getElementById('standBtn');
const resultMessageEl = document.getElementById('resultMessage');


// --- CARD & DECK LOGIC ---
let currentCardForTrainer = null;

function createDeck(numDecks) {
    const suits = ['♠', '♣', '♥', '♦'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    let newDeck = [];
    for (let i = 0; i < numDecks; i++) {
        for (const suit of suits) {
            for (const value of values) {
                newDeck.push({ value, suit });
            }
        }
    }
    // For the blackjack game, we use this deck. The trainer uses its own shuffled copy.
    return shuffle(newDeck);
}

function shuffle(deck) {
    // Create a copy to avoid modifying the original array reference directly
    const shuffledDeck = [...deck];
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    return shuffledDeck;
}

function getCardCountValue(card) {
    if (!card) return 0;
    const lowCards = ['2', '3', '4', '5', '6'];
    const highCards = ['T', 'J', 'Q', 'K', 'A'];
    if (lowCards.includes(card.value)) return 1;
    if (highCards.includes(card.value)) return -1;
    return 0;
}

// ADDED: Standalone True Count calculation for re-use
function calculateTrueCount() {
    const decksRemaining = Math.max(0.5, deck.length / 52); // Don't divide by less than half a deck
    // Round to nearest integer is a common and simple approach
    return Math.round(runningCount / decksRemaining);
}


// --- UI & STATE UPDATE ---
function updateUI() {
    runningCountEl.textContent = runningCount;
    trueCountEl.textContent = calculateTrueCount();
    decksRemainingEl.textContent = (deck.length / 52).toFixed(1);
    playerPointsEl.textContent = playerPoints;
    streakCounterEl.textContent = streak;
    
    // Disable betting input when trainer is active OR quiz is active to prevent confusion
    betAmountEl.disabled = !guessControlsEl.classList.contains('hidden') || isQuizActive;
}

// --- TIMER LOGIC ---
function startTimer() {
    // ADDED: Don't start a timer during the quiz
    if (isQuizActive) return; 

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
        drawCardBtn.disabled = true; // Still show button, but disabled
        streak = 0;
    } else { // Beginner mode
        feedbackMessageEl.textContent = `Time's up! The card value was ${correctValue}.`;
        feedbackMessageEl.className = 'incorrect';
        runningCount += correctValue; // Update count even if time runs out in beginner
        setTimeout(startTrainerCard, 1500); // Give user time to read message
    }
    updateUI();
}

// --- INTERACTIVE TRAINER LOGIC (UPDATED) ---
function startTrainerCard() {
    if (deck.length === 0) {
        feedbackMessageEl.textContent = "Shoe depleted! Reset to play again.";
        guessControlsEl.classList.add('hidden');
        drawCardBtn.classList.remove('hidden');
        drawCardBtn.disabled = true;
        return;
    }
    
    currentCardForTrainer = deck.pop();
    currentCardEl.textContent = `${currentCardForTrainer.value}${currentCardForTrainer.suit}`;

    drawCardBtn.classList.add('hidden');
    guessControlsEl.classList.remove('hidden');
    feedbackMessageEl.textContent = '';
    
    updateUI();
    startTimer(); // START THE TIMER!
}

function handleGuess(e) {
    // UPDATED: Guard clause to also check for active quiz
    if (trainerGameOver || !timerId || isQuizActive) return;
    
    stopTimer(); // Player made a guess, stop the timer!
    
    const target = e.target.closest('.guess-btn');
    if (!target) return; // Ignore clicks not on a guess button
    
    const userGuess = parseInt(target.dataset.value, 10);
    const correctValue = getCardCountValue(currentCardForTrainer);
    
    runningCount += correctValue;

    if (userGuess === correctValue) {
        streak++;
        cardsSinceLastQuiz++; // ADDED: Increment quiz counter
        playerPoints += 10;
        feedbackMessageEl.textContent = `Correct! +10 Points`;
        feedbackMessageEl.className = 'correct';

        // ADDED: Check if it's time for the quiz
        if (cardsSinceLastQuiz >= BET_QUIZ_INTERVAL) {
            startBettingQuiz();
        } else {
            // Auto-deal with speed based on difficulty
            setTimeout(startTrainerCard, difficultySettings[difficulty].autoDeal);
        }

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
    cardsSinceLastQuiz = 0; // ADDED: Reset quiz counter
    trainerGameOver = false;
    isQuizActive = false; // ADDED: Ensure quiz is not active
    quizModalEl.classList.add('hidden'); // ADDED: Ensure modal is hidden

    currentCardEl.textContent = '🂠';
    feedbackMessageEl.textContent = 'Select settings and press "Start Training" to begin!';
    feedbackMessageEl.className = '';
    
    drawCardBtn.classList.remove('hidden');
    drawCardBtn.disabled = false;
    guessControlsEl.classList.add('hidden');
    timerContainerEl.classList.add('hidden'); // Hide timer on reset
    
    // Reset blackjack UI too
    resultMessageEl.textContent = '';
    playerHandEl.textContent = '';
    dealerHandEl.textContent = '';
    
    updateUI();
}

// --- ADDED: BETTING QUIZ LOGIC ---
function startBettingQuiz() {
    isQuizActive = true;
    guessControlsEl.classList.add('hidden'); // Hide the +1/0/-1 buttons
    const trueCount = calculateTrueCount();

    quizQuestionEl.textContent = `The True Count is ${trueCount}. What's your bet?`;
    quizOptionsEl.innerHTML = ''; // Clear previous options
    quizFeedbackEl.textContent = '';
    quizFeedbackEl.className = 'quiz-feedback';

    const options = generateBetOptions(trueCount);
    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = `$${option.bet}`;
        button.onclick = () => handleQuizAnswer(option.isCorrect, option.bet);
        quizOptionsEl.appendChild(button);
    });
    
    quizModalEl.classList.remove('hidden');
    updateUI(); // To disable blackjack bet input
}

function generateBetOptions(trueCount) {
    const tableMin = 10;
    let correctBet;
    
    // A common betting strategy: Bet (True Count - 1) units. Bet table min if TC is 1 or less.
    if (trueCount > 1) {
        // We can cap the bet to something reasonable, e.g., 10x the minimum
        correctBet = Math.min(tableMin * 10, (trueCount - 1) * tableMin);
    } else {
        correctBet = tableMin;
    }
    
    // Create options array
    let options = [{ bet: correctBet, isCorrect: true }];
    let decoyBets = new Set([correctBet]); // Use a Set to avoid duplicate bet amounts
    
    // Generate 3 decoy options
    while(options.length < 4) {
        let decoy;
        if (correctBet === tableMin) {
            // If correct bet is min, decoys should be higher
            decoy = tableMin * (options.length + 1);
        } else {
            // Generate decoys around the correct bet, ensuring they are multiples of 5 or 10
            let multiplier = Math.random() * 1.5 + 0.5; // between 0.5x and 2x
            decoy = Math.max(tableMin, tableMin * Math.round(correctBet / tableMin * multiplier));
        }

        if (!decoyBets.has(decoy)) {
            decoyBets.add(decoy);
            options.push({ bet: decoy, isCorrect: false });
        }
    }
    
    return shuffle(options); // Shuffle to randomize button order
}

function handleQuizAnswer(isCorrect) {
    // Disable buttons after one click
    quizOptionsEl.querySelectorAll('button').forEach(btn => btn.disabled = true);

    if (isCorrect) {
        playerPoints += 100; // Bigger reward for betting knowledge
        quizFeedbackEl.textContent = 'Correct! This is the optimal bet. +100 Points!';
        quizFeedbackEl.className = 'quiz-feedback correct';
    } else {
        playerPoints -= 50; // Penalty for bad betting
        quizFeedbackEl.textContent = 'Incorrect. A poor betting decision costs you money in the long run.';
        quizFeedbackEl.className = 'quiz-feedback incorrect';
    }

    updateUI();

    // Reset for the next round of training
    cardsSinceLastQuiz = 0;
    isQuizActive = false;
    
    // Hide modal and resume training after a delay to give user time to read feedback
    setTimeout(() => {
        quizModalEl.classList.add('hidden');
        // A short delay before the next card appears
        setTimeout(startTrainerCard, 500); 
    }, 2500);
}


// --- (Rest of the Blackjack logic remains unchanged) ---
// This section is kept as-is from your original file.
let playerHand = [], dealerHand = [];
let playerScore = 0, dealerScore = 0;

function getCardValue(card) {
    if (['T', 'J', 'Q', 'K'].includes(card.value)) return 10;
    if (card.value === 'A') return 11;
    return parseInt(card.value);
}

// ... more blackjack functions would go here if you had them ...


// --- INITIALIZATION ---
function initializeApp() {
    // Event Listeners for Trainer
    deckCountSelectorEl.addEventListener('change', resetShoe);
    document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
        radio.addEventListener('change', resetShoe);
    });
    drawCardBtn.addEventListener('click', startTrainerCard);
    resetShoeBtn.addEventListener('click', resetShoe);
    guessControlsEl.addEventListener('click', handleGuess);

    // Event Listeners for Blackjack Game (kept from original structure)
    // newHandBtn.addEventListener('click', startNewBlackjackHand);
    // hitBtn.addEventListener('click', playerHit);
    // standBtn.addEventListener('click', playerStand);
    
    resetShoe(); // Call resetShoe to initialize the app state correctly
}

// Run the app
initializeApp();
