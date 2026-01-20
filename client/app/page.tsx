"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Card = {
  suit: string;
  value: string;
};

export default function Home() {
  const socketRef = useRef<Socket | null>(null);
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
  const socket = io("http://localhost:3001");
  socketRef.current = socket;

  socket.on("connect", () => {
    console.log("🟢 Connected to game server");
  });

  socket.on("your_cards", (cardsFromServer: Card[]) => {
    setCards(cardsFromServer);
  });

  socket.on("play_error", (message: string) => {
    alert("❌ " + message);
  });

  socket.on("play_success", (card: Card) => {
    setCards((prev) =>
      prev.filter(
        (c) => !(c.suit === card.suit && c.value === card.value)
      )
    );
  });

  return () => {
    socket.disconnect();
  };
}, []);


  const startGame = () => {
    socketRef.current?.emit("start_game");
  };

  const playCard = (card: Card) => {
  console.log("🖱️ Clicked card:", card);
  socketRef.current?.emit("play_card", {
    playerId: "player1",
    card,
  });
};


  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-4">Court Piece Online</h1>

      <button
        className="mb-6 px-4 py-2 bg-black text-white rounded"
        onClick={startGame}
      >
        Start Game
      </button>

      <h2 className="text-xl mb-2">Your Cards</h2>

      <div className="flex gap-2 flex-wrap">
        {cards.map((card, index) => (
  <div
    key={index}
    onClick={() => playCard(card)}
    className="w-16 h-24 border rounded flex flex-col items-center justify-center bg-white shadow cursor-pointer hover:scale-105 transition"
  >

            <div className="text-sm">{card.value}</div>
            <div className="text-xs text-gray-500">{card.suit}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
