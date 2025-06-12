// --- EXISTING DECK AND COUNT VARIABLES ---
let deck = [];
let runningCount = 0;
let decksRemaining = 6;

// --- EXISTING DOM ELEMENT REFERENCES ---
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

// --- ADDED DOM ELEMENT REFERENCES ---
const feedbackMessageEl = document.getElementById('feedbackMessage');
const guessControlsEl = document.getElementById('guess-controls');
const guessButtons = document.querySelectorAll('.guess-btn');
const resetShoeBtn = document.getElementById('resetShoeBtn');

// --- EXISTING BLACKJACK VARIABLES ---
let playerHand = [];
let dealerHand = [];
let gameInProgress = false;

// --- ADDED TRAINER-SPECIFIC VARIABLE ---
let currentCardForTrainer = null; // Stores the card waiting for a guess

// --- EXISTING DECK CREATION & UTILITY FUNCTIONS ---
const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck(numDecks = 6) {
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
  // Fisher-Yates shuffle is more robust
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --- ADDED HELPER FUNCTION FOR CARD COUNT VALUE ---
function getCardCountValue(card) {
  const cardValue = card.value;
  if (['2', '3', '4', '5', '6'].includes(cardValue)) return 1;
  if (['10', 'J', 'Q', 'K', 'A'].includes(cardValue)) return -1;
  return 0;
}

// --- MODIFIED & ORIGINAL COUNTING FUNCTIONS ---

// This function is now used by the Blackjack game. The trainer will use it AFTER a guess.
function updateCounts(card) {
  runningCount += getCardCountValue(card);
  decksRemaining = Math.max(0.5, (deck.length / 52).toFixed(1));
  updateUI();
}

function updateDisplay(card) {
  currentCardEl.textContent = `${card.value}${card.suit}`;
}

function updateUI() {
  runningCountEl.textContent = runningCount;
  decksRemainingEl.textContent = decksRemaining;
  // Prevent division by zero if decks remaining is 0
  const trueCount = decksRemaining > 0 ? Math.round(runningCount / decksRemaining) : 0;
  trueCountEl.textContent = trueCount;
}

// --- ADDED: NEW INTERACTIVE TRAINER LOGIC ---
function startTrainerCard() {
  if (deck.length === 0) {
    alert("Shoe is empty. Please reset the shoe.");
    return;
  }
  
  currentCardForTrainer = deck.pop();
  updateDisplay(currentCardForTrainer);
  
  // Hide deal button, show guess controls
  drawCardBtn.classList.add('hidden');
  guessControlsEl.classList.remove('hidden');
  feedbackMessageEl.textContent = ''; // Clear previous feedback
}

function handleGuess(e) {
  const userGuess = parseInt(e.target.dataset.value, 10);
  const correctValue = getCardCountValue(currentCardForTrainer);

  if (userGuess === correctValue) {
    feedbackMessageEl.textContent = "Correct!";
    feedbackMessageEl.className = 'correct';
  } else {
    feedbackMessageEl.textContent = `Incorrect. The value was ${correctValue}.`;
    feedbackMessageEl.className = 'incorrect';
  }

  // Now, update the official count
  runningCount += correctValue;
  decksRemaining = Math.max(0.5, (deck.length / 52).toFixed(1));
  updateUI();

  // Hide guess controls, show deal button
  guessControlsEl.classList.add('hidden');
  drawCardBtn.classList.remove('hidden');
  
  if (deck.length === 0) {
      drawCardBtn.disabled = true;
      feedbackMessageEl.textContent = "End of shoe! Please reset.";
  }
}

function resetShoe() {
    deck = createDeck();
    runningCount = 0;
    decksRemaining = 6;
    currentCardForTrainer = null;
    
    updateUI();
    currentCardEl.textContent = '🂠';
    feedbackMessageEl.textContent = '';
    
    // Reset button visibility
    guessControlsEl.classList.add('hidden');
    drawCardBtn.classList.remove('hidden');
    drawCardBtn.disabled = false;
    
    console.log("Shoe has been reset.");
}

// --- UNCHANGED BLACKJACK GAME LOGIC ---
function drawCard() {
  if (deck.length === 0) {
    alert("Shoe is empty! Please reset.");
    return null; // Handle empty deck case for blackjack
  }
  const card = deck.pop();
  updateCounts(card); // Blackjack updates count immediately
  // Note: The main card display is NOT updated by the blackjack game
  return card;
}

function dealCardTo(hand) {
  const card = drawCard();
  if (card) {
      hand.push(card);
  }
  return card;
}

function renderHand(el, hand) {
  el.innerHTML = hand.map(card => `${card.value}${card.suit}`).join(' ');
}

function calculateScore(hand) {
  let total = 0;
  let aces = 0;
  for (let card of hand) {
    if (['J', 'Q', 'K'].includes(card.value)) {
      total += 10;
    } else if (card.value === 'A') {
      total += 11;
      aces++;
    } else {
      total += parseInt(card.value);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function checkWinner() {
  const playerScore = calculateScore(playerHand);
  const dealerScore = calculateScore(dealerHand);

  if (playerScore > 21) {
    resultMessageEl.textContent = "Player busts! Dealer wins.";
  } else if (dealerScore > 21) {
    resultMessageEl.textContent = "Dealer busts! Player wins!";
  } else if (playerScore > dealerScore) {
    resultMessageEl.textContent = "Player wins!";
  } else if (playerScore < dealerScore) {
    resultMessageEl.textContent = "Dealer wins.";
  } else {
    resultMessageEl.textContent = "It's a tie!";
  }
}

function startNewHand() {
  // Ensure there are enough cards to play a hand
  if (deck.length < 10) {
      alert("Not enough cards to play. Please reset the shoe.");
      return;
  }
  playerHand = [];
  dealerHand = [];
  resultMessageEl.textContent = '';
  gameInProgress = true;

  dealCardTo(playerHand);
  dealCardTo(playerHand);
  dealCardTo(dealerHand);

  renderHand(playerHandEl, playerHand);
  renderHand(dealerHandEl, dealerHand);

  hitBtn.disabled = false;
  standBtn.disabled = false;
}

function playerHits() {
  if (!gameInProgress) return;
  dealCardTo(playerHand);
  renderHand(playerHandEl, playerHand);
  if (calculateScore(playerHand) > 21) {
    endGame();
  }
}

function dealerPlays() {
  while (calculateScore(dealerHand) < 17) {
    dealCardTo(dealerHand);
  }
  renderHand(dealerHandEl, dealerHand);
}

function endGame() {
  hitBtn.disabled = true;
  standBtn.disabled = true;
  gameInProgress = false;
  dealerPlays();
  checkWinner();
}


// --- UPDATED & NEW EVENT LISTENERS ---
// The main card button now starts the interactive trainer round
drawCardBtn.addEventListener('click', startTrainerCard);

// The reset button calls the new reset function
resetShoeBtn.addEventListener('click', resetShoe);

// Add listeners to all guess buttons
guessButtons.forEach(button => {
  button.addEventListener('click', handleGuess);
});


// --- UNCHANGED BLACKJACK LISTENERS ---
newHandBtn.addEventListener('click', startNewHand);
hitBtn.addEventListener('click', playerHits);
standBtn.addEventListener('click', endGame);


// --- INITIALIZATION ---
function initializeApp() {
    deck = createDeck();
    updateUI();
    // Hide the guess controls on startup
    guessControlsEl.classList.add('hidden');
    console.log("Card counting trainer initialized.");
}

// Start the app
initializeApp();
