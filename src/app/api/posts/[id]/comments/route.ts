import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import { screenContent, incrementTrust } from "@/lib/screening";
import { botEnforce } from "@/lib/bot";
import { canUserPost } from "@/lib/karma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (user?.isBanned) {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    const karmaCheck = await canUserPost(session.userId);
    if (!karmaCheck.allowed) {
      return NextResponse.json({ error: karmaCheck.reason }, { status: 403 });
    }

    if (user?.cooldownUntil && user.cooldownUntil > new Date()) {
      const waitMinutes = Math.ceil((user.cooldownUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json({
        error: `Account in cooldown. Please wait ${waitMinutes} minute(s) before commenting.`,
        cooldown: true,
        waitMinutes,
      }, { status: 429 });
    }

    const { id } = await params;
    const { body, parentId } = await req.json();

    if (!body || body.trim().length === 0) {
      return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.isLocked) {
      return NextResponse.json({ error: "Post is locked" }, { status: 403 });
    }

    let depth = 0;
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parentComment) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
      depth = parentComment.depth + 1;
      if (depth > 10) {
        return NextResponse.json({ error: "Maximum nesting depth reached" }, { status: 400 });
      }
    }

    const screening = await screenContent(session.userId, "comment", "temp", body);

    if (screening.action === "removed") {
      const newKarma = Math.max(-100, (user?.karma || 0) - 2);
      await prisma.user.update({ where: { id: session.userId }, data: { karma: newKarma } });
      await prisma.notification.create({
        data: {
          userId: session.userId,
          type: "mod_action",
          title: "Comment Removed by SaiditBot",
          message: `Your comment was removed.\n\nReason: ${screening.reason}\nKarma penalty: -2 (now: ${newKarma})\n\nHow to recover: post quality content, get upvotes, or login daily.`,
        },
      });
      return NextResponse.json({
        botDeleted: true,
        botMessage: "This message has been demolished and wiped to keep the community clean and safe.",
        reason: screening.reason,
      }, { status: 200 });
    }

    if (screening.action === "delayed") {
      return NextResponse.json({
        botDeleted: true,
        botMessage: "This message is under review and will appear after screening.",
        reason: screening.reason,
      }, { status: 200 });
    }

    const comment = await prisma.comment.create({
      data: {
        body,
        depth,
        authorId: session.userId,
        postId: id,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, username: true, avatar: true, karma: true } },
      },
    });

    const botResult = await botEnforce("comment", comment.id, session.userId, body);
    if (!botResult.safe) {
      await prisma.post.update({ where: { id }, data: { commentCount: { increment: 1 } } });
      const newKarma = Math.max(-100, (user?.karma || 0) - 2);
      await prisma.notification.create({
        data: {
          userId: session.userId,
          type: "mod_action",
          title: "Comment Removed by SaiditBot",
          message: `Your comment was removed.\n\nReason: ${botResult.reason}\nKarma penalty: -2 (now: ${newKarma})\n\nHow to recover: post quality content, get upvotes, or login daily.`,
        },
      });
      return NextResponse.json({
        botDeleted: true,
        botMessage: "This message has been demolished and wiped to keep the community clean and safe.",
        reason: botResult.reason,
      }, { status: 200 });
    }

    await prisma.post.update({
      where: { id },
      data: { commentCount: { increment: 1 } },
    });

    if (post.authorId !== session.userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: "reply",
          title: "New reply on your post",
          message: `u/${session.username} commented on "${post.title}"`,
          link: `/post/${id}`,
        },
      });
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
      if (parentComment && parentComment.authorId !== session.userId) {
        await prisma.notification.create({
          data: {
            userId: parentComment.authorId,
            type: "reply",
            title: "Reply to your comment",
            message: `u/${session.username} replied to your comment`,
            link: `/post/${id}`,
          },
        });
      }
    }

    await incrementTrust(session.userId, 1);

    return NextResponse.json({
      comment,
      screening: { action: "approved" },
      bot: { action: "approved" },
    }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
