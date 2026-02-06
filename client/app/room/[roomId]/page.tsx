"use client";

import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Player = {
  user_id: string;
  username: string;
  last_seen: string;
};

export default function RoomPage() {
  const router = useRouter();
  const { roomId } = useParams<{ roomId: string }>();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);

  /* -------------------------------
     LOAD USER, PROFILE, ROOM
  -------------------------------- */
  useEffect(() => {
    const loadData = async () => {
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

      setProfile(profile);

      const { data: room } = await supabase
        .from("rooms")
        .select("host_id")
        .eq("id", roomId)
        .single();

      setHostId(room?.host_id ?? null);

      await fetchPlayers();
    };

    loadData();
  }, [roomId, router]);

  /* -------------------------------
     SOCKET JOIN (IMPORTANT)
  -------------------------------- */
  useEffect(() => {
    if (!user) return;

    socket.connect();

    socket.emit("JOIN_ROOM", {
      roomId,
      userId: user.id,
    });

    return () => {
      socket.disconnect();
    };
  }, [user, roomId]);

  /* -------------------------------
     FETCH PLAYERS
  -------------------------------- */
  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from("room_lobby_players")
      .select("user_id, username, last_seen")
      .eq("room_id", roomId);

    if (error) {
      console.error("FETCH PLAYERS ERROR", error);
      return;
    }

    setPlayers(
      data.map((p: any) => ({
        user_id: p.user_id,
        username: p.username,
        last_seen: p.last_seen,
      }))
    );
  };

  /* -------------------------------
     REALTIME ROOM MEMBERS
  -------------------------------- */
  useEffect(() => {
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
        fetchPlayers
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  /* -------------------------------
     PRESENCE HEARTBEAT
  -------------------------------- */
  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      await supabase
        .from("room_members")
        .update({ last_seen: new Date().toISOString() })
        .eq("room_id", roomId)
        .eq("user_id", user.id);
    };

    updatePresence();
    const interval = setInterval(updatePresence, 10000);
    return () => clearInterval(interval);
  }, [user, roomId]);

  const isOnline = (lastSeen: string) =>
    Date.now() - new Date(lastSeen).getTime() < 20000;

  /* -------------------------------
     SEARCH USERS
  -------------------------------- */
  const searchUsers = async () => {
    if (!search.trim()) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", `%${search}%`);

    setResults(data || []);
  };

  /* -------------------------------
     START GAME (HOST ONLY)
  -------------------------------- */
  const startGame = async () => {
    if (!user) return;

    const res = await fetch("/api/start-game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        players: players.map((p) => p.user_id),
      }),
    });

    if (!res.ok) {
      alert("Failed to start game");
      return;
    }

    const { gameId } = await res.json();
    router.push(`/game/${gameId}`);
  };

  const isHost = user?.id === hostId;
  const canStart = isHost && players.length === 4;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-green-900 text-white p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-yellow-400">
          Room Lobby
        </h1>

        <div className="bg-black/40 rounded-xl p-4 mb-6">
          <h2 className="text-lg font-bold mb-3">
            Players ({players.length}/4)
          </h2>

          {players.map((p) => (
            <div
              key={p.user_id}
              className="flex justify-between items-center bg-black/30 p-2 rounded mb-2"
            >
              <span>{p.username}</span>
              <div className="flex gap-2 items-center">
                {p.user_id === hostId && (
                  <span className="text-yellow-400 text-sm">👑 Host</span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    isOnline(p.last_seen)
                      ? "bg-green-600"
                      : "bg-gray-600"
                  }`}
                >
                  {isOnline(p.last_seen) ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {isHost && (
          <button
            onClick={startGame}
            disabled={!canStart}
            className="w-full py-3 rounded-xl font-bold bg-yellow-500 text-black disabled:bg-gray-600"
          >
            ▶️ Start Game
          </button>
        )}
      </div>
    </main>
  );
}
