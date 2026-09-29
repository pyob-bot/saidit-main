import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        karma: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const recentPosts = await prisma.post.findMany({
      where: { authorId: user.id, isRemoved: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        author: { select: { id: true, username: true, avatar: true, karma: true } },
        community: { select: { id: true, name: true, displayName: true, icon: true } },
        _count: { select: { comments: true } },
      },
    });

    const recentComments = await prisma.comment.findMany({
      where: { authorId: user.id, isRemoved: false },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        author: { select: { id: true, username: true, avatar: true, karma: true } },
        post: {
          select: {
            id: true,
            title: true,
            community: { select: { id: true, name: true, displayName: true } },
          },
        },
      },
    });

    return NextResponse.json({ user, recentPosts, recentComments });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
