"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/home");
      }
    });
  }, [router]);

  const loginWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/home`,
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

 const loginWithEmail = async () => {
  if (!email || !password) {
    setError("Email and password are required");
    return;
  }

  setLoading(true);
  setError(null);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setError(error.message);
  } else {
    router.replace("/home");
  }

  setLoading(false);
};

const signupWithEmail = async () => {
  if (!email || !password) {
    setError("Email and password are required");
    return;
  }

  if (password.length < 6) {
    setError("Password must be at least 6 characters");
    return;
  }

  setLoading(true);
  setError(null);

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    setError(error.message);
  } else {
    router.replace("/home");
  }

  setLoading(false);
};

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700 text-white px-4">
      <div className="w-full max-w-md bg-black/70 backdrop-blur rounded-2xl shadow-2xl p-8">

        <h1 className="text-3xl font-extrabold text-center text-yellow-400 mb-2">
          Khuli Chokdi
        </h1>
        <p className="text-center text-sm text-gray-300 mb-6">
          Login or create an account to play
        </p>

        {error && (
          <p className="bg-red-500/20 text-red-300 text-sm p-2 rounded mb-4">
            {error}
          </p>
        )}

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded bg-white text-black"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded bg-white text-black"
        />

        <div className="flex gap-3 mb-4">
          <button
            onClick={loginWithEmail}
            disabled={loading}
            className="flex-1 py-2 rounded bg-green-500 text-black font-semibold hover:bg-green-400"
          >
            Login
          </button>

          <button
            onClick={signupWithEmail}
           disabled={loading || !email || !password}
            className="flex-1 py-2 rounded bg-yellow-400 text-black font-semibold disabled:opacity-50"
          >
            Sign Up
          </button>
        </div>

        <div className="relative text-center mb-4">
          <span className="text-xs text-gray-400">OR</span>
        </div>

        <button
          onClick={loginWithGoogle}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200"
        >
          Continue with Google
        </button>

        <p className="text-xs text-center text-gray-400 mt-6">
          By continuing, you agree to fair play & fun 😄
        </p>
      </div>
    </main>
  );
}
