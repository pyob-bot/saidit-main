import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import { screenContent, incrementTrust } from "@/lib/screening";
import { botEnforce } from "@/lib/bot";
import { canUserPost } from "@/lib/karma";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, body, url, imageUrl, type, communityName } = await req.json();

    if (!title || !communityName) {
      return NextResponse.json({ error: "Title and community are required" }, { status: 400 });
    }

    if (title.length > 300) {
      return NextResponse.json({ error: "Title must be under 300 characters" }, { status: 400 });
    }

    const community = await prisma.community.findUnique({
      where: { name: communityName },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: { userId: session.userId, communityId: community.id },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "You must join this community first" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (user?.isBanned) {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    const karmaCheck = await canUserPost(session.userId);
    if (!karmaCheck.allowed) {
      return NextResponse.json({ error: karmaCheck.reason }, { status: 403 });
    }

    const post = await prisma.post.create({
      data: {
        title,
        body: body || null,
        url: url || null,
        imageUrl: imageUrl || null,
        type: type || "text",
        authorId: session.userId,
        communityId: community.id,
      },
      include: {
        author: { select: { id: true, username: true, avatar: true, karma: true } },
        community: { select: { id: true, name: true, displayName: true } },
      },
    });

    const screeningText = `${title} ${body || ""}`;
    const screening = await screenContent(session.userId, "post", post.id, screeningText);

    if (screening.action === "removed") {
      await prisma.post.update({ where: { id: post.id }, data: { isRemoved: true } });
      return NextResponse.json({
        post: { ...post, isRemoved: true },
        screening: { action: "removed", reason: screening.reason },
      }, { status: 201 });
    }

    if (screening.action === "delayed") {
      await prisma.post.update({ where: { id: post.id }, data: { isRemoved: true } });
      return NextResponse.json({
        post: { ...post, isRemoved: true },
        screening: {
          action: "delayed",
          reason: screening.reason,
          delayMinutes: screening.delayMinutes,
        },
      }, { status: 201 });
    }

    const botResult = await botEnforce("post", post.id, session.userId, body || "", title);
    if (!botResult.safe) {
      return NextResponse.json({
        post: { ...post, isRemoved: true },
        bot: { action: "deleted", reason: botResult.reason, category: botResult.category },
      }, { status: 201 });
    }

    await incrementTrust(session.userId, 1);

    return NextResponse.json({
      post,
      screening: { action: "approved" },
      bot: { action: "approved" },
    }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const communityName = searchParams.get("community");
    const sort = searchParams.get("sort") || "hot";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 25;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isRemoved: false };
    if (communityName) {
      const community = await prisma.community.findUnique({ where: { name: communityName } });
      if (community) {
        where.communityId = community.id;
      }
    }

    where.createdAt = { lte: new Date() };

    let orderBy: Record<string, string>;
    switch (sort) {
      case "new":
        orderBy = { createdAt: "desc" };
        break;
      case "top":
        orderBy = { upvotes: "desc" };
        break;
      case "controversial":
        orderBy = { commentCount: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: { select: { id: true, username: true, avatar: true, karma: true } },
          community: { select: { id: true, name: true, displayName: true, icon: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
