// --- DECK AND COUNT VARIABLES ---
let deck = [];
let runningCount = 0;
let totalDecks = 6; // Will be set from the selector

// --- GAME STATE VARIABLES ---
let playerPoints = 1000;
let streak = 0;
let currentBet = 0;
let trainerGameOver = false;

// --- DOM ELEMENT REFERENCES ---
const deckCountSelectorEl = document.getElementById('deck-count-selector');
const runningCountEl = document.getElementById('runningCount');
const decksRemainingEl = document.getElementById('decksRemaining');
const trueCountEl = document.getElementById('trueCount');
const drawCardBtn = document.getElementById('drawCardBtn');
const currentCardEl = document.getElementById('currentCard');

const playerHandEl = document.getElementById('playerHand');
const dealerHandEl = document.getElementById('dealerHand');
const hitBtn = document.getElementById('hitBtn');
const standBtn = document.getElementById('standBtn');
const newHandBtn = document.getElementById('newHandBtn');
const resultMessageEl = document.getElementById('resultMessage');

const playerPointsEl = document.getElementById('playerPoints');
const streakCounterEl = document.getElementById('streakCounter');
const feedbackMessageEl = document.getElementById('feedbackMessage');
const guessControlsEl = document.getElementById('guess-controls');
const guessButtons = document.querySelectorAll('.guess-btn');
const resetShoeBtn = document.getElementById('resetShoeBtn');
const betAmountEl = document.getElementById('betAmount');

// --- TRAINER-SPECIFIC VARIABLE ---
let currentCardForTrainer = null;

// --- CARD & DECK LOGIC ---
const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck(numDecks) {
    let newDeck = [];
    for (let i = 0; i < numDecks; i++) {
        for (let suit of suits) {
            for (let value of values) {
                newDeck.push({ suit, value });
            }
        }
    }
    return shuffle(newDeck);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getCardCountValue(card) {
    const cardValue = card.value;
    if (['2', '3', '4', '5', '6'].includes(cardValue)) return 1;
    if (['10', 'J', 'Q', 'K', 'A'].includes(cardValue)) return -1;
    return 0;
}

// --- UI & STATE UPDATE ---
function updateUI() {
    runningCountEl.textContent = runningCount;

    // Calculate decks remaining, ensuring it doesn't drop below a minimum for calculation
    const decksRemaining = Math.max(0.5, (deck.length / 52)).toFixed(1);
    decksRemainingEl.textContent = decksRemaining;

    // Calculate True Count
    const trueCount = (runningCount / decksRemaining).toFixed(1);
    trueCountEl.textContent = trueCount;

    playerPointsEl.textContent = playerPoints;
    streakCounterEl.textContent = streak;
}

// --- INTERACTIVE TRAINER LOGIC ---
function startTrainerCard() {
    if (deck.length === 0) {
        feedbackMessageEl.textContent = "Shoe is empty. Please reset.";
        drawCardBtn.disabled = true;
        return;
    }
    trainerGameOver = false;
    currentCardForTrainer = deck.pop();
    currentCardEl.textContent = `${currentCardForTrainer.value}${currentCardForTrainer.suit}`;

    drawCardBtn.classList.add('hidden');
    guessControlsEl.classList.remove('hidden');
    feedbackMessageEl.textContent = '';
    
    // Update counts immediately after card is shown for the UI
    updateUI();
}

function handleGuess(e) {
    if (trainerGameOver) return;

    const userGuess = parseInt(e.target.dataset.value, 10);
    const correctValue = getCardCountValue(currentCardForTrainer);
    
    // Update running count based on the actual card value
    runningCount += correctValue;

    if (userGuess === correctValue) {
        streak++;
        playerPoints += 10;
        feedbackMessageEl.textContent = `Correct! +10 Points`;
        feedbackMessageEl.className = 'correct';
        setTimeout(startTrainerCard, 800);
    } else {
        trainerGameOver = true;
        feedbackMessageEl.textContent = `Incorrect! Game Over. Final Streak: ${streak}`;
        feedbackMessageEl.className = 'incorrect';
        guessControlsEl.classList.add('hidden');
        drawCardBtn.classList.remove('hidden');
        drawCardBtn.disabled = true;
        streak = 0;
    }
    // Update UI after guess is processed
    updateUI();
}

function resetShoe() {
    totalDecks = parseInt(deckCountSelectorEl.value, 10);
    deck = createDeck(totalDecks);
    runningCount = 0;
    streak = 0;
    trainerGameOver = false;
    currentCardForTrainer = null;

    updateUI();
    // Special case for initial state text
    decksRemainingEl.textContent = totalDecks; 
    trueCountEl.textContent = 0;

    currentCardEl.textContent = '🂠';
    feedbackMessageEl.textContent = 'Press "Start Training" to begin!';
    feedbackMessageEl.className = '';

    guessControlsEl.classList.add('hidden');
    drawCardBtn.classList.remove('hidden');
    drawCardBtn.disabled = false;
}


// --- BLACKJACK GAME LOGIC ---
let playerHand = [];
let dealerHand = [];
let gameInProgress = false;

function drawCardForBlackjack() {
    if (deck.length < 4) { // Need at least a few cards to play
        alert("Not enough cards left in shoe! Please reset.");
        return null;
    }
    const card = deck.pop();
    runningCount += getCardCountValue(card);
    updateUI();
    return card;
}

function startNewHand() {
    currentBet = parseInt(betAmountEl.value);
    if (isNaN(currentBet) || currentBet <= 0) { alert("Please enter a valid bet."); return; }
    if (currentBet > playerPoints) { alert("You don't have enough points for that bet."); return; }
    if (trainerGameOver) { alert("Cannot start a game while trainer is in a 'Game Over' state. Please reset the shoe."); return; }


    playerPoints -= currentBet;
    updateUI();
    
    gameInProgress = true;
    playerHand = [];
    dealerHand = [];
    resultMessageEl.textContent = '';

    playerHand.push(drawCardForBlackjack());
    dealerHand.push(drawCardForBlackjack());
    playerHand.push(drawCardForBlackjack());

    playerHandEl.textContent = playerHand.map(c => c.value + c.suit).join(' ');
    dealerHandEl.textContent = dealerHand.map(c => c.value + c.suit).join(' ');

    hitBtn.disabled = false;
    standBtn.disabled = false;
    newHandBtn.disabled = true;

    if (calculateScore(playerHand) === 21) {
        endGame(true);
    }
}

function calculateScore(hand) {
    let total = 0, aces = 0;
    for (let card of hand) {
        if (['J', 'Q', 'K'].includes(card.value)) total += 10;
        else if (card.value === 'A') { total += 11; aces++; } 
        else total += parseInt(card.value);
    }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

function playerHits() {
    if (!gameInProgress) return;
    playerHand.push(drawCardForBlackjack());
    playerHandEl.textContent = playerHand.map(c => c.value + c.suit).join(' ');
    if (calculateScore(playerHand) > 21) {
        endGame();
    }
}

function dealerPlays() {
    while (calculateScore(dealerHand) < 17) {
        dealerHand.push(drawCardForBlackjack());
    }
    dealerHandEl.textContent = dealerHand.map(c => c.value + c.suit).join(' ');
}

function endGame(playerHasBlackjack = false) {
    gameInProgress = false;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    newHandBtn.disabled = false;

    dealerPlays();
    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(dealerHand);

    if (playerHasBlackjack && dealerScore !== 21) {
        resultMessageEl.textContent = `Blackjack! You win ${currentBet * 2.5} points!`;
        playerPoints += currentBet * 2.5;
    } else if (playerScore > 21) {
        resultMessageEl.textContent = `Player busts! You lose ${currentBet} points.`;
    } else if (dealerScore > 21 || playerScore > dealerScore) {
        resultMessageEl.textContent = `You win! You get ${currentBet * 2} points.`;
        playerPoints += currentBet * 2;
    } else if (playerScore < dealerScore) {
        resultMessageEl.textContent = `Dealer wins. You lose ${currentBet} points.`;
    } else {
        resultMessageEl.textContent = "Push! Your bet is returned.";
        playerPoints += currentBet;
    }
    currentBet = 0;
    updateUI();
}

// --- EVENT LISTENERS ---
drawCardBtn.addEventListener('click', startTrainerCard);
resetShoeBtn.addEventListener('click', resetShoe);
guessButtons.forEach(button => button.addEventListener('click', handleGuess));
newHandBtn.addEventListener('click', startNewHand);
hitBtn.addEventListener('click', playerHits);
standBtn.addEventListener('click', () => endGame());

// --- INITIALIZATION ---
function initializeApp() {
    guessControlsEl.classList.add('hidden');
    updateUI();
}

initializeApp();
