"use client";

import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();

  const [cards, setCards] = useState<any[]>([]);
  const [phase, setPhase] = useState<string>("CALLING");
  const [currentTurn, setCurrentTurn] = useState<string>("");
  const [highestCall, setHighestCall] = useState<number | null>(null);
  const [highestCaller, setHighestCaller] = useState<string | null>(null);
  const [trump, setTrump] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);


  useEffect(() => {
  if (!socket.connected) {
    socket.connect();
  }
}, []);


  // 🔹 Load room_id from Supabase using gameId
  useEffect(() => {
    const loadGame = async () => {
      const { data } = await supabase
        .from("games")
        .select("room_id")
        .eq("id", gameId)
        .single();

      if (data) {
        setRoomId(data.room_id);
      }
    };

    if (gameId) {
      loadGame();
    }
  }, [gameId]);

  // 🔹 Join backend room
  useEffect(() => {
  if (!roomId) return;

  if (!socket.connected) {
    socket.connect();
  }

  socket.emit("JOIN_GAME", { roomId });

}, [roomId]);



  // 🔹 Listen to server events
  useEffect(() => {
    // When server assigns player slot
    socket.on("PLAYER_ASSIGNED", ({ playerId }) => {
  setMyPlayerId(playerId);
});

    // Receive cards
    socket.on("your_cards", (cards) => {
      setCards(cards);
    });

    // Phase updates
    socket.on("phase_update", (newPhase) => {
      setPhase(newPhase);
    });

    // Turn updates
    socket.on("turn_update", (playerId) => {
      setCurrentTurn(playerId);
    });

    // Bid updates
    socket.on("bid_update", ({ bid, playerId }) => {
      setHighestCall(bid);
      setHighestCaller(playerId);
    });

    // Trump declared
    socket.on("trump_set", ({ trump }) => {
      setTrump(trump);
    });

    socket.on("play_error", (msg) => {
      alert(msg);
    });
    
    socket.on("trump_phase_started", ({ highestCaller }) => {
  setHighestCaller(highestCaller);
});


    return () => {
      socket.off("PLAYER_ASSIGNED");
      socket.off("your_cards");
      socket.off("phase_update");
      socket.off("turn_update");
      socket.off("bid_update");
      socket.off("trump_set");
      socket.off("play_error");
      socket.off("trump_phase_started");
    };
  }, []);

  // 🔹 Make Call
  const makeCall = (call: number | "PASS") => {
    if (!myPlayerId) return;

    socket.emit("make_call", {
      playerId: myPlayerId,
      call,
    });
  };

  // 🔹 Play Card
  const playCard = (card: any) => {
    if (!myPlayerId) return;

    socket.emit("play_card", {
      playerId: myPlayerId,
      card,
    });
  };

  // 🔹 Declare Trump
  const declareTrump = (suit: string) => {
    if (!myPlayerId) return;

    socket.emit("declare_trump", {
      playerId: myPlayerId,
      trumpSuit: suit,
    });
  };

  

  return (
    <main className="min-h-screen bg-green-900 text-white p-6">
      <h1 className="text-2xl font-bold text-yellow-400 mb-2">
        Game Started
      </h1>

      <p className="text-sm mb-4">Game ID: {gameId}</p>

      {/* Your Player ID */}
      <div className="mb-4 p-3 bg-black/40 rounded-xl">
  <p className="text-sm">
    You are: <span className="text-yellow-400 font-bold">{myPlayerId}</span>
  </p>

  <p className="text-sm">
    Current Turn:{" "}
    <span
      className={`font-bold ${
        currentTurn === myPlayerId ? "text-green-400" : "text-white"
      }`}
    >
      {currentTurn}
    </span>
  </p>

  {currentTurn === myPlayerId && (
    <p className="text-green-400 text-sm font-semibold mt-1">
      👉 It's YOUR turn
    </p>
  )}
</div>

      {/* Cards */}
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

      {/* CALLING PHASE */}
      {phase === "CALLING" && (
        <div className="bg-black/40 p-4 rounded-xl mb-6">
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
     {/* TRUMP PHASE */}
{phase === "TRUMP" && (
  <>
    {/* Highest bidder */}
    {myPlayerId === highestCaller ? (
      <div className="bg-black/40 p-4 rounded-xl mb-6">
        <h2 className="font-bold mb-2">Choose Trump</h2>

        {["hearts", "diamonds", "clubs", "spades"].map((suit) => (
          <button
            key={suit}
            onClick={() => declareTrump(suit)}
            className="px-3 py-2 bg-yellow-500 text-black rounded mr-2"
          >
            {suit}
          </button>
        ))}
      </div>
    ) : (
      /* Other players */
      <div className="bg-black/40 p-4 rounded-xl mb-6">
        <h2 className="font-bold mb-2">Trump Selection</h2>
        <p className="text-yellow-400">
          Waiting for {highestCaller} to choose trump...
        </p>
      </div>
    )}
  </>
)}


      {/* PLAYING PHASE */}
      {phase === "PLAYING" && (
        <div className="bg-black/40 p-4 rounded-xl">
          <h2 className="font-bold mb-2">Playing Phase</h2>
          <p>Trump: {trump}</p>
          <p>Current Turn: {currentTurn}</p>
        </div>
      )}
    </main>
  );
}
