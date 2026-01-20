function declareTrump(gameState, playerId, trumpSuit) {
  if (gameState.phase !== "TRUMP") {
    return { error: "Not in trump declaration phase" };
  }

  if (playerId !== gameState.highestCaller) {
    return { error: "Only highest caller can declare trump" };
  }

  const validSuits = ["hearts", "diamonds", "clubs", "spades"];
  if (!validSuits.includes(trumpSuit)) {
    return { error: "Invalid trump suit" };
  }

  gameState.trump = trumpSuit;

  // Decide partner (fixed positions)
  const partnerMap = {
    player1: "player3",
    player2: "player4",
    player3: "player1",
    player4: "player2",
  };

  const partner = partnerMap[playerId];
  gameState.trumpCallerPartner = partner;

  // Open partner cards
  gameState.players[partner].cardsOpen = true;

  gameState.phase = "PLAYING";

  return {
    success: true,
    trump: trumpSuit,
    partnerOpened: partner,
  };
}

module.exports = declareTrump;
