import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

const DEFAULT_SETTINGS = {
  notifReplies: true,
  notifMentions: true,
  notifUpvotes: false,
  notifMessages: true,
  notifCommunity: false,
  notifGames: true,
  themeMode: "light",
  accentColor: "#ff4500",
  compactMode: false,
  showThumbnails: true,
  autoplayMedia: true,
  showOnlineStatus: true,
  showKarma: true,
  showPostHistory: true,
  allowFollowers: true,
  safeBrowsing: false,
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.userId },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: session.userId },
      });
    }

    return NextResponse.json({
      settings: {
        notifReplies: settings.notifReplies,
        notifMentions: settings.notifMentions,
        notifUpvotes: settings.notifUpvotes,
        notifMessages: settings.notifMessages,
        notifCommunity: settings.notifCommunity,
        notifGames: settings.notifGames,
        themeMode: settings.themeMode,
        accentColor: settings.accentColor,
        compactMode: settings.compactMode,
        showThumbnails: settings.showThumbnails,
        autoplayMedia: settings.autoplayMedia,
        showOnlineStatus: settings.showOnlineStatus,
        showKarma: settings.showKarma,
        showPostHistory: settings.showPostHistory,
        allowFollowers: settings.allowFollowers,
        safeBrowsing: settings.safeBrowsing,
      },
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.userId },
      update: body,
      create: { userId: session.userId, ...body },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
