import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    let token = "";

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/saidit_token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        bio: true,
        role: true,
        karma: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Bot auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
