function playCard(gameState, playerId, card, roomId) {
  if (gameState.phase !== "PLAYING") {
    return { error: "Game not in playing phase" };
  }

  const expectedPlayer =
    gameState.callOrder[gameState.currentTurnIndex];

  if (playerId !== expectedPlayer) {
    return { error: "Not your turn" };
  }

  const playerCards = gameState.players[playerId].cards;

  const cardIndex = playerCards.findIndex(
    (c) => c.suit === card.suit && c.value === card.value
  );

  if (cardIndex === -1) {
    return { error: "Card not in your hand" };
  }

  // Follow suit rule
  if (gameState.currentTrick.length > 0) {
    const leadSuit = gameState.currentTrick[0].card.suit;
    const hasLeadSuit = playerCards.some(
      (c) => c.suit === leadSuit
    );

    if (hasLeadSuit && card.suit !== leadSuit) {
      return { error: "Must follow suit" };
    }
  }

  // Remove card from hand
  playerCards.splice(cardIndex, 1);

  // Add to trick
  gameState.currentTrick.push({ playerId, card });

  gameState.currentTurnIndex =
    (gameState.currentTurnIndex + 1) % 4;

  // If trick complete
  if (gameState.currentTrick.length === 4) {
    resolveTrick(gameState, roomId);
  }

  return { success: true };
}

function resolveTrick(gameState, roomId) {
  const trump = gameState.trump;
  const leadSuit = gameState.currentTrick[0].card.suit;

  function cardRank(card) {
    const order = [
      "2","3","4","5","6","7","8","9","10","J","Q","K","A"
    ];
    return order.indexOf(card.value);
  }

  let winningPlay = gameState.currentTrick[0];

  for (let play of gameState.currentTrick) {
    const winCard = winningPlay.card;
    const currCard = play.card;

    if (
      currCard.suit === winCard.suit &&
      cardRank(currCard) > cardRank(winCard)
    ) {
      winningPlay = play;
    }

    if (
      currCard.suit === trump &&
      winCard.suit !== trump
    ) {
      winningPlay = play;
    }
  }

  const winner = winningPlay.playerId;

  // Assign trick to team
  if (["player1","player3"].includes(winner)) {
    gameState.teams.teamA.tricks++;
  } else {
    gameState.teams.teamB.tricks++;
  }

  gameState.trickLeader = winner;
  gameState.currentTurnIndex =
    gameState.callOrder.indexOf(winner);

  gameState.currentTrick = [];
  gameState.trickCount++;

  console.log("🏆 Trick won by:", winner);
  console.log(
    "Score A:",
    gameState.teams.teamA.tricks,
    "Score B:",
    gameState.teams.teamB.tricks
  );
  
  const { getIO } = require("../io");
  const io = getIO();

  const payload = {
    winner,
    teamA: gameState.teams.teamA.tricks,
    teamB: gameState.teams.teamB.tricks,
  };

  if (roomId) {
    io.to(roomId).emit("trick_end", payload);
  } else {
    io.emit("trick_end", payload);
  }

  if (gameState.trickCount === 13) {
  gameState.phase = "SCORING";
  const calculateScore = require("./scoring");
  calculateScore(gameState);
}

}

module.exports = playCard;
