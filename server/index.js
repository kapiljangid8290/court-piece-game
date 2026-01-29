const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const createInitialGameState = require("./game/state");
const { createDeck, shuffleDeck } = require("./game/cards");
const dealCards = require("./game/deal");
const playCard = require("./game/trick");
const declareTrump = require("./game/trump");
const determineTrickWinner = require("./game/trickWinner");

function getTeam(playerId) {
  return playerId === "player1" || playerId === "player3"
    ? "teamA"
    : "teamB";
}


const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// expose io to game logic
const { setIO } = require("./io");
setIO(io);

// ======================
// ROOMS STORAGE
// ======================
const rooms = {};

// ======================
// SOCKET CONNECTION
// ======================
io.on("connection", (socket) => {
  console.log("✅ Player connected:", socket.id);

  // ======================
  // CREATE ROOM
  // ======================
  socket.on("create_room", ({ playerName }) => {
    const roomId = Math.random().toString(36).substring(2, 8);

    rooms[roomId] = {
      players: [],
      gameState: null,
    };

    socket.roomId = roomId;
    socket.join(roomId);

    rooms[roomId].players.push({
      socketId: socket.id,
      playerId: "player1",
      name: playerName,
    });

    socket.emit("room_created", {
      roomId,
      playerId: "player1",
    });

    console.log("🏠 Room created:", roomId);
  });

  // ======================
  // JOIN ROOM
  // ======================
  socket.on("join_room", ({ roomId, playerName }) => {
    console.log("📥 join_room received:", roomId, playerName);

    const room = rooms[roomId];
    if (!room) {
      socket.emit("room_error", "Room not found");
      return;
    }

    if (room.players.length >= 4) {
      socket.emit("room_error", "Room is full");
      return;
    }

    const playerId = `player${room.players.length + 1}`;

    socket.roomId = roomId;
    socket.join(roomId);

    room.players.push({
      socketId: socket.id,
      playerId,
      name: playerName,
    });

    socket.emit("room_joined", {
      roomId,
      playerId,
    });

    io.to(roomId).emit("players_update", room.players);

    console.log("👤 Player joined:", playerName, playerId);

    // Auto start when 4 players join
    if (room.players.length === 4) {
      room.gameState = createInitialGameState();
      io.to(roomId).emit("game_ready");
      console.log("🎮 Game ready in room:", roomId);
    }
  });

  // ======================
  // START GAME
  // ======================
  socket.on("start_game", () => {
    const roomId = socket.roomId || socket.roomID;
    const room = rooms[roomId];
    if (!room) return;

    room.gameState = createInitialGameState();
    const gameState = room.gameState;

    gameState.currentCallIndex = 0;
    gameState.currentTurnIndex = 0;
    gameState.highestCall = null;
    gameState.highestCaller = null;

    let deck = createDeck();
    deck = shuffleDeck(deck);
    const dealt = dealCards(deck);

    gameState.players.player1.cards = dealt.player1;
    gameState.players.player2.cards = dealt.player2;
    gameState.players.player3.cards = dealt.player3;
    gameState.players.player4.cards = dealt.player4;

    // Send cards privately to each player
    room.players.forEach((p) => {
      io.to(p.socketId).emit(
        "your_cards",
        gameState.players[p.playerId].cards
      );
    });

    gameState.phase = "CALLING";

    const firstPlayer =
      gameState.callOrder[gameState.currentTurnIndex];

    io.to(roomId).emit("turn_update", firstPlayer);
    io.to(roomId).emit("phase_update", "CALLING");

    console.log("🂡 Cards dealt & game started:", roomId);
  });

  // ======================
  // MAKE CALL (BIDDING)
  // ======================
 socket.on("make_call", ({ playerId, call }) => {
  const roomId = socket.roomId;
  const room = rooms[roomId];
  if (!room || !room.gameState) return;

  const gameState = room.gameState;

  if (gameState.phase !== "CALLING") return;

  const expectedPlayer =
    gameState.callOrder[gameState.currentCallIndex];

  if (playerId !== expectedPlayer) {
    return; // ignore invalid clicks
  }

  // update highest bid
  if (
    gameState.highestCall === null ||
    call > gameState.highestCall
  ) {
    gameState.highestCall = call;
    gameState.highestCaller = playerId;

    io.to(roomId).emit("bid_update", {
      bid: call,
      playerId,
    });
  }

  // advance call turn
  gameState.currentCallIndex =
    (gameState.currentCallIndex + 1) % 4;

  const nextPlayer =
    gameState.callOrder[gameState.currentCallIndex];

  io.to(roomId).emit("turn_update", nextPlayer);

  // END CALLING after full round
  if (gameState.currentCallIndex === 0) {
    gameState.phase = "TRUMP";
    io.to(roomId).emit("phase_update", "TRUMP");

    // ONLY highest bidder declares trump
    io.to(roomId).emit("turn_update", gameState.highestCaller);
  }
});




  // ======================
  // DECLARE TRUMP
  // ======================
  socket.on("declare_trump", ({ playerId, trumpSuit }) => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room || !room.gameState) return;

    const gameState = room.gameState;
    const result = declareTrump(gameState, playerId, trumpSuit);

    if (result.error) {
      socket.emit("play_error", result.error);
      return;
    }

    gameState.phase = "PLAYING";
    gameState.phase = "PLAYING";

io.to(roomId).emit("phase_update", "PLAYING");

// ✅ Broadcast trump to ALL players
io.to(roomId).emit("trump_set", {
  trump: gameState.trumpSuit,
  caller: gameState.highestCaller,
});

// Set first turn (highest caller starts)
gameState.currentTurnIndex =
  gameState.callOrder.indexOf(gameState.highestCaller);

io.to(roomId).emit(
  "turn_update",
  gameState.callOrder[gameState.currentTurnIndex]
);

console.log("♠️ Trump set:", gameState.trumpSuit);


    const firstPlayer =
      gameState.callOrder[gameState.currentTurnIndex];

    io.to(roomId).emit("turn_update", firstPlayer);

    // Send partner cards ONLY now
    io.to(roomId).emit(
      "partner_cards",
      gameState.players[gameState.trumpCallerPartner].cards
    );

    console.log("♠️ Trump declared:", trumpSuit);
  });

  // ======================
  // PLAY CARD
  // ======================
  socket.on("play_card", ({ playerId, card }) => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room || !room.gameState) return;

    const gameState = room.gameState;
    // Guard: ensure game is in PLAYING phase
    if (gameState.phase !== "PLAYING") {
      return socket.emit("play_error", "Not in playing phase");
    }

    // Guard: ensure it's the expected player's turn
    const expectedPlayer =
      gameState.callOrder[gameState.currentTurnIndex];

    if (playerId !== expectedPlayer) {
      return socket.emit("play_error", "Not your turn");
    }
    const result = playCard(gameState, playerId, card, roomId);

    if (result.error) {
      socket.emit("play_error", result.error);
      return;
    }

    // Confirm success to the playing client
    socket.emit("play_success", card);

    // Broadcast the played card to all clients
    io.to(roomId).emit("card_played", { playerId, card });

    // If the trick resolution indicated game over, clear room state
    if (result && result.gameOver) {
      room.gameState = null;
      console.log("🔚 Game over in room:", roomId, result);
      return;
    }
  });

  // ======================
  // DISCONNECT
  // ======================
  socket.on("disconnect", () => {
  const roomId = socket.roomId;
  if (!roomId) {
    console.log("❌ Player disconnected (no room):", socket.id);
    return;
  }

  const room = rooms[roomId];
  if (!room) return;

  console.log("❌ Player disconnected:", socket.id, "from room", roomId);

  // Remove player from room
  room.players = room.players.filter(
    (p) => p.socketId !== socket.id
  );

  // Notify remaining players
  io.to(roomId).emit("players_update", room.players);

  // If room empty → delete room
  if (room.players.length === 0) {
    delete rooms[roomId];
    console.log("🗑️ Room deleted:", roomId);
    return;
  }

  // If game was running → reset game
  if (room.gameState) {
    room.gameState = null;
    io.to(roomId).emit("game_reset", {
      reason: "Player disconnected",
    });
    console.log("🔄 Game reset in room:", roomId);
  }
});

});

// ======================
// START SERVER
// ======================
server.listen(3001, () => {
  console.log("🚀 Server running on port 3001");
});
