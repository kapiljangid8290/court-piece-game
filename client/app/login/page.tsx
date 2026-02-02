"use client";

import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700 text-white px-4">
      <div className="w-full max-w-md bg-black/70 backdrop-blur rounded-2xl shadow-2xl p-8">

        {/* LOGO / TITLE */}
        <h1 className="text-3xl font-extrabold text-center text-yellow-400 mb-2">
          Khuli Chokadi
        </h1>
        <p className="text-center text-sm text-gray-300 mb-8">
          Login to play with friends
        </p>

        {/* GOOGLE LOGIN */}
        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition"
        >
          <span className="text-lg">🔐</span>
          Continue with Google
        </button>

        {/* FOOTER */}
        <p className="text-xs text-center text-gray-400 mt-8">
          By continuing, you agree to fair play & fun 😄
        </p>
      </div>
    </main>
  );
}
