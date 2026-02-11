"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Room = {
  id: string;
  room_code: string;
  host_id: string;
  status: string;
  game_id?: string | null;
};

type RoomMember = {
  id: string;
  user_id: string;
  role: string;
  username: string | null;
};

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
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUserId(data.user.id);
      setLoading(false);
    });
  }, [router]);

  /* ================= LOAD ROOM ================= */

  useEffect(() => {
    if (!roomId) return;

    const loadRoom = async () => {
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (data) {
        setRoom(data);

        // 🔥 If already playing → redirect
        if (data.status === "playing" && data.game_id) {
          router.replace(`/game/${data.game_id}`);
        }
      }
    };

    loadRoom();
  }, [roomId, router]);

  /* ================= LOAD MEMBERS ================= */

  const loadMembers = async () => {
    if (!roomId) return;

    const { data } = await supabase
      .from("room_members_view")
      .select("id, user_id, role, username")
      .eq("room_id", roomId);

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

  /* ================= REALTIME ROOM STATUS ================= */

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-status-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const updated = payload.new as Room;

          if (updated.status === "playing" && updated.game_id) {
            router.replace(`/game/${updated.game_id}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, router]);

  /* ================= CREATE ROOM ================= */

  const createRoom = async () => {
    if (!userId) return;

    const code = Math.random().toString(36).slice(2, 8).toUpperCase();

    const { data: room } = await supabase
      .from("rooms")
      .insert({
        room_code: code,
        host_id: userId,
        status: "waiting",
      })
      .select()
      .single();

    await supabase.from("room_members").insert({
      room_id: room.id,
      user_id: userId,
      role: "host",
    });

    router.push(`/lobby?room=${room.id}`);
  };

  /* ================= JOIN ROOM ================= */

  const joinRoomByCode = async () => {
    if (!roomCode.trim()) return alert("Enter room code");

    const { data: room } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_code", roomCode.trim().toUpperCase())
      .single();

    if (!room) return alert("Room not found");

    await supabase.from("room_members").insert({
      room_id: room.id,
      user_id: userId,
      role: "player",
    });

    router.push(`/lobby?room=${room.id}`);
  };

  /* ================= START GAME ================= */

  const startGame = async () => {
    if (!room || userId !== room.host_id) return;

    const { data: gameId, error } = await supabase.rpc("start_game", {
      p_room_id: room.id,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // 🔥 IMMEDIATE redirect for host
    router.replace(`/game/${gameId}`);
  };

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
          <h2 className="font-semibold mb-2">
            Room Code: <span className="text-yellow-400">{room.room_code}</span>
          </h2>

          <p className="text-sm mb-3">Players ({members.length}/4)</p>

          {members.map((m) => (
            <div
              key={m.id}
              className="flex justify-between bg-black/40 px-3 py-2 rounded mb-1"
            >
              <span>{m.username ?? "Player"}</span>
              {m.role === "host" && (
                <span className="text-xs bg-yellow-400 text-black px-2 rounded">
                  Host
                </span>
              )}
            </div>
          ))}

          {userId === room.host_id && (
            <button
              onClick={startGame}
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
