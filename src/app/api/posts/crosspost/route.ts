import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, communityNames } = await req.json();

    if (!postId || !communityNames || !Array.isArray(communityNames) || communityNames.length === 0) {
      return NextResponse.json({ error: "postId and communityNames required" }, { status: 400 });
    }

    const originalPost = await prisma.post.findUnique({ where: { id: postId } });
    if (!originalPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const results = [];

    for (const communityName of communityNames) {
      const community = await prisma.community.findUnique({ where: { name: communityName } });
      if (!community) {
        results.push({ community: communityName, error: "Community not found" });
        continue;
      }

      const membership = await prisma.communityMember.findUnique({
        where: { userId_communityId: { userId: session.userId, communityId: community.id } },
      });

      if (!membership) {
        results.push({ community: communityName, error: "Not a member" });
        continue;
      }

      const crossPost = await prisma.post.create({
        data: {
          title: originalPost.title,
          body: originalPost.body,
          url: originalPost.url,
          imageUrl: originalPost.imageUrl,
          type: originalPost.type,
          authorId: session.userId,
          communityId: community.id,
          isCrossPost: true,
          originalPostId: originalPost.id,
        },
        include: {
          community: { select: { name: true, displayName: true } },
        },
      });

      results.push({ community: communityName, success: true, postId: crossPost.id });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Cross-post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
