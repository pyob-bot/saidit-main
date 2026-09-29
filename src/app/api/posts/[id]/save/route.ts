import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId: session.userId, postId: id } },
    });

    if (existing) {
      await prisma.savedPost.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }

    await prisma.savedPost.create({
      data: {
        userId: session.userId,
        postId: id,
      },
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Save post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
