function createInitialGameState() {
  return {
    phase: "CALLING",

    players: {
      player1: { cards: [] },
      player2: { cards: [] },
      player3: { cards: [] },
      player4: { cards: [] },
    },

    callOrder: ["player1", "player2", "player3", "player4"],
    currentTurnIndex: 0,

    highestCall: null,
    highestCaller: null,

    // ✅ SINGLE trump variable
    trump: null,

    currentTrick: [],
    trickLeader: null,
    trickCount: 0,

    // ✅ SCOREBOARD STATE
    tricksWon: {
      teamA: 0,
      teamB: 0,
    },
  };
}

module.exports = createInitialGameState;
