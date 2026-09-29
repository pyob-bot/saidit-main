import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    const deleted = await prisma.savedPost.deleteMany({
      where: {
        id: { in: ids },
        userId: session.userId,
      },
    });

    return NextResponse.json({ deleted: deleted.count });
  } catch (error) {
    console.error("Delete saved posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
