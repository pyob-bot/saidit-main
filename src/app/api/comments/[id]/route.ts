import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

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
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.authorId !== session.userId && session.role !== "admin") {
      return NextResponse.json({ error: "Only the author can edit this comment" }, { status: 403 });
    }

    const { body } = await req.json();
    if (!body || body.trim().length === 0) {
      return NextResponse.json({ error: "Comment body cannot be empty" }, { status: 400 });
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { body: body.trim() },
      include: {
        author: { select: { id: true, username: true, avatar: true, karma: true } },
      },
    });

    return NextResponse.json({ comment: updated });
  } catch (error) {
    console.error("Edit comment error:", error);
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
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.authorId !== session.userId && session.role !== "admin") {
      return NextResponse.json({ error: "Only the author can delete this comment" }, { status: 403 });
    }

    await prisma.comment.update({
      where: { id },
      data: { isRemoved: true, body: "[deleted]" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
