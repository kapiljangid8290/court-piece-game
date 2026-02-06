import { NextResponse } from "next/server";
import { startGame } from "@/server/game/startGame";

export async function POST(req) {
  const { roomId, players } = await req.json();

  await startGame({ roomId, players });

  return NextResponse.json({ ok: true });
}
