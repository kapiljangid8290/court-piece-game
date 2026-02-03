"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Player = {
  user_id: string;
  username: string;
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

  // 🔐 LOAD USER + PROFILE + ROOM DATA
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

      // Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profile);

      // Room (host)
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

  // 👥 FETCH PLAYERS (RLS SAFE)
  const fetchPlayers = async () => {
   const { data } = await supabase
  .from("room_lobby_players")
  .select("user_id, username")
  .eq("room_id", roomId);

   if (data) {
  setPlayers(
    data.map((p: any) => ({
      user_id: p.user_id,
      username: p.username,
    }))
  );
}
  };

  // 🔄 REALTIME PLAYER UPDATES
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
        () => {
          fetchPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // 🔍 SEARCH USERS
  const searchUsers = async () => {
    if (!search.trim()) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", `%${search}%`);

    setResults(data || []);
  };

  // 📩 INVITE USER
  const inviteUser = async (toUserId: string) => {
    await supabase.from("room_invites").insert({
      room_id: roomId,
      from_user: user.id,
      to_user: toUserId,
    });

    alert("Invite sent!");
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  const isHost = user.id === hostId;
  const canStart = isHost && players.length === 4;

  return (
    <main className="min-h-screen bg-green-900 text-white p-6">
      <div className="max-w-xl mx-auto">

        <h1 className="text-2xl font-bold mb-4 text-yellow-400">
          Room Lobby
        </h1>

        {/* PLAYERS */}
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
              {p.user_id === hostId && (
                <span className="text-yellow-400 text-sm">👑 Host</span>
              )}
            </div>
          ))}

          {players.length < 4 && (
            <p className="text-sm text-gray-300 mt-2">
              Waiting for players…
            </p>
          )}
        </div>

        {/* START GAME (HOST ONLY) */}
        {isHost && (
          <button
            disabled={!canStart}
            className={`w-full py-3 rounded-xl font-bold mb-6 ${
              canStart
                ? "bg-yellow-500 text-black hover:bg-yellow-400"
                : "bg-gray-600 text-gray-300 cursor-not-allowed"
            }`}
          >
            ▶️ Start Game
          </button>
        )}

        {/* INVITE */}
        <div className="bg-black/40 rounded-xl p-4">
          <h2 className="text-lg font-bold mb-3">Invite Player</h2>

          <div className="flex gap-2 mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username"
              className="flex-1 px-3 py-2 rounded bg-black border border-white/20"
            />
            <button
              onClick={searchUsers}
              className="px-4 py-2 bg-yellow-500 text-black rounded"
            >
              Search
            </button>
          </div>

          {results.map((u) => (
            <div
              key={u.id}
              className="flex justify-between items-center bg-black/30 p-2 rounded mb-2"
            >
              <span>{u.username}</span>
              <button
                onClick={() => inviteUser(u.id)}
                className="text-sm bg-blue-600 px-3 py-1 rounded"
              >
                Invite
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
