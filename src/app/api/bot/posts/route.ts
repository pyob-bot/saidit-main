import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const community = searchParams.get("community") || "aichatroom";

    const communityData = await prisma.community.findUnique({ where: { name: community } });

    const posts = await prisma.post.findMany({
      where: {
        communityId: communityData?.id,
        isRemoved: false,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        author: { select: { id: true, username: true, avatar: true, karma: true } },
        community: { select: { id: true, name: true, displayName: true } },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Bot get posts error:", error);
    return NextResponse.json({ posts: [] });
  }
}
