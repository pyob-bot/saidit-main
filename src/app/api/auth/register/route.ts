import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { createToken } from "@/lib/auth";
import { checkUsername } from "@/lib/bot";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, inviteCode } = await req.json();

    if (!username || !email || !password || !inviteCode) {
      return NextResponse.json({ error: "Username, email, password, and invite code are required" }, { status: 400 });
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: "Username must be 3-20 characters" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores" }, { status: 400 });
    }

    const usernameCheck = await checkUsername(username);
    if (!usernameCheck.safe) {
      return NextResponse.json({ error: "Username contains inappropriate content" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username or email already taken" }, { status: 409 });
    }

    let invitedBy: string | undefined;
    const invite = await prisma.invite.findUnique({ where: { code: inviteCode } });
    if (!invite || invite.isUsed) {
      return NextResponse.json({ error: "Invalid or already used invite code" }, { status: 400 });
    }
    invitedBy = invite.inviterId;
    await prisma.invite.update({
        where: { id: invite.id },
        data: { isUsed: true, usedAt: new Date(), inviteeId: undefined },
      });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        invitedBy,
        role: "user",
      },
    });

    const token = createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        karma: user.karma,
      },
    });

    response.cookies.set("saidit_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
