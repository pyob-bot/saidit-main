import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all";

    if (!q.trim()) {
      return NextResponse.json({ posts: [], communities: [], users: [] });
    }

    const searchTerm = q.trim();

    let posts: unknown[] = [];
    let communities: unknown[] = [];
    let users: unknown[] = [];

    if (type === "all" || type === "posts") {
      posts = await prisma.post.findMany({
        where: {
          isRemoved: false,
          OR: [
            { title: { contains: searchTerm } },
            { body: { contains: searchTerm } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 25,
        include: {
          author: { select: { id: true, username: true, avatar: true, karma: true } },
          community: { select: { id: true, name: true, displayName: true, icon: true } },
          _count: { select: { comments: true } },
        },
      });
    }

    if (type === "all" || type === "communities") {
      communities = await prisma.community.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { displayName: { contains: searchTerm } },
            { description: { contains: searchTerm } },
          ],
        },
        include: {
          creator: { select: { id: true, username: true, avatar: true } },
          _count: { select: { members: true, posts: true } },
        },
        take: 10,
      });
    }

    if (type === "all" || type === "users") {
      users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: searchTerm } },
            { displayName: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          karma: true,
          createdAt: true,
        },
        take: 10,
      });
    }

    return NextResponse.json({ posts, communities, users, query: searchTerm });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ posts: [], communities: [], users: [] });
  }
}
