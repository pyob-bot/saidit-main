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
