// game/deal.js

function dealCards(deck) {
  const players = {
    player1: [],
    player2: [],
    player3: [],
    player4: [],
  };

  // Round 1 → 5 cards
  for (let i = 0; i < 5; i++) {
    players.player1.push(deck.pop());
    players.player2.push(deck.pop());
    players.player3.push(deck.pop());
    players.player4.push(deck.pop());
  }

  // Round 2 → 4 cards
  for (let i = 0; i < 4; i++) {
    players.player1.push(deck.pop());
    players.player2.push(deck.pop());
    players.player3.push(deck.pop());
    players.player4.push(deck.pop());
  }

  // Round 3 → 4 cards
  for (let i = 0; i < 4; i++) {
    players.player1.push(deck.pop());
    players.player2.push(deck.pop());
    players.player3.push(deck.pop());
    players.player4.push(deck.pop());
  }

  return players;
}

module.exports = dealCards;
