let deck = [];
let runningCount = 0;
let decksRemaining = 6;

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

let playerHand = [];
let dealerHand = [];
let gameInProgress = false;

// Unicode suits and card values
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
  return array.sort(() => Math.random() - 0.5);
}

function drawCard() {
  if (deck.length === 0) {
    deck = createDeck();
    decksRemaining = 6;
    runningCount = 0;
  }
  const card = deck.pop();
  updateCounts(card);
  updateDisplay(card);
  return card;
}

function updateCounts(card) {
  let cardValue = card.value;
  if (['2', '3', '4', '5', '6'].includes(cardValue)) {
    runningCount++;
  } else if (['10', 'J', 'Q', 'K', 'A'].includes(cardValue)) {
    runningCount--;
  }
  decksRemaining = Math.max(0.5, (deck.length / 52).toFixed(1));
  updateUI();
}

function updateDisplay(card) {
  currentCardEl.textContent = `${card.value}${card.suit}`;
}

function updateUI() {
  runningCountEl.textContent = runningCount;
  decksRemainingEl.textContent = decksRemaining;
  trueCountEl.textContent = Math.round(runningCount / decksRemaining);
}

// Blackjack game logic
function dealCardTo(hand) {
  const card = drawCard();
  hand.push(card);
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

// Event listeners
drawCardBtn.addEventListener('click', () => drawCard());
newHandBtn.addEventListener('click', () => startNewHand());
hitBtn.addEventListener('click', () => playerHits());
standBtn.addEventListener('click', () => endGame());

// Initialize
deck = createDeck();
updateUI();
