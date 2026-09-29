import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { v4: uuidv4 } = await import("uuid");
    const code = uuidv4().split("-")[0].toUpperCase();

    const invite = await prisma.invite.create({
      data: {
        code,
        inviterId: session.userId,
      },
    });

    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    console.error("Create invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invites = await prisma.invite.findMany({
      where: { inviterId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Get invites error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
