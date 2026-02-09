import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-green-900 via-green-800 to-black text-white">
      
      {/* HEADER */}
      <header className="w-full px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-extrabold tracking-wide text-yellow-400">
          Khuli Chokdi
        </h1>

        <Link
          href="/login"
          className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition"
        >
          Login
        </Link>
      </header>

      {/* HERO */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
          Play Khuli Chokdi Online
        </h2>

        <p className="max-w-xl text-gray-200 mb-8">
          A strategic multiplayer Court Piece card game.  
          Play with friends, practice with bots, and test your skills.
        </p>

        <Link
          href="/login"
          className="px-8 py-4 rounded-xl bg-green-500 text-black text-lg font-bold hover:bg-green-400 transition"
        >
          ▶ Play Now
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="w-full text-center text-xs text-gray-400 py-4">
        © {new Date().getFullYear()} Khuli Chokdi · All rights reserved
      </footer>
    </main>
  );
}
