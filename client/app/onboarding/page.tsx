"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const saveUsername = async () => {
  if (!username.trim()) {
    alert("Please choose a username");
    return;
  }

  setLoading(true);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // 🔍 CHECK IF USERNAME EXISTS
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (existing) {
    alert("Username already taken 😕");
    setLoading(false);
    return;
  }

  // ✅ INSERT ONLY IF AVAILABLE
  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    username,
  });

  if (error) {
    alert("Something went wrong");
    setLoading(false);
    return;
  }

  router.push("/dashboard");
};


  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700 text-white px-4">
      <div className="w-full max-w-md bg-black/70 backdrop-blur rounded-2xl shadow-2xl p-8">

        {/* TITLE */}
        <h1 className="text-2xl font-bold text-center text-yellow-400 mb-2">
          Choose Your Name
        </h1>
        <p className="text-center text-sm text-gray-300 mb-6">
          This name will be visible to other players
        </p>

        {/* INPUT */}
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="eg. KapilKing"
          className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-4"
        />

        {/* BUTTON */}
        <button
          onClick={saveUsername}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50"
        >
          {loading ? "Saving..." : "Continue"}
        </button>

        {/* TIP */}
        <p className="text-xs text-center text-gray-400 mt-6">
          Pick something unique & fun 🎯
        </p>
      </div>
    </main>
  );
}
