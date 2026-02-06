"use client";

import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();

  const [cards, setCards] = useState<any[]>([]);
  const [phase, setPhase] = useState("CALLING");
  const [currentTurn, setCurrentTurn] = useState("");
  const [highestCall, setHighestCall] = useState<number | null>(null);
  const [highestCaller, setHighestCaller] = useState<string | null>(null);
  const [calls, setCalls] = useState<any>({});
  const [trump, setTrump] = useState<string | null>(null);
const [partnerCards, setPartnerCards] = useState<any[]>([]);
const [partnerId, setPartnerId] = useState<string | null>(null);
const [myPlayerSlot, setMyPlayerSlot] = useState<string | null>(null);


  useEffect(() => {
    socket.on("CARDS_DEALT", ({ cards }) => {
      setCards(cards);
    });

    socket.on("TRUMP_DECLARED", (data) => {
    setTrump(data.trump);
    setPartnerId(data.partnerOpenPlayer);
    setPartnerCards(data.partnerCards);
    setPhase(data.phase);
  });

    socket.on("CALL_UPDATE", (data) => {
      setCalls(data.calls);
      setHighestCall(data.highestCall);
      setHighestCaller(data.highestCaller);
      setCurrentTurn(data.currentTurn);
      setPhase(data.phase);
    });

     socket.on("game_state_update", ({ gameState }) => {
    // Update cards if this player played
   if (myPlayerSlot && gameState.players?.[myPlayerSlot]) {
  setCards(gameState.players[myPlayerSlot].cards);
}

  });

  socket.on("play_error", (msg) => {
    alert(msg);
  });
  
  socket.on("PLAYER_ASSIGNED", ({ playerSlot }) => {
    setMyPlayerSlot(playerSlot);
  });
    return () => {
      socket.off("CARDS_DEALT");
      socket.off("CALL_UPDATE");
      socket.off("TRUMP_DECLARED");
      socket.off("game_state_update");
      socket.off("play_error");
        socket.off("PLAYER_ASSIGNED");
    };
  }, []);

  

  const makeCall = (call: number | "PASS") => {
    socket.emit("make_call", {
      playerId: socket.id, // IMPORTANT: later replace with mapped playerId
      call,
    });
  };

  const playCard = (card: any) => {
  if (!myPlayerSlot) return;

socket.emit("play_card", {
  playerSlot: myPlayerSlot,
  card,
});

};

  return (
    <main className="min-h-screen bg-green-900 text-white p-6">
      <h1 className="text-2xl font-bold text-yellow-400 mb-2">
        Game Started
      </h1>

      <p className="text-sm mb-4">Game ID: {gameId}</p>

      {/* CARDS */}
      <div className="bg-black/40 rounded-xl p-4 mb-6">
        <h2 className="font-bold mb-2">Your Cards</h2>
        <div className="flex flex-wrap gap-2">
          {cards.map((card, i) => (
  <button
    key={i}
    onClick={() => playCard(card)}
    className="px-3 py-2 bg-white text-black rounded hover:bg-yellow-300"
  >
    {card.value} {card.suit}
  </button>
))}

        </div>
      </div>

      {/* CALLING */}
      {phase === "CALLING" && (
        <div className="bg-black/40 p-4 rounded-xl">
          <h2 className="font-bold mb-2">Calling Phase</h2>

          <p className="text-sm mb-2">
            Current Turn: {currentTurn}
          </p>

          <p className="text-sm mb-3">
            Highest Call: {highestCall ?? "None"}
          </p>

          <div className="flex gap-2 flex-wrap">
            {[7,8,9,10,11,12,13].map((n) => (
              <button
                key={n}
                onClick={() => makeCall(n)}
                className="px-3 py-1 bg-yellow-500 text-black rounded"
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => makeCall("PASS")}
              className="px-3 py-1 bg-gray-600 rounded"
            >
              Pass
            </button>
          </div>
        </div>
      )}

      {/* TRUMP PHASE */}
      {phase === "TRUMP" && (
  <div className="bg-black/40 p-4 rounded-xl">
    <h2 className="font-bold mb-2">Choose Trump</h2>

    {["hearts", "diamonds", "clubs", "spades"].map((suit) => (
      <button
        key={suit}
        onClick={() =>
          socket.emit("declare_trump", {
            playerId: socket.id, // later map properly
            suit,
          })
        }
        className="px-3 py-2 bg-yellow-500 text-black rounded mr-2"
      >
        {suit}
      </button>
    ))}
  </div>
)}

{/* PARTNER CARDS */}
{phase === "PLAYING" && partnerCards.length > 0 && (
  <div className="mt-6 bg-black/40 p-4 rounded-xl">
    <h2 className="font-bold mb-2 text-yellow-400">
      Partner Open Cards
    </h2>

    <div className="flex flex-wrap gap-2">
      {partnerCards.map((card, i) => (
        <div
          key={i}
          className="px-3 py-2 bg-white text-black rounded"
        >
          {card.value} {card.suit}
        </div>
      ))}
    </div>
  </div>
)}

    </main>
  );
}
