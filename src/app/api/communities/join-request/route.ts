import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { communityName, message } = await req.json();

    const community = await prisma.community.findUnique({ where: { name: communityName } });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (community.joinPolicy === "public") {
      // Auto-join for public communities
      const existing = await prisma.communityMember.findUnique({
        where: { userId_communityId: { userId: session.userId, communityId: community.id } },
      });
      if (existing) {
        return NextResponse.json({ joined: true });
      }
      await prisma.communityMember.create({
        data: { userId: session.userId, communityId: community.id, role: "member" },
      });
      return NextResponse.json({ joined: true });
    }

    if (community.joinPolicy === "invite_only") {
      return NextResponse.json({ error: "This community is invite-only. You need an invite code." }, { status: 403 });
    }

    // request policy - create a join request
    const existingRequest = await prisma.joinRequest.findUnique({
      where: { userId_communityId: { userId: session.userId, communityId: community.id } },
    });

    if (existingRequest) {
      return NextResponse.json({ error: "You already have a pending request" }, { status: 400 });
    }

    await prisma.joinRequest.create({
      data: {
        userId: session.userId,
        communityId: community.id,
        message: message || null,
      },
    });

    return NextResponse.json({ requested: true });
  } catch (error) {
    console.error("Join request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const communityName = searchParams.get("community");

    const community = await prisma.community.findUnique({ where: { name: communityName || "" } });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const requests = await prisma.joinRequest.findMany({
      where: { communityId: community.id, status: "pending" },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true, karma: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Get join requests error:", error);
    return NextResponse.json({ requests: [] });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, action } = await req.json();

    const joinRequest = await prisma.joinRequest.findUnique({ where: { id: requestId } });
    if (!joinRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const community = await prisma.community.findUnique({ where: { id: joinRequest.communityId } });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (community.creatorId !== session.userId && session.role !== "admin") {
      return NextResponse.json({ error: "Only the creator can manage join requests" }, { status: 403 });
    }

    if (action === "approve") {
      await prisma.joinRequest.update({ where: { id: requestId }, data: { status: "approved" } });
      await prisma.communityMember.create({
        data: { userId: joinRequest.userId, communityId: community.id, role: "member" },
      });
      return NextResponse.json({ approved: true });
    }

    if (action === "reject") {
      await prisma.joinRequest.update({ where: { id: requestId }, data: { status: "rejected" } });
      return NextResponse.json({ rejected: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Manage join request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
