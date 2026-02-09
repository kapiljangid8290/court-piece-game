"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);



  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/login");
        return;
      }

      setUsername(data.user.email ?? null);
      setLoading(false);
    };
     supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      }
    });

    loadUser();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 to-black text-white px-6 py-10">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-yellow-400">
          Welcome
        </h1>

        <button
          onClick={logout}
          className="px-4 py-2 rounded bg-red-500 text-black font-semibold hover:bg-red-400"
        >
          Logout
        </button>
      </div>

      {/* GAME CARD */}
      <div className="max-w-md bg-black/60 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-2 text-green-400">
          Khuli Chokdi
        </h2>

        <p className="text-sm text-gray-300 mb-4">
          Play the classic Court Piece card game online.
        </p>

        <button
          onClick={() => router.push("/lobby")}
          className="w-full py-3 rounded-xl bg-green-500 text-black font-bold hover:bg-green-400"
        >
          Play Now
        </button>
      </div>
    </main>
  );
}
