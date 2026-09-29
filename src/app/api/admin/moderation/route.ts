import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const screenings = await prisma.screeningLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, username: true, trustScore: true, flaggedCount: true } },
      },
    });

    const filters = await prisma.contentFilter.findMany({
      orderBy: { createdAt: "desc" },
    });

    const stats = await prisma.screeningLog.groupBy({
      by: ["action"],
      _count: true,
    });

    const lowTrustUsers = await prisma.user.findMany({
      where: { trustScore: { lt: 50 } },
      select: { id: true, username: true, trustScore: true, flaggedCount: true, cooldownUntil: true },
      orderBy: { trustScore: "asc" },
      take: 50,
    });

    return NextResponse.json({
      screenings,
      filters,
      stats,
      lowTrustUsers,
    });
  } catch (error) {
    console.error("Get moderation data error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, targetId, targetType, reason } = await req.json();

    if (action === "approve") {
      if (targetType === "post") {
        await prisma.post.update({ where: { id: targetId }, data: { isRemoved: false } });
      } else if (targetType === "comment") {
        await prisma.comment.update({ where: { id: targetId }, data: { isRemoved: false } });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "remove") {
      if (targetType === "post") {
        await prisma.post.update({ where: { id: targetId }, data: { isRemoved: true } });
      } else if (targetType === "comment") {
        await prisma.comment.update({ where: { id: targetId }, data: { isRemoved: true } });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "adjust_trust") {
      const { trustScore } = await req.json();
      await prisma.user.update({
        where: { id: targetId },
        data: { trustScore: Math.max(0, Math.min(100, trustScore)) },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "add_filter") {
      const { pattern, type, filterAction, severity, description } = await req.json();
      await prisma.contentFilter.create({
        data: {
          pattern,
          type: type || "keyword",
          action: filterAction || "flag",
          severity: severity || 1,
          description: description || null,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "remove_filter") {
      await prisma.contentFilter.delete({ where: { id: targetId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Moderation action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
