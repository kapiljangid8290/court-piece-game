// game/cards.js

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const VALUES = [
  "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "J", "Q", "K", "A"
];

// Create full 52-card deck
function createDeck() {
  const deck = [];

  for (let suit of SUITS) {
    for (let value of VALUES) {
      deck.push({ suit, value });
    }
  }

  return deck;
}

// Shuffle deck (Fisher-Yates)
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

module.exports = {
  createDeck,
  shuffleDeck,
};
