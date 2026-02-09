"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ================= TYPES ================= */

type Room = {
  id: string;
  room_code: string;
  host_id: string;
  status: string;
};

type RoomMember = {
  id: string;
  user_id: string;
  role: string;
  username: string | null;
};

/* ================= PAGE ================= */

export default function LobbyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");

  const [userId, setUserId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= AUTH ================= */

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUserId(data.user.id);
      setLoading(false);
    };
    loadUser();
  }, [router]);

  /* ================= ROOM ================= */

  useEffect(() => {
    if (!roomId) return;

    supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single()
      .then(({ data }) => setRoom(data ?? null));
  }, [roomId]);

  /* ================= MEMBERS ================= */

  const loadMembers = async () => {
    if (!roomId) return;

    const { data, error } = await supabase
      .from("room_members_view")
      .select("id, user_id, role, username")
      .eq("room_id", roomId);

    if (error) {
      console.error("Failed to load members:", error.message);
      return;
    }

    setMembers(data ?? []);
  };

  useEffect(() => {
    if (!roomId) return;

    loadMembers();

    const channel = supabase
      .channel(`room-members-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        loadMembers
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  /* ================= ACTIONS ================= */

  const createRoom = async () => {
    if (!userId) return;

    const code = Math.random().toString(36).slice(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        room_code: code,
        host_id: userId,
        status: "waiting",
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from("room_members").insert({
      room_id: data.id,
      user_id: userId,
      role: "host",
    });

    router.push(`/lobby?room=${data.id}`);
  };

  const joinRoomByCode = async () => {
    if (!roomCode.trim()) {
      alert("Enter room code");
      return;
    }

    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_code", roomCode.trim().toUpperCase())
      .single();

    if (!data) {
      alert("Room not found");
      return;
    }

    await supabase.from("room_members").insert({
      room_id: data.id,
      user_id: userId,
      role: "player",
    });

    router.push(`/lobby?room=${data.id}`);
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading lobby...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 to-black text-white px-6 py-10">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">Lobby</h1>

      {room && (
        <div className="bg-black/60 p-4 rounded-xl mb-6 max-w-md">
          <h2 className="font-semibold text-lg mb-2">
            Room Code:{" "}
            <span className="text-yellow-400">{room.room_code}</span>
          </h2>

          <p className="text-sm mb-3">
            Players ({members.length}/4)
          </p>

          <div className="space-y-2 mb-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex justify-between bg-black/40 px-3 py-2 rounded"
              >
                <span>{m.username ?? "Player"}</span>

                {m.role === "host" && (
                  <span className="text-xs bg-yellow-400 text-black px-2 rounded">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            {members.length < 4
              ? "Waiting for players to join…"
              : "Room is full"}
          </p>

          {userId === room.host_id && (
            <button
              disabled={members.length !== 4}
              className="w-full mt-3 py-2 bg-green-500 text-black font-bold rounded disabled:opacity-50"
            >
              Start Game
            </button>
          )}
        </div>
      )}

      <div className="bg-black/50 p-4 rounded-xl max-w-md mb-4">
        <button
          onClick={createRoom}
          className="w-full py-2 bg-green-500 text-black font-bold rounded"
        >
          Create New Room
        </button>
      </div>

      <div className="bg-black/50 p-4 rounded-xl max-w-md">
        <input
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="ROOM CODE"
          className="w-full mb-3 px-3 py-2 rounded text-black"
        />
        <button
          onClick={joinRoomByCode}
          className="w-full py-2 bg-blue-500 text-black font-bold rounded"
        >
          Join Room
        </button>
      </div>
    </main>
  );
}
