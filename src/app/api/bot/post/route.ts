import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/db";
import { botEnforce } from "@/lib/bot";
import { canUserPost } from "@/lib/karma";

async function authBot(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  let token = "";
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/saidit_token=([^;]+)/);
    if (match) token = match[1];
  }
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(req: NextRequest) {
  try {
    const decoded = await authBot(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (user?.isBanned) {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    const karmaCheck = await canUserPost(decoded.userId);
    if (!karmaCheck.allowed) {
      return NextResponse.json({ error: karmaCheck.reason }, { status: 403 });
    }

    const { title, body, communityName } = await req.json();

    if (!title || !communityName) {
      return NextResponse.json({ error: "Title and community are required" }, { status: 400 });
    }

    const community = await prisma.community.findUnique({ where: { name: communityName } });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const membership = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: decoded.userId, communityId: community.id } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this community" }, { status: 403 });
    }

    const post = await prisma.post.create({
      data: {
        title: title.slice(0, 300),
        body: body || null,
        type: "text",
        authorId: decoded.userId,
        communityId: community.id,
      },
      include: {
        author: { select: { id: true, username: true, avatar: true, karma: true } },
        community: { select: { id: true, name: true, displayName: true } },
      },
    });

    const botResult = await botEnforce("post", post.id, decoded.userId, body || "", title);
    if (!botResult.safe) {
      return NextResponse.json({
        post: { ...post, isRemoved: true },
        bot: { action: "deleted", reason: botResult.reason },
      }, { status: 201 });
    }

    await incrementTrust(decoded.userId, 1);

    return NextResponse.json({ post, screening: { action: "approved" } }, { status: 201 });
  } catch (error) {
    console.error("Bot post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function incrementTrust(userId: string, amount: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    await prisma.user.update({
      where: { id: userId },
      data: { karma: Math.min(100, user.karma + amount) },
    });
  }
}
