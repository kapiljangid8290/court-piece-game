const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const createInitialGameState = require("./game/state");
const { createDeck, shuffleDeck } = require("./game/cards");
const dealCards = require("./game/deal");
const playCard = require("./game/trick");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  // ====================================================
  // JOIN GAME (Single entry point)
  // ====================================================
  socket.on("JOIN_GAME", ({ roomId }) => {
    socket.roomId = roomId;
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [],
        gameState: null,
      };
    }

    const room = rooms[roomId];

    // Assign player slot
    let player = room.players.find(p => p.socketId === socket.id);

    if (!player) {
      const playerIndex = room.players.length;

      if (playerIndex >= 4) {
        socket.emit("room_error", "Room is full");
        return;
      }

      const playerId = `player${playerIndex + 1}`;

      player = {
        socketId: socket.id,
        playerId,
      };

      room.players.push(player);
      socket.emit("PLAYER_ASSIGNED", { playerId });
    }

    // Bootstrap game only once
    if (!room.gameState) {
      const gameState = createInitialGameState();

      let deck = createDeck();
      deck = shuffleDeck(deck);
      const dealt = dealCards(deck);

      gameState.players.player1.cards = dealt.player1;
      gameState.players.player2.cards = dealt.player2;
      gameState.players.player3.cards = dealt.player3;
      gameState.players.player4.cards = dealt.player4;

      gameState.phase = "CALLING";
      gameState.currentTurnIndex = 0;
      gameState.currentCallIndex = 0;
      gameState.highestCall = null;
      gameState.highestCaller = null;

      room.gameState = gameState;

      console.log("🎮 Game bootstrapped:", roomId);
    }

    const gameState = room.gameState;

    // Send private cards
    socket.emit(
      "your_cards",
      gameState.players[player.playerId].cards
    );

    // Send current phase + turn to everyone
    io.to(roomId).emit("phase_update", gameState.phase);
    io.to(roomId).emit(
      "turn_update",
      gameState.callOrder[gameState.currentTurnIndex]
    );
  });

  // ====================================================
  // MAKE CALL (BIDDING)
  // ====================================================
  socket.on("make_call", ({ playerId, call }) => {
    const room = rooms[socket.roomId];
    if (!room || !room.gameState) return;

    const gameState = room.gameState;

    if (gameState.phase !== "CALLING") return;

    const expectedPlayer =
      gameState.callOrder[gameState.currentCallIndex];

    if (playerId !== expectedPlayer) return;

    // PASS logic
    if (call !== "PASS") {
      if (
        gameState.highestCall === null ||
        call > gameState.highestCall
      ) {
        gameState.highestCall = call;
        gameState.highestCaller = playerId;

        io.to(socket.roomId).emit("bid_update", {
          bid: call,
          playerId,
        });
      }
    }

    // Move to next bidder
    gameState.currentCallIndex =
      (gameState.currentCallIndex + 1) % 4;

    const next =
      gameState.callOrder[gameState.currentCallIndex];

    io.to(socket.roomId).emit("turn_update", next);

    // End bidding after full round
    if (gameState.currentCallIndex === 0 && gameState.highestCaller) {
      gameState.phase = "TRUMP";

      gameState.currentTurnIndex =
        gameState.callOrder.indexOf(gameState.highestCaller);

      io.to(socket.roomId).emit("trump_phase_started", {
        highestCaller: gameState.highestCaller,
      });

      io.to(socket.roomId).emit("phase_update", "TRUMP");
      io.to(socket.roomId).emit(
        "turn_update",
        gameState.highestCaller
      );

      console.log(
        "🎯 TRUMP phase started. Caller:",
        gameState.highestCaller
      );
    }
  });

  // ====================================================
  // DECLARE TRUMP
  // ====================================================
  socket.on("declare_trump", ({ playerId, trumpSuit }) => {
    const room = rooms[socket.roomId];
    if (!room || !room.gameState) return;

    const gameState = room.gameState;

    if (gameState.phase !== "TRUMP") return;
    if (playerId !== gameState.highestCaller) return;

    gameState.trump = trumpSuit;
    gameState.phase = "PLAYING";

    io.to(socket.roomId).emit("trump_set", {
      trump: trumpSuit,
    });

    io.to(socket.roomId).emit("phase_update", "PLAYING");

    gameState.currentTurnIndex =
      gameState.callOrder.indexOf(gameState.highestCaller);

    io.to(socket.roomId).emit(
      "turn_update",
      gameState.callOrder[gameState.currentTurnIndex]
    );

    console.log("♠️ Trump selected:", trumpSuit);
  });

  // ====================================================
  // PLAY CARD
  // ====================================================
  socket.on("play_card", ({ playerId, card }) => {
    const room = rooms[socket.roomId];
    if (!room || !room.gameState) return;

    const result = playCard(
      room.gameState,
      playerId,
      card,
      socket.roomId
    );

    if (result?.error) {
      socket.emit("play_error", result.error);
    }
  });

  // ====================================================
  // DISCONNECT
  // ====================================================
  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;

    const room = rooms[roomId];

    room.players = room.players.filter(
      p => p.socketId !== socket.id
    );

    console.log("❌ Disconnected:", socket.id);

    if (room.players.length === 0) {
      delete rooms[roomId];
      console.log("🗑 Room deleted:", roomId);
    }
  });
});

server.listen(3001, () => {
  console.log("🚀 Server running on 3001");
});
