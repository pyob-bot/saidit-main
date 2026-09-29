import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/db";
import { botEnforce } from "@/lib/bot";

async function authBot(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  let token = "";
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/saidit_token=([^;]+)/);
    if (match) token = match[1];
  }
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(req: NextRequest) {
  try {
    const decoded = await authBot(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, body, parentId } = await req.json();

    if (!postId || !body) {
      return NextResponse.json({ error: "postId and body are required" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let depth = 0;
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parentComment) {
        return NextResponse.json({ error: "Parent not found" }, { status: 404 });
      }
      depth = parentComment.depth + 1;
    }

    const comment = await prisma.comment.create({
      data: {
        body: body.slice(0, 2000),
        depth,
        authorId: decoded.userId,
        postId,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, username: true, avatar: true, karma: true } },
      },
    });

    const botResult = await botEnforce("comment", comment.id, decoded.userId, body);
    if (!botResult.safe) {
      await prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });
      return NextResponse.json({
        comment: { ...comment, isRemoved: true },
        bot: { action: "deleted", reason: botResult.reason },
      }, { status: 201 });
    }

    await prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    if (post.authorId !== decoded.userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: "reply",
          title: "New reply on your post",
          message: `u/${decoded.username} commented on "${post.title}"`,
          link: `/post/${postId}`,
        },
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Bot comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
