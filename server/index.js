const playCard = require("./game/trick");
const declareTrump = require("./game/trump");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const { createDeck, shuffleDeck } = require("./game/cards");
const dealCards = require("./game/deal");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

const createInitialGameState = require("./game/state");
const makeCall = require("./game/calling");

let gameState = createInitialGameState();

io.on("connection", (socket) => {
    socket.on("make_call", ({ playerId, callValue }) => {
  const result = makeCall(gameState, playerId, callValue);

  if (result.error) {
    console.log("❌ Call error:", result.error);
  } else {
    console.log("📢 Call made:", playerId, callValue);
    console.log("Highest call:", gameState.highestCall);
  }
});



socket.on("declare_trump", ({ playerId, trumpSuit }) => {
  const result = declareTrump(gameState, playerId, trumpSuit);

  if (result.error) {
    console.log("❌ Trump error:", result.error);
  } else {
    console.log("♠️ Trump declared:", result.trump);
    console.log("👀 Partner cards opened:", result.partnerOpened);
    console.log("➡️ Phase:", gameState.phase);
  }
});

socket.on("play_card", ({ playerId, card }) => {
  const result = playCard(gameState, playerId, card);

  if (result.error) {
    socket.emit("play_error", result.error);
  } else {
    socket.emit("play_success", card);
    console.log("🂡 Card played:", playerId, card);
  }
});

socket.on("auto_play_trick", () => {
  console.log("🤖 Auto playing one full trick (SERVER SIDE)");

  const order = gameState.callOrder.slice(
    gameState.currentTurnIndex
  );

  for (let i = 0; i < 4; i++) {
    const playerId = order[i % 4];
    const card = gameState.players[playerId].cards[0];

    if (!card) {
      console.log("No cards left for", playerId);
      return;
    }

    const result = require("./game/trick")(gameState, playerId, card);

    if (result.error) {
      console.log("❌ Auto play error:", result.error);
      return;
    }

    console.log("🤖 Auto played:", playerId, card);
  }
});


  console.log("✅ Player connected:", socket.id);

  socket.on("start_game", () => {
    console.log("🔥 start_game event RECEIVED");

    let deck = createDeck();
    deck = shuffleDeck(deck);

    const players = dealCards(deck);

    gameState.players.player1.cards = players.player1;
gameState.players.player2.cards = players.player2;
gameState.players.player3.cards = players.player3;
gameState.players.player4.cards = players.player4;


    console.log("🂡 Player 1:", players.player1.length);
    console.log("🂡 Player 2:", players.player2.length);
    console.log("🂡 Player 3:", players.player3.length);
    console.log("🂡 Player 4:", players.player4.length);
  });
  socket.emit("your_cards", gameState.players.player1.cards);

});

server.listen(3001, () => {
  console.log("🚀 Server running on port 3001");
});
