"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";

export default function DashboardPage() {
    const router = useRouter();
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* PROFILE */}
      <section className="bg-black/60 rounded-xl p-6 max-w-md">
        <h2 className="text-xl font-bold mb-4">Profile</h2>

        <input
          className="w-full p-2 rounded bg-gray-800 text-white mb-3"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={() => setSavedName(name)}
          className="bg-green-600 px-4 py-2 rounded"
        >
          Save Profile
        </button>

        {savedName && (
          <p className="mt-3 text-green-400">
            Saved as: {savedName}
          </p>
        )}
      </section>

      {/* STATS */}
<section className="grid grid-cols-4 gap-4 max-w-4xl">
  {[
    ["Games Played", 24],
    ["Games Won", 14],
    ["Win Rate", "58%"],
    ["Tricks Won", 312],
  ].map(([label, value]) => (
    <div
      key={label}
      className="bg-black/60 rounded-xl p-4 text-center"
    >
      <div className="text-gray-400 text-sm">{label}</div>
      <div className="text-2xl font-bold text-yellow-400">
        {value}
      </div>
    </div>
  ))}
</section>

{/* GAME ENTRY */}
<section className="flex gap-4 mt-6">
  <button
  onClick={() => router.push("/")}
  className="bg-blue-600 px-6 py-3 rounded-xl text-lg"
>
  Create Room
</button>


  <button
  onClick={() => router.push("/")}
  className="bg-purple-600 px-6 py-3 rounded-xl text-lg"
>
  Join Room
</button>

</section>

    </main>
  );
}
