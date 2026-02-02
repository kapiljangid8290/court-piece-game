"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import PlayingCard from "@/components/PlayingCard";
import { incrementStat } from "@/lib/stats";


/* ================= TYPES ================= */

type Card = {
  suit: string;
  value: string;
};

type Phase = "CALLING" | "TRUMP" | "PLAYING";

/* ================= SORT ================= */

const SUIT_ORDER = ["hearts", "diamonds", "clubs", "spades"];
const VALUE_ORDER = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

function sortCards(cards: Card[]) {
  return [...cards].sort((a, b) => {
    const s = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
    if (s !== 0) return s;
    return VALUE_ORDER.indexOf(a.value) - VALUE_ORDER.indexOf(b.value);
  });
}


/* ================= SEAT POSITIONS ================= */
const SEAT_POSITIONS: Record<string, { x: number; y: number }> = {
  player1: { x: 0, y: 120 },    // bottom (you)
  player2: { x: 120, y: 0 },    // right
  player3: { x: 0, y: -120 },   // top
  player4: { x: -120, y: 0 },   // left
};

/* ================= PAGE ================= */

export default function Home() {
const searchParams = new URLSearchParams(window.location.search);
const name = searchParams.get("name");
const room = searchParams.get("room");
  const socketRef = useRef<Socket | null>(null);
const tableCardRefs = useRef<HTMLDivElement[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomInput, setRoomInput] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [phase, setPhase] = useState<Phase>("CALLING");
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);

  const [highestBid, setHighestBid] = useState<number | null>(null);
  const [highestBidder, setHighestBidder] = useState<string | null>(null);
  const [trump, setTrump] = useState<string | null>(null);
  const [lastTrickWinner, setLastTrickWinner] = useState<string | null>(null);

  const [scores, setScores] = useState({
  teamA: 0,
  teamB: 0,
});

const [gameOver, setGameOver] = useState(false);
const [gameResult, setGameResult] = useState<{
  winner: "teamA" | "teamB";
  reason: string;
} | null>(null);


const myTeam =
  playerId === "player1" || playerId === "player3"
    ? "teamA"
    : "teamB";


  const [cards, setCards] = useState<Card[]>([]);
  const [tableCards, setTableCards] = useState<
    { playerId: string; card: Card }[]
  >([]);

  useEffect(() => {
  const nameFromUrl = searchParams.get("name");

  if (nameFromUrl) {
    setPlayerName(nameFromUrl);
  }
}, [searchParams]);


  /* ================= SOCKET ================= */

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.on("room_created", ({ roomId, playerId }) => {
      setRoomId(roomId);
      setPlayerId(playerId);
    });

    socket.on("room_joined", ({ roomId, playerId }) => {
      setRoomId(roomId);
      setPlayerId(playerId);
    });

    socket.on("your_cards", (cards: Card[]) => {
      setCards(cards);
    });

    socket.on("turn_update", setCurrentTurn);
    socket.on("phase_update", setPhase);

    socket.on("bid_update", ({ bid, playerId }) => {
      setHighestBid(bid);
      setHighestBidder(playerId);
    });

    socket.on("trump_set", ({ trump }) => {
      setTrump(trump);
    });

    socket.on("card_played", ({ playerId, card }) => {
      setTableCards((p) => [...p, { playerId, card }]);
    });

    socket.on("play_success", (card: Card) => {
      setCards((prev) =>
        prev.filter(
          (c) => !(c.suit === card.suit && c.value === card.value)
        )
      );
    });

    socket.on("trick_end", ({ winner, tricksWon }) => {
  setScores(tricksWon);
  setLastTrickWinner(winner);

  const target = SEAT_POSITIONS[winner];

  // animate cards
  tableCardRefs.current.forEach((el) => {
    if (!el || !target) return;

    el.style.transform = `translate(${target.x}px, ${target.y}px) scale(0.8)`;
    el.style.opacity = "0";
  });

  // clear after animation
  setTimeout(() => {
    setTableCards([]);
    tableCardRefs.current = [];
    setLastTrickWinner(null);
  }, 600);
});



    socket.on("game_reset", () => {
      setGameStarted(false);
      setPhase("CALLING");
      setCards([]);
      setTableCards([]);
      setHighestBid(null);
      setHighestBidder(null);
      setTrump(null);
      setCurrentTurn(null);
    });

    socket.on("trump_set", (data) => {
  console.log("🟢 TRUMP_SET RECEIVED:", data);
  setTrump(data.trump);
});


socket.on("score_update", (data) => {
  setScores({
    teamA: data.teamA,
    teamB: data.teamB,
  });
});

socket.on("score_update", (newScores) => {
  console.log("📊 SCORE UPDATE:", newScores);
  setScores(newScores);
});

socket.on("game_over", ({ winner, reason }) => {
  console.log("🏁 GAME OVER:", winner, reason);

  if (!playerName) return;

  // everyone played a game
  incrementStat(playerName, "gamesPlayed", 1);

  // winner team only
  if (winner === myTeam) {
    incrementStat(playerName, "gamesWon", 1);
  }
});

socket.on("game_over", ({ winner, reason }) => {
  console.log("🏁 GAME OVER:", winner, reason);

  setGameResult({ winner, reason });
  setGameOver(true);
});


    return () => socket.disconnect();
  }, []);

  /* ================= ACTIONS ================= */

  const startGame = () => {
    socketRef.current?.emit("start_game");
    setGameStarted(true);
  };

  const makeCall = (call: number | "PASS") => {
    socketRef.current?.emit("make_call", {
      playerId,
      call: call === "PASS" ? null : call,
    });
  };

  const declareTrump = (suit: string) => {
    if (phase !== "TRUMP" || playerId !== highestBidder) return;
    socketRef.current?.emit("declare_trump", { playerId, trumpSuit: suit });
  };

  const playCard = (card: Card) => {
    if (phase !== "PLAYING" || currentTurn !== playerId) return;
    socketRef.current?.emit("play_card", { playerId, card });
  };

  const canInteract =
    (phase === "PLAYING" && currentTurn === playerId) ||
    (phase === "TRUMP" && playerId === highestBidder && !trump);

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-green-700 text-white relative overflow-hidden">

      {/* TRUMP BADGE – ALWAYS ON TOP */}
{trump && (
  <div
    className="fixed left-1/2 -translate-x-1/2"
    style={{
      top: "64px",
      zIndex: 9999,        // 🔥 higher than EVERYTHING
      pointerEvents: "none",
    }}
  >
    <div className="bg-black/95 text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 border border-red-500">
      <span className="text-xs uppercase text-gray-300 tracking-wider">
        Trump
      </span>

      <span className="text-lg font-extrabold text-red-400 uppercase">
        {trump}
      </span>

      {/* suit icon (optional but helpful) */}
      <span className="text-xl">
        {trump === "hearts" && "♥"}
        {trump === "diamonds" && "♦"}
        {trump === "clubs" && "♣"}
        {trump === "spades" && "♠"}
      </span>
    </div>
  </div>
)}


      {/* TOP BAR */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black/80 px-6 py-3 flex justify-between text-sm">
      <div className="text-sm">
  Player: <b className="text-yellow-400">{playerName}</b>
</div>
        <div>
          You: <b className="text-yellow-300">{playerId ?? "-"}</b> | Phase:{" "}
          <b className="text-blue-300">{phase}</b>
          {trump && (
            <span className="ml-4">
              Trump: <b className="text-red-400 uppercase">{trump}</b>
            </span>
          )}
        </div>

        <div>
          Turn:{" "}
          <b className={currentTurn === playerId ? "text-green-400" : ""}>
            {currentTurn ?? "Waiting"}
          </b>
        </div>
      </div>

     {/* SCOREBOARD */}
<div className="fixed top-16 right-4 z-40 bg-black/80 rounded-xl px-4 py-3 text-sm w-48 shadow-xl">
  <h3 className="text-center font-bold text-yellow-400 mb-2">
    Scoreboard
  </h3>

  <div className="space-y-2">
    {/* TEAM A */}
    <div className="flex justify-between items-center bg-green-700/40 px-3 py-2 rounded">
      <div>
        <div className="font-semibold">Team A</div>
        <div className="text-xs text-gray-300">Player 1 • Player 3</div>
      </div>
      <div className="text-lg font-bold text-green-400">
        {scores.teamA}
      </div>
    </div>

    {/* TEAM B */}
    <div className="flex justify-between items-center bg-blue-700/40 px-3 py-2 rounded">
      <div>
        <div className="font-semibold">Team B</div>
        <div className="text-xs text-gray-300">Player 2 • Player 4</div>
      </div>
      <div className="text-lg font-bold text-blue-400">
        {scores.teamB}
      </div>
    </div>
  </div>
</div>


      {/* JOIN */}
      {!roomId && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-white text-black p-6 rounded w-80">
            <input
              className="border w-full p-2 mb-2"
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <button
              className="w-full bg-green-600 text-white py-2 rounded mb-2"
              onClick={() =>
                socketRef.current?.emit("create_room", { playerName })
              }
            >
              Create Room
            </button>
            <input
              className="border w-full p-2 mb-2"
              placeholder="Room ID"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
            />
            <button
              className="w-full bg-blue-600 text-white py-2 rounded"
              onClick={() =>
                socketRef.current?.emit("join_room", {
                  roomId: roomInput,
                  playerName,
                })
              }
            >
              Join Room
            </button>
          </div>
        </div>
      )}

      {/* START */}
      {roomId && !gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-40">
          <button
            onClick={startGame}
            className="px-6 py-3 bg-white text-black rounded text-lg"
          >
            Start Game
          </button>
        </div>
      )}

      {/* CALLING */}
      {phase === "CALLING" && gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30">
          <div className="bg-white text-black p-6 rounded w-80 text-center">
            <h2 className="text-xl font-bold mb-2">Calling Phase</h2>
            <p>
              Highest:{" "}
              {highestBid ? `${highestBid} by ${highestBidder}` : "None"}
            </p>

            {currentTurn === playerId ? (
              <>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[7,8,9,10,11,12,13].map((n) => (
                    <button
                      key={n}
                      onClick={() => makeCall(n)}
                      className="bg-green-600 text-white py-2 rounded"
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => makeCall("PASS")}
                  className="mt-4 w-full bg-gray-700 text-white py-2 rounded"
                >
                  Pass
                </button>
              </>
            ) : (
              <p className="mt-4">Waiting for others…</p>
            )}
          </div>
        </div>
      )}

      {/* TRUMP SELECT */}
      {phase === "TRUMP" && playerId === highestBidder && !trump && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded-xl w-80 text-center">
            <h2 className="text-xl font-bold mb-4">Choose Trump</h2>
            <div className="grid grid-cols-2 gap-4">
              {["hearts","diamonds","clubs","spades"].map((s) => (
                <button
                  key={s}
                  onClick={() => declareTrump(s)}
                  className="py-4 rounded-xl bg-green-600 text-white font-bold"
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

{lastTrickWinner && (
  <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
    <div className="bg-black/80 px-6 py-3 rounded-xl text-yellow-400 text-xl font-bold shadow-xl">
      {lastTrickWinner} won the trick
    </div>
  </div>
)}


      {/* TABLE */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-56 h-56 rounded-full border-4 border-white/30 relative">
          {tableCards.map(({ playerId, card }, i) => {
  const isWinner = playerId === lastTrickWinner;

  return (
    <div
      key={i}
      ref={(el) => {
        if (el) tableCardRefs.current[i] = el;
      }}
      className={`absolute inset-0 flex items-center justify-center
        transition-all duration-500
        ${isWinner ? "scale-110" : ""}
      `}
    >
      <div
        className={`rounded-xl transition-all duration-300
          ${isWinner ? "ring-4 ring-yellow-400 shadow-[0_0_30px_gold]" : ""}
        `}
      >
        <PlayingCard card={card} enabled={false} />
      </div>
    </div>
  );
})}


        </div>
      </div>

      {/* HAND */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="flex gap-2 bg-black/30 px-3 py-2 rounded-xl">
          {sortCards(cards).map((card) => (
            <PlayingCard
              key={`${card.suit}-${card.value}`}
              card={card}
              enabled={canInteract}
              onClick={() => playCard(card)}
            />
          ))}
        </div>
      </div>

      {gameOver && gameResult && (
  <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
    <div className="bg-white text-black rounded-2xl p-8 w-[360px] shadow-2xl text-center">

      {/* TITLE */}
      <h1 className="text-2xl font-extrabold mb-2">
        {(
          (gameResult.winner === "teamA" && ["player1","player3"].includes(playerId ?? "")) ||
          (gameResult.winner === "teamB" && ["player2","player4"].includes(playerId ?? ""))
        )
          ? "🏆 YOU WON!"
          : "😞 YOU LOST"}
      </h1>

      {/* WINNER INFO */}
      <p className="text-sm text-gray-600 mb-4">
        Winning Team:{" "}
        <span className="font-bold uppercase">
          {gameResult.winner}
        </span>
      </p>

      {/* REASON */}
      <div className="bg-gray-100 rounded-lg px-4 py-2 mb-4 text-sm">
        Reason: <b>{gameResult.reason}</b>
      </div>

      {/* FINAL SCORE */}
      <div className="border rounded-lg p-3 mb-4">
        <h3 className="font-semibold mb-2">Final Score</h3>

        <div className="flex justify-between text-sm">
          <span>Team A</span>
          <span className="font-bold">{scores.teamA}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Team B</span>
          <span className="font-bold">{scores.teamB}</span>
        </div>
      </div>

      {/* PLAYER INFO */}
      <p className="text-xs text-gray-500 mb-4">
        You are <b>{playerId}</b> —{" "}
        <b>
          {["player1","player3"].includes(playerId ?? "")
            ? "Team A"
            : "Team B"}
        </b>
      </p>

      {/* ACTIONS */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setGameOver(false);
            setGameResult(null);
            socketRef.current?.emit("start_game");
          }}
          className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold"
        >
          🔄 Play Again
        </button>

        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-gray-800 text-white py-2 rounded-lg font-semibold"
        >
          🏠 Exit
        </button>
      </div>

    </div>
  </div>
)}

    </main>
  );
}
// new branch push
//hello