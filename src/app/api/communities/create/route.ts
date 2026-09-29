import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, displayName, description, isPrivate } = await req.json();

    if (!name || !displayName) {
      return NextResponse.json({ error: "Name and display name are required" }, { status: 400 });
    }

    if (name.length < 3 || name.length > 21) {
      return NextResponse.json({ error: "Name must be 3-21 characters" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      return NextResponse.json({ error: "Name can only contain letters, numbers, and underscores" }, { status: 400 });
    }

    const existing = await prisma.community.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Community name already taken" }, { status: 409 });
    }

    const community = await prisma.community.create({
      data: {
        name,
        displayName,
        description: description || null,
        isPrivate: isPrivate || false,
        creatorId: session.userId,
        members: {
          create: {
            userId: session.userId,
            role: "admin",
          },
        },
      },
      include: {
        creator: { select: { id: true, username: true } },
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch (error) {
    console.error("Create community error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const communities = await prisma.community.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, username: true, avatar: true } },
        _count: { select: { members: true, posts: true } },
      },
      take: 50,
    });

    return NextResponse.json({ communities });
  } catch (error) {
    console.error("Get communities error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
