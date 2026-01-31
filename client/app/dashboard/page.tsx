"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayerStats } from "@/lib/stats";

export default function Dashboard() {
  const router = useRouter();

  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    totalBids: 0,
  });

  // Update stats when playerName changes
  useEffect(() => {
  if (!playerName.trim()) return;

  const s = getPlayerStats(playerName);
  setStats(s);
}, [playerName]);


  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center text-white">

        {/* PLAYER STATS */}
{playerName && (
  <div className="bg-white/10 rounded-xl p-4 mb-6">
    <h3 className="text-sm text-yellow-400 font-bold mb-3">
      Your Stats
    </h3>

    <div className="grid grid-cols-3 gap-3 text-center">
      <div className="bg-black/40 rounded-lg p-3">
        <div className="text-xl font-bold">{stats.gamesPlayed}</div>
        <div className="text-xs text-gray-300">Games</div>
      </div>

      <div className="bg-black/40 rounded-lg p-3">
        <div className="text-xl font-bold text-green-400">
          {stats.gamesWon}
        </div>
        <div className="text-xs text-gray-300">Wins</div>
      </div>

      <div className="bg-black/40 rounded-lg p-3">
        <div className="text-xl font-bold text-blue-400">
          {stats.totalBids}
        </div>
        <div className="text-xs text-gray-300">Bids</div>
      </div>
    </div>
  </div>
)}

      <div className="w-full max-w-md bg-black/70 rounded-2xl shadow-2xl p-6">

        {/* TITLE */}
        <h1 className="text-3xl font-bold text-center text-yellow-400 mb-2">
          Khuli Chokadi
        </h1>
        <p className="text-center text-sm text-gray-300 mb-6">
          Play with friends • Bid • Trump • Win
        </p>

        {/* PROFILE CARD */}
        <div className="bg-white/10 rounded-xl p-4 mb-6">
          <label className="block text-sm mb-1 text-gray-300">
            Your Name
          </label>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-3 py-2 rounded bg-black/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* ACTIONS */}
        <div className="space-y-4">

          {/* CREATE ROOM */}
          <button
            onClick={() => {
              if (!playerName.trim()) {
                alert("Enter your name");
                return;
              }
              router.push(`/?name=${encodeURIComponent(playerName)}`);
            }}
            className="w-full py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition"
          >
            🎮 Create Room
          </button>

          {/* JOIN ROOM */}
          <div className="flex gap-2">
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Room Code"
              className="flex-1 px-3 py-2 rounded bg-black/60 border border-white/20 focus:outline-none"
            />
            <button
              onClick={() => {
                if (!playerName.trim() || !roomCode.trim()) {
                  alert("Enter name & room code");
                  return;
                }
                router.push(
                  `/?name=${encodeURIComponent(playerName)}&room=${roomCode}`
                );
              }}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 transition"
            >
              Join
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <p className="text-xs text-center text-gray-400 mt-6">
          Team A: Player 1 & Player 3 • Team B: Player 2 & Player 4
        </p>
      </div>
    </main>
  );
}
