const { io } = require("socket.io-client");

console.log("🧪 Test client starting...");

const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);
  socket.emit("start_game");

setTimeout(() => {
  socket.emit("make_call", { playerId: "player1", callValue: 8 });
  socket.emit("make_call", { playerId: "player2", callValue: 9 });
  socket.emit("make_call", { playerId: "player3", callValue: "PASS" });
  socket.emit("make_call", { playerId: "player4", callValue: "PASS" });
}, 1000);

setTimeout(() => {
  socket.emit("declare_trump", {
    playerId: "player2",
    trumpSuit: "hearts",
  });
}, 2000);

// setTimeout(() => {
//   socket.emit("play_card", {
//     playerId: "player1",
//     card: gameState.players.player1.cards[0],
//   });
// }, 3000);

setTimeout(() => {
  socket.emit("auto_play_trick");
}, 3000);


  console.log("📤 start_game event SENT");
});

socket.on("connect_error", (err) => {
  console.log("❌ Connection error:", err.message);
});
