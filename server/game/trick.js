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
    // Advance turn index
    gameState.currentTurnIndex = (gameState.currentTurnIndex + 1) % 4;

    // Emit next turn to clients if the trick is not yet complete
    if (gameState.currentTrick.length < 4) {
      const { getIO } = require("../io");
      const io = getIO();
      const nextPlayer = gameState.callOrder[gameState.currentTurnIndex];

      if (roomId) {
        io.to(roomId).emit("turn_update", nextPlayer);
      } else {
        io.emit("turn_update", nextPlayer);
      }
    }

    // If trick complete
    if (gameState.currentTrick.length === 4) {
  const determineTrickWinner = require("./trickWinner");
  const { getIO } = require("../io");
  const io = getIO();

  const { winner } = determineTrickWinner(
    gameState.currentTrick,
    gameState.trump
  );

  const winningTeam =
    ["player1", "player3"].includes(winner)
      ? "teamA"
      : "teamB";

  gameState.tricksWon[winningTeam] += 1;

  console.log("🏆 Trick won by:", winner);
  console.log("📊 Score:", gameState.tricksWon);

  // 🔥 SEND SCORE UPDATE
  io.to(roomId).emit("score_update", gameState.tricksWon);

  // next trick
  gameState.currentTurnIndex =
    gameState.callOrder.indexOf(winner);

  gameState.currentTrick = [];
  gameState.trickCount += 1;

  io.to(roomId).emit("trick_end", {
    winner,
    tricksWon: gameState.tricksWon,
  });

  io.to(roomId).emit(
    "turn_update",
    gameState.callOrder[gameState.currentTurnIndex]
  );
}


    return { success: true };
}

function resolveTrick(gameState, roomId) {
  const leadSuit = gameState.currentTrick[0].card.suit;

  function cardRank(card) {
    const order = [
      "2","3","4","5","6","7","8","9","10","J","Q","K","A"
    ];
    return order.indexOf(card.value);
  }

  const determineTrickWinner = require("./trickWinner");

const { winner } = determineTrickWinner(
  gameState.currentTrick,
  gameState.trump
);


  // helper to map player -> team
  function getTeam(player) {
    return ["player1", "player3"].includes(player) ? "teamA" : "teamB";
  }

  const winningTeam = getTeam(winner);

  // Ensure tricksWon structure
  if (!gameState.tricksWon) {
    gameState.tricksWon = { teamA: 0, teamB: 0 };
  }

  // Update tricks won
  gameState.tricksWon[winningTeam] += 1;

  gameState.trickLeader = winner;
  gameState.currentTurnIndex = gameState.callOrder.indexOf(winner);

  gameState.currentTrick = [];
  gameState.trickCount = (gameState.trickCount || 0) + 1;

  console.log("🏆 Trick won by", winner, "(", winningTeam, ")");
  console.log("📊 Score:", gameState.tricksWon);

  const { getIO } = require("../io");
  const io = getIO();

  // Broadcast score update
  if (roomId) {
    io.to(roomId).emit("score_update", gameState.tricksWon);
  } else {
    io.emit("score_update", gameState.tricksWon);
  }

  // Check win condition
  const bidTeam = gameState.highestCaller ? getTeam(gameState.highestCaller) : null;
  const bidValue = gameState.highestCall || 0;

  const bidTeamTricks = bidTeam ? gameState.tricksWon[bidTeam] : 0;

  // Bid team wins
  if (bidTeam && bidValue > 0 && bidTeamTricks >= bidValue) {
    if (roomId) {
      io.to(roomId).emit("game_over", {
        winner: bidTeam,
        reason: "Bid achieved",
      });
    } else {
      io.emit("game_over", {
        winner: bidTeam,
        reason: "Bid achieved",
      });
    }

    return { gameOver: true, winner: bidTeam, reason: "Bid achieved" };
  }

  // Opponent wins (cannot reach bid anymore)
  const totalTricksPlayed = gameState.tricksWon.teamA + gameState.tricksWon.teamB;
  const remainingTricks = 13 - totalTricksPlayed;

  if (bidTeam && bidValue > 0 && bidTeamTricks + remainingTricks < bidValue) {
    const otherTeam = bidTeam === "teamA" ? "teamB" : "teamA";

    if (roomId) {
      io.to(roomId).emit("game_over", {
        winner: otherTeam,
        reason: "Bid failed",
      });
    } else {
      io.emit("game_over", {
        winner: otherTeam,
        reason: "Bid failed",
      });
    }

    return { gameOver: true, winner: otherTeam, reason: "Bid failed" };
  }

  // Emit trick_end payload for clients
  const payload = {
    winner,
    tricksWon: gameState.tricksWon,
  };

  if (roomId) {
    io.to(roomId).emit("trick_end", payload);
  } else {
    io.emit("trick_end", payload);
  }

  // After trick resolved, update clients with next turn (trick leader)
  const nextPlayer = gameState.callOrder[gameState.currentTurnIndex];
  if (roomId) {
    io.to(roomId).emit("turn_update", nextPlayer);
  } else {
    io.emit("turn_update", nextPlayer);
  }

  // If all tricks played, move to SCORING
  if (gameState.trickCount === 13) {
    gameState.phase = "SCORING";
    const calculateScore = require("./scoring");
    calculateScore(gameState);
  }

  return { gameOver: false };
}

module.exports = playCard;
