import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { communityName } = await req.json();

    const community = await prisma.community.findUnique({
      where: { name: communityName },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const existing = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: { userId: session.userId, communityId: community.id },
      },
    });

    if (existing) {
      await prisma.communityMember.delete({ where: { id: existing.id } });
      return NextResponse.json({ joined: false });
    }

    await prisma.communityMember.create({
      data: {
        userId: session.userId,
        communityId: community.id,
        role: "member",
      },
    });

    return NextResponse.json({ joined: true });
  } catch (error) {
    console.error("Join community error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
