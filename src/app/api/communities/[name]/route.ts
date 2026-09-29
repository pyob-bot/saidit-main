import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const community = await prisma.community.findUnique({
      where: { name },
      include: {
        creator: { select: { id: true, username: true, avatar: true } },
        moderators: { select: { id: true, username: true, avatar: true } },
        rules: { orderBy: { order: "asc" } },
        _count: { select: { members: true, posts: true } },
      },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const session = await getSession();
    let isMember = false;
    let isMod = false;

    if (session) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: { userId: session.userId, communityId: community.id },
        },
      });
      isMember = !!membership;
      isMod = membership?.role === "mod" || membership?.role === "admin" || community.creatorId === session.userId;
    }

    return NextResponse.json({
      community: { ...community, isMember, isMod },
    });
  } catch (error) {
    console.error("Get community error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
