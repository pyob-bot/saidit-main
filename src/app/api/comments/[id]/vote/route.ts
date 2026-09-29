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
    const { value } = await req.json();

    if (value !== 1 && value !== -1) {
      return NextResponse.json({ error: "Vote value must be 1 or -1" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_commentId: { userId: session.userId, commentId: id },
      },
    });

    let newVoteValue = value;

    if (existingVote) {
      if (existingVote.value === value) {
        await prisma.vote.delete({ where: { id: existingVote.id } });
        newVoteValue = 0;
      } else {
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { value },
        });
      }
    } else {
      await prisma.vote.create({
        data: {
          value,
          userId: session.userId,
          commentId: id,
        },
      });
    }

    const votes = await prisma.vote.aggregate({
      where: { commentId: id },
      _sum: { value: true },
    });

    const totalVotes = votes._sum.value || 0;

    await prisma.comment.update({
      where: { id },
      data: {
        upvotes: Math.max(0, totalVotes),
        downvotes: Math.abs(Math.min(0, totalVotes)),
      },
    });

    return NextResponse.json({
      vote: newVoteValue,
      score: totalVotes,
    });
  } catch (error) {
    console.error("Comment vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
