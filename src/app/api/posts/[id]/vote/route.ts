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

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_postId: { userId: session.userId, postId: id },
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
          postId: id,
        },
      });
    }

    const votes = await prisma.vote.aggregate({
      where: { postId: id },
      _sum: { value: true },
    });

    const totalVotes = votes._sum.value || 0;

    await prisma.post.update({
      where: { id },
      data: {
        upvotes: Math.max(0, totalVotes),
        downvotes: Math.abs(Math.min(0, totalVotes)),
      },
    });

    const postAuthor = await prisma.user.findUnique({ where: { id: post.authorId } });
    if (postAuthor) {
      const allVotes = await prisma.vote.aggregate({
        where: { post: { authorId: post.authorId } },
        _sum: { value: true },
      });
      await prisma.user.update({
        where: { id: post.authorId },
        data: { karma: allVotes._sum.value || 0 },
      });

      if (value === 1 && post.authorId !== session.userId && !existingVote) {
        const voter = await prisma.user.findUnique({ where: { id: session.userId }, select: { username: true } });
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: "upvote",
            title: "Your post was upvoted",
            message: `u/${voter?.username || "someone"} upvoted your post "${post.title}"`,
            link: `/post/${id}`,
          },
        });
      }
    }

    return NextResponse.json({
      vote: newVoteValue,
      score: totalVotes,
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
