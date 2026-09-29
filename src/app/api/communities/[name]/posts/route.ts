import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") || "hot";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 25;
    const skip = (page - 1) * limit;

    const community = await prisma.community.findUnique({ where: { name } });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    let orderBy: Record<string, string>;
    switch (sort) {
      case "new":
        orderBy = { createdAt: "desc" };
        break;
      case "top":
        orderBy = { upvotes: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { communityId: community.id, isRemoved: false },
        orderBy,
        skip,
        take: limit,
        include: {
          author: { select: { id: true, username: true, avatar: true, karma: true } },
          community: { select: { id: true, name: true, displayName: true, icon: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.post.count({ where: { communityId: community.id, isRemoved: false } }),
    ]);

    return NextResponse.json({
      posts,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get community posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
