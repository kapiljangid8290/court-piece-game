function createInitialGameState() {
  return {
    phase: "CALLING", // CALLING | TRUMP | PLAYING | SCORING | GAME_OVER

    players: {
      player1: { cards: [], cardsOpen: false },
      player2: { cards: [], cardsOpen: false },
      player3: { cards: [], cardsOpen: false },
      player4: { cards: [], cardsOpen: false },
    },

    teams: {
      teamA: {
        players: ["player1", "player3"],
        tricks: 0,
        score: 0,
      },
      teamB: {
        players: ["player2", "player4"],
        tricks: 0,
        score: 0,
      },
    },

    callOrder: ["player1", "player2", "player3", "player4"],
    currentCallIndex: 0,

    highestCall: null,
    highestCaller: null,

    trump: null,
    trumpCallerPartner: null,

    currentTrick: [],
    currentTurnIndex: 0,
    trickLeader: "player1",
    trickCount: 0,
  };
}

module.exports = createInitialGameState;
