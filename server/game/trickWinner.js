const rankOrder = [
  "2","3","4","5","6","7","8","9","10","J","Q","K","A"
];

function cardRank(value) {
  return rankOrder.indexOf(value);
}

module.exports = function determineTrickWinner(trick, trumpSuit) {
  const leadSuit = trick[0].card.suit;

  let winningPlay = trick[0];

  for (const play of trick.slice(1)) {
    const { card } = play;

    // Trump beats non-trump
    if (
      card.suit === trumpSuit &&
      winningPlay.card.suit !== trumpSuit
    ) {
      winningPlay = play;
      continue;
    }

    // Same suit comparison
    if (
      card.suit === winningPlay.card.suit &&
      cardRank(card.value) > cardRank(winningPlay.card.value)
    ) {
      winningPlay = play;
    }
  }

  return winningPlay.playerId;
};
