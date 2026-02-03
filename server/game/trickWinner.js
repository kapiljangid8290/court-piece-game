function determineTrickWinner(trick, trumpSuit) {
  const leadSuit = trick[0].card.suit;

  // 1️⃣ Filter trump cards
  const trumpCards = trick.filter(
    (t) => t.card.suit === trumpSuit
  );

  // 2️⃣ Decide candidates
  const candidates =
    trumpCards.length > 0
      ? trumpCards
      : trick.filter((t) => t.card.suit === leadSuit);

  // 3️⃣ Rank cards
  const VALUE_ORDER = [
    "2","3","4","5","6","7","8","9","10","J","Q","K","A"
  ];

  let winner = candidates[0];

  for (let c of candidates) {
    if (
      VALUE_ORDER.indexOf(c.card.value) >
      VALUE_ORDER.indexOf(winner.card.value)
    ) {
      winner = c;
    }
  }

  return {
    winner: winner.playerId,
    winningCard: winner.card,
  };
}

module.exports = determineTrickWinner;
