import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ savedPosts: [] });
    }

    const savedPosts = await prisma.savedPost.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            type: true,
            createdAt: true,
            community: { select: { name: true, displayName: true } },
            author: { select: { username: true } },
          },
        },
      },
    });

    return NextResponse.json({ savedPosts });
  } catch (error) {
    console.error("Get saved posts error:", error);
    return NextResponse.json({ savedPosts: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: "postId required" }, { status: 400 });
    }

    const existing = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId: session.userId, postId } },
    });

    if (existing) {
      await prisma.savedPost.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }

    await prisma.savedPost.create({
      data: { userId: session.userId, postId },
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Save post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    const deleted = await prisma.savedPost.deleteMany({
      where: { id: { in: ids }, userId: session.userId },
    });

    return NextResponse.json({ deleted: deleted.count });
  } catch (error) {
    console.error("Delete saved posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
