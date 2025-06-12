// This event listener is the most important part.
// It ensures that NO JavaScript code runs until the entire HTML page is loaded and ready.
// This prevents the script from crashing because it can't find an element.
document.addEventListener('DOMContentLoaded', () => {

    // --- All variables and element references are now safely inside this event listener ---
    
    // GAME STATE VARIABLES
    let deck = [];
    let runningCount = 0;
    let totalDecks = 6;
    let cardsSinceLastQuiz = 0;
    let playerPoints = 1000;
    let streak = 0;
    let highStreak = 0;
    let trainerGameOver = false;
    let isQuizActive = false;
    let currentCardForTrainer = null;
    let difficulty = 'beginner';
    let timerId = null;

    const difficultySettings = {
        beginner:     { time: 4000, autoDeal: 1200, penalty: 'none' },
        intermediate: { time: 2500, autoDeal: 1000, penalty: 'gameover' },
        advanced:     { time: 1500, autoDeal: 700,  penalty: 'gameover' },
        professional: { time: 1000, autoDeal: 500,  penalty: 'gameover' }
    };

    // DOM ELEMENT REFERENCES
    const runningCountEl = document.getElementById('runningCount');
    const trueCountEl = document.getElementById('trueCount');
    const decksRemainingEl = document.getElementById('decksRemaining');
    const playerPointsEl = document.getElementById('playerPoints');
    const streakCounterEl = document.getElementById('streakCounter');
    const highStreakCounterEl = document.getElementById('highStreakCounter');
    const currentCardEl = document.getElementById('currentCard');
    const feedbackMessageEl = document.getElementById('feedbackMessage');
    const guessControlsEl = document.getElementById('guess-controls');
    const drawCardBtn = document.getElementById('drawCardBtn');
    const resetShoeBtn = document.getElementById('resetShoeBtn');
    const deckCountSelectorEl = document.getElementById('deck-count-selector');
    const timerContainerEl = document.getElementById('timer-container');
    const timerBarEl = document.getElementById('timer-bar');
    const mainControlsEl = document.getElementById('main-trainer-controls');
    const quizModalEl = document.getElementById('betting-quiz-modal');
    const quizQuestionEl = document.getElementById('quiz-question');
    const quizOptionsEl = document.getElementById('quiz-options');
    const quizFeedbackEl = document.getElementById('quiz-feedback');
    const howToPlayBtn = document.getElementById('how-to-play-btn');
    const howToPlayModal = document.getElementById('how-to-play-modal');
    const closeHowToPlayBtn = document.getElementById('close-how-to-play-btn');

    // --- CORE FUNCTIONS ---

    function createDeck(numDecks) {
        const suits = ['♠', '♣', '♥', '♦'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        let newDeck = [];
        for (let i = 0; i < numDecks; i++) { for (const suit of suits) { for (const value of values) { newDeck.push({ value, suit }); } } }
        return shuffle(newDeck);
    }

    function shuffle(array) {
        const shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; }
        return shuffledArray;
    }

    function getCardCountValue(card) {
        if (!card) return 0;
        const lowCards = ['2', '3', '4', '5', '6'];
        const highCards = ['T', 'J', 'Q', 'K', 'A'];
        if (lowCards.includes(card.value)) return 1;
        if (highCards.includes(card.value)) return -1;
        return 0;
    }

    function calculateTrueCount() {
        const decksRemaining = Math.max(0.5, deck.length / 52);
        return Math.round(runningCount / decksRemaining);
    }
    
    // --- UI UPDATE AND STATE MANAGEMENT ---

    function updateUI() {
        runningCountEl.textContent = runningCount;
        trueCountEl.textContent = calculateTrueCount();
        decksRemainingEl.textContent = (deck.length / 52).toFixed(1);
        playerPointsEl.textContent = playerPoints;
        streakCounterEl.textContent = streak;
        highStreakCounterEl.textContent = highStreak;
    }

    function showGuessingUI() {
        mainControlsEl.classList.add('hidden');
        guessControlsEl.classList.remove('hidden');
    }

    function showMainButtonsUI() {
        mainControlsEl.classList.remove('hidden');
        guessControlsEl.classList.add('hidden');
    }
    
    // --- TIMER LOGIC ---

    function startTimer() {
        timerContainerEl.style.visibility = 'visible';
        // Reset the bar
        if (!timerBarEl.firstElementChild) {
            timerBarEl.innerHTML = '<div></div>';
        }
        const bar = timerBarEl.firstElementChild;
        bar.style.transition = 'none';
        bar.style.width = '100%';
        
        // This forces the browser to apply the style change before starting the transition
        void bar.offsetWidth;

        const level = difficultySettings[difficulty];
        bar.style.transition = `width ${level.time / 1000}s linear`;
        bar.style.width = '0%';
        
        timerId = setTimeout(handleTimeout, level.time);
    }

    function stopTimer() {
        clearTimeout(timerId);
        timerId = null;
        timerContainerEl.style.visibility = 'hidden';
    }

    function handleTimeout() {
        const level = difficultySettings[difficulty];
        const correctValue = getCardCountValue(currentCardForTrainer);
        stopTimer();
        if (level.penalty === 'gameover') {
            endGame(`Time's up! Game Over. Final Streak: ${streak}`);
        } else {
            feedbackMessageEl.textContent = `Time's up! The card value was ${correctValue}.`;
            feedbackMessageEl.className = 'incorrect';
            runningCount += correctValue;
            setTimeout(startTrainerCard, 1500);
        }
        updateUI();
    }
    
    // --- GAME FLOW LOGIC ---

    function startTrainerCard() {
        if (deck.length === 0) {
            endGame("Shoe depleted! Reset to play again.");
            return;
        }
        currentCardForTrainer = deck.pop();
        currentCardEl.textContent = `${currentCardForTrainer.value}${currentCardForTrainer.suit}`;
        feedbackMessageEl.textContent = '';
        showGuessingUI(); // Show the +1, 0, -1 buttons
        updateUI();
        startTimer();
    }

    function handleGuess(e) {
        const target = e.target.closest('.guess-btn');
        if (!target || trainerGameOver || !timerId || isQuizActive) return;
        
        stopTimer();
        const userGuess = parseInt(target.dataset.value, 10);
        const correctValue = getCardCountValue(currentCardForTrainer);
        runningCount += correctValue;

        if (userGuess === correctValue) {
            streak++;
            if (streak > highStreak) { highStreak = streak; localStorage.setItem('cardCounterHighStreak', highStreak); }
            cardsSinceLastQuiz++;
            playerPoints += 10;
            feedbackMessageEl.textContent = `Correct! +10 Points`;
            feedbackMessageEl.className = 'correct';
            if (cardsSinceLastQuiz >= BET_QUIZ_INTERVAL) {
                startBettingQuiz();
            } else {
                setTimeout(startTrainerCard, difficultySettings[difficulty].autoDeal);
            }
        } else {
            const level = difficultySettings[difficulty];
            if (level.penalty === 'gameover') {
                endGame(`Incorrect! Game Over. Final Streak: ${streak}`);
            } else {
                feedbackMessageEl.textContent = 'Incorrect! Try again.';
                feedbackMessageEl.className = 'incorrect';
                setTimeout(startTrainerCard, 1500);
            }
        }
        updateUI();
    }

    function endGame(message) {
        trainerGameOver = true;
        feedbackMessageEl.textContent = message;
        feedbackMessageEl.className = 'incorrect';
        streak = 0;
        showMainButtonsUI();
        drawCardBtn.disabled = true; // Disable start until reset
        stopTimer();
    }

    function resetShoe() {
        stopTimer();
        totalDecks = parseInt(deckCountSelectorEl.value, 10);
        difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        deck = createDeck(totalDecks);
        runningCount = 0;
        streak = 0;
        cardsSinceLastQuiz = 0;
        trainerGameOver = false;
        isQuizActive = false;
        
        quizModalEl.classList.add('hidden');
        currentCardEl.textContent = '🂠';
        feedbackMessageEl.textContent = 'Select settings and press "Reset Shoe" to begin!';
        feedbackMessageEl.className = '';
        
        showMainButtonsUI();
        drawCardBtn.disabled = false; // Enable start button
        updateUI();
    }

    // --- BETTING QUIZ LOGIC ---
    function startBettingQuiz() {
        isQuizActive = true;
        stopTimer();
        const trueCount = calculateTrueCount();
        quizQuestionEl.textContent = `The True Count is ${trueCount}. What's your bet?`;
        quizOptionsEl.innerHTML = '';
        quizFeedbackEl.textContent = '';
        quizFeedbackEl.className = 'quiz-feedback';
        const options = generateBetOptions(trueCount);
        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = `$${option.bet}`;
            button.onclick = () => handleQuizAnswer(option, options);
            quizOptionsEl.appendChild(button);
        });
        quizModalEl.classList.remove('hidden');
        updateUI();
    }

    function generateBetOptions(trueCount) {
        const tableMin = 10;
        let correctBet;
        if (trueCount > 1) { const calculatedBet = (trueCount - 1) * tableMin; correctBet = Math.min(tableMin * 10, calculatedBet); } else { correctBet = tableMin; }
        let decoyPool = [tableMin, tableMin * 2, tableMin * 3, tableMin * 5, tableMin * 8, tableMin * 10];
        decoyPool = decoyPool.filter(bet => bet !== correctBet);
        const shuffledDecoys = shuffle(decoyPool);
        const decoys = shuffledDecoys.slice(0, 2);
        let options = [{ bet: correctBet, isCorrect: true }];
        decoys.forEach(decoyBet => { options.push({ bet: decoyBet, isCorrect: false }); });
        return shuffle(options);
    }

    function handleQuizAnswer(chosenOption, allOptions) {
        const correctOption = allOptions.find(opt => opt.isCorrect);
        quizOptionsEl.querySelectorAll('button').forEach(btn => {
            btn.disabled = true;
            const optionValue = parseInt(btn.textContent.slice(1));
            if (optionValue === correctOption.bet) { btn.classList.add('correct-answer'); } else if (optionValue === chosenOption.bet) { btn.classList.add('wrong-answer'); }
        });
        if (chosenOption.isCorrect) {
            playerPoints += 100;
            quizFeedbackEl.textContent = 'Correct! This is the optimal bet. +100 Points!';
            quizFeedbackEl.className = 'quiz-feedback correct';
        } else {
            playerPoints -= 50;
            quizFeedbackEl.textContent = 'Incorrect. A poor betting decision is costly.';
            quizFeedbackEl.className = 'quiz-feedback incorrect';
        }
        updateUI();
        cardsSinceLastQuiz = 0;
        setTimeout(() => { isQuizActive = false; quizModalEl.classList.add('hidden'); startTrainerCard(); }, 2500);
    }

    // --- INITIALIZATION ---
    function initializeApp() {
        highStreak = parseInt(localStorage.getItem('cardCounterHighStreak')) || 0;

        deckCountSelectorEl.addEventListener('change', resetShoe);
        document.querySelectorAll('input[name="difficulty"]').forEach(radio => radio.addEventListener('change', resetShoe));
        drawCardBtn.addEventListener('click', startTrainerCard);
        resetShoeBtn.addEventListener('click', resetShoe);
        guessControlsEl.addEventListener('click', handleGuess);
        
        howToPlayBtn.addEventListener('click', () => { howToPlayModal.classList.remove('hidden'); });
        closeHowToPlayBtn.addEventListener('click', () => { howToPlayModal.classList.add('hidden'); });

        resetShoe();
    }

    // Run the app!
    initializeApp();
    
});
