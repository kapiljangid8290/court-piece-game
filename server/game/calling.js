// game/calling.js

function makeCall(gameState, playerId, callValue) {
  const currentPlayer =
    gameState.callOrder[gameState.currentCallIndex];

  if (playerId !== currentPlayer) {
    return { error: "Not your turn to call" };
  }

  if (callValue !== "PASS") {
    if (
      typeof callValue !== "number" ||
      callValue < 7 ||
      callValue > 13
    ) {
      return { error: "Invalid call value" };
    }

    if (
      gameState.highestCall !== null &&
      callValue <= gameState.highestCall
    ) {
      return { error: "Call must be higher than current highest" };
    }

    gameState.highestCall = callValue;
    gameState.highestCaller = playerId;
  }

  gameState.currentCallIndex++;

  // If all players have called
  if (gameState.currentCallIndex >= 4) {
    gameState.phase = "TRUMP";
  }

  return { success: true };
}

module.exports = makeCall;
