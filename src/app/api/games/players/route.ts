import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameSlug } = await req.json();

    if (!gameSlug) {
      return NextResponse.json({ error: "Game slug required" }, { status: 400 });
    }

    const existing = await prisma.gamePlayer.findUnique({
      where: { userId_gameSlug: { userId: session.userId, gameSlug } },
    });

    if (existing) {
      await prisma.gamePlayer.update({
        where: { id: existing.id },
        data: { lastPlayed: new Date() },
      });
      return NextResponse.json({ joined: true, isNew: false });
    }

    await prisma.gamePlayer.create({
      data: {
        userId: session.userId,
        gameSlug,
      },
    });

    return NextResponse.json({ joined: true, isNew: true });
  } catch (error) {
    console.error("Game join error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameSlug = searchParams.get("game");

    if (!gameSlug) {
      return NextResponse.json({ players: 0 });
    }

    const count = await prisma.gamePlayer.count({
      where: { gameSlug },
    });

    const activeCount = await prisma.gamePlayer.count({
      where: {
        gameSlug,
        lastPlayed: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({ totalJoined: count, activeToday: activeCount });
  } catch (error) {
    console.error("Game count error:", error);
    return NextResponse.json({ totalJoined: 0, activeToday: 0 });
  }
}
