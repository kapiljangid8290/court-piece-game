"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [roomCode, setRoomCode] = useState("");

  // 🔐 Load logged-in user + profile
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.push("/onboarding");
        return;
      }

      setProfile(profile);
    };

    loadUser();
  }, [router]);

  // 🎮 Create Room
  const createRoom = async () => {
    if (!user) return;

    const code = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();

    const { data: room, error } = await supabase
      .from("rooms")
      .insert({
        room_code: code,
        host_id: user.id,
      })
      .select()
      .single();

    if (error) {
      alert("Failed to create room");
      return;
    }

    await supabase.from("room_members").insert({
      room_id: room.id,
      user_id: user.id,
      role: "host",
    });

    router.push(`/room/${room.id}`);
  };

  // 🔑 Join Room
  const joinRoom = async () => {
    if (!user || !roomCode.trim()) {
      alert("Enter room code");
      return;
    }

    const { data: room } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_code", roomCode.toUpperCase())
      .single();

    if (!room) {
      alert("Invalid room code");
      return;
    }

    await supabase.from("room_members").insert({
      room_id: room.id,
      user_id: user.id,
    });

    router.push(`/room/${room.id}`);
  };

  // ⏳ Loading state
  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white bg-black">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center text-white">
      <div className="w-full max-w-md bg-black/70 rounded-2xl shadow-2xl p-6">

        {/* TITLE */}
        <h1 className="text-3xl font-bold text-center text-yellow-400 mb-2">
          Khuli Chokadi
        </h1>
        <p className="text-center text-sm text-gray-300 mb-6">
          Play with friends • Bid • Trump • Win
        </p>

        {/* PROFILE CARD */}
        <div className="bg-white/10 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-gray-300">Logged in as</p>
          <p className="text-lg font-bold text-yellow-400">
            {profile.username}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="space-y-4">

          {/* CREATE ROOM */}
          <button
            onClick={createRoom}
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
              onClick={joinRoom}
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
