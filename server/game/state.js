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
    currentCallIndex: 0,
    currentTurnIndex: 0,

    highestCall: null,
    highestCaller: null,

    trump: null,              // ✅ SINGLE SOURCE OF TRUTH
    trumpCallerPartner: null,

    currentTrick: [],

    tricksWon: {
      teamA: 0,
      teamB: 0,
    },
  };
}

module.exports = createInitialGameState;
