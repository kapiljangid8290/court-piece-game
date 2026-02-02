"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RoomPage({ params }: any) {
  const router = useRouter();
  const roomId = params.roomId;

  // 🧠 STATE
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);

  // 🔐 LOAD USER + PROFILE + ROOM PLAYERS
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

      const { data: members } = await supabase
        .from("room_members")
        .select("profiles(username)")
        .eq("room_id", roomId);

      setPlayers(members || []);
    };

    loadData();
  }, [roomId, router]);

  // 🔍 SEARCH USERS BY USERNAME
  const searchUsers = async () => {
    if (!search.trim()) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", `%${search}%`);

    setResults(data || []);
  };

  // 📩 SEND INVITE
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

  return (
    <main className="min-h-screen bg-green-900 text-white p-6">
      <div className="max-w-xl mx-auto">

        {/* ROOM HEADER */}
        <h1 className="text-2xl font-bold mb-4">Room</h1>

        {/* PLAYER LIST */}
        <div className="bg-black/40 rounded-xl p-4 mb-6">
          <h2 className="text-lg font-bold mb-2">Players</h2>
          {players.map((p, i) => (
            <div key={i} className="text-sm">
              • {p.profiles.username}
            </div>
          ))}
        </div>

        {/* INVITE SECTION */}
        <div className="bg-black/40 rounded-xl p-4">
          <h2 className="text-lg font-bold mb-3">
            Invite Player by Username
          </h2>

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

          {/* SEARCH RESULTS */}
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
