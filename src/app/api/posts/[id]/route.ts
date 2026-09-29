import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, avatar: true, karma: true, role: true } },
        community: { select: { id: true, name: true, displayName: true, icon: true } },
        comments: {
          where: { isRemoved: false, parentId: null },
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, username: true, avatar: true, karma: true } },
            replies: {
              where: { isRemoved: false },
              orderBy: { createdAt: "asc" },
              include: {
                author: { select: { id: true, username: true, avatar: true, karma: true } },
                replies: {
                  where: { isRemoved: false },
                  orderBy: { createdAt: "asc" },
                  include: {
                    author: { select: { id: true, username: true, avatar: true, karma: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const session = await getSession();
    let userVote = 0;
    if (session) {
      const vote = await prisma.vote.findUnique({
        where: {
          userId_postId: { userId: session.userId, postId: id },
        },
      });
      userVote = vote?.value || 0;
    }

    return NextResponse.json({ post: { ...post, userVote } });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== session.userId && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.update({
      where: { id },
      data: { isRemoved: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== session.userId && session.role !== "admin") {
      return NextResponse.json({ error: "Only the author can edit this post" }, { status: 403 });
    }

    const { title, body } = await req.json();

    const updateData: Record<string, string> = {};
    if (title !== undefined) {
      if (title.trim().length === 0) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      if (title.length > 300) {
        return NextResponse.json({ error: "Title must be under 300 characters" }, { status: 400 });
      }
      updateData.title = title.trim();
    }
    if (body !== undefined) {
      updateData.body = body.trim() || "";
    }

    const updated = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, username: true, avatar: true, karma: true } },
        community: { select: { id: true, name: true, displayName: true } },
      },
    });

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("Edit post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
