function calculateScore(gameState) {
  const calledBy = gameState.highestCaller;
  const callValue = gameState.highestCall;

  const teamAPlayers = gameState.teams.teamA.players;
  const declaringTeam =
    teamAPlayers.includes(calledBy)
      ? gameState.teams.teamA
      : gameState.teams.teamB;

  const defendingTeam =
    declaringTeam === gameState.teams.teamA
      ? gameState.teams.teamB
      : gameState.teams.teamA;

  const declaringTricks = declaringTeam.tricks;

  if (declaringTricks >= callValue) {
    console.log("✅ Declaring team succeeded");
    // No penalty
  } else {
    console.log("❌ Declaring team failed");
    declaringTeam.score -= callValue * 2;
  }

  if (declaringTricks < 7) {
    defendingTeam.score -= callValue;
  }

  console.log(
    "📊 Scores → Team A:",
    gameState.teams.teamA.score,
    "| Team B:",
    gameState.teams.teamB.score
  );

  if (
    gameState.teams.teamA.score <= -52 ||
    gameState.teams.teamB.score <= -52
  ) {
    gameState.phase = "GAME_OVER";
    console.log("🏁 GAME OVER");
  } else {
    resetRound(gameState);
  }
}

function resetRound(gameState) {
  gameState.phase = "CALLING";

  gameState.teams.teamA.tricks = 0;
  gameState.teams.teamB.tricks = 0;

  gameState.highestCall = null;
  gameState.highestCaller = null;

  gameState.trump = null;
  gameState.trumpCallerPartner = null;

  gameState.currentTrick = [];
  gameState.currentTurnIndex = 0;
  gameState.trickCount = 0;

  console.log("🔄 New round started");
}

module.exports = calculateScore;
