import prisma from "./db";

const DAILY_LOGIN_KARMA = 2;
const INACTIVITY_THRESHOLD_DAYS = 3;

export async function grantDailyLoginKarma(userId: string): Promise<{ granted: boolean; reason: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      karma: true,
      createdAt: true,
    },
  });

  if (!user) {
    return { granted: false, reason: "User not found" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastPost = await prisma.post.findFirst({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const lastComment = await prisma.comment.findFirst({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const lastActivity = [lastPost?.createdAt, lastComment?.createdAt]
    .filter(Boolean)
    .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0];

  if (!lastActivity) {
    const daysSinceCreation = Math.floor(
      (today.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceCreation > INACTIVITY_THRESHOLD_DAYS) {
      return { granted: false, reason: "No activity in last 3 days — daily karma paused" };
    }
  } else {
    const daysSinceActivity = Math.floor(
      (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity > INACTIVITY_THRESHOLD_DAYS) {
      return { granted: false, reason: "No activity in last 3 days — daily karma paused" };
    }
  }

  const todayStart = new Date(today);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const existingLogin = await prisma.screeningLog.findFirst({
    where: {
      userId,
      action: "approved",
      reason: "daily_login_karma",
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  if (existingLogin) {
    return { granted: false, reason: "Already received daily karma today" };
  }

  const newKarma = user.karma + DAILY_LOGIN_KARMA;
  await prisma.user.update({
    where: { id: userId },
    data: { karma: newKarma },
  });

  await prisma.screeningLog.create({
    data: {
      contentType: "post",
      contentId: "system",
      action: "approved",
      reason: "daily_login_karma",
      trustBefore: user.karma,
      trustAfter: newKarma,
      autoMod: true,
      userId,
    },
  });

  return { granted: true, reason: `+${DAILY_LOGIN_KARMA} karma for daily login` };
}

export async function canUserPost(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { karma: true, isBanned: true },
  });

  if (!user) {
    return { allowed: false, reason: "User not found" };
  }

  if (user.isBanned) {
    return { allowed: false, reason: "Account suspended" };
  }

  if (user.karma < 0) {
    return {
      allowed: false,
      reason: `You need positive karma to post. Your karma: ${user.karma}. Earn karma by posting quality content, getting upvotes, or logging in daily.`,
    };
  }

  return { allowed: true };
}

export async function onContentUpvoted(postAuthorId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: postAuthorId } });
  if (user) {
    await prisma.user.update({
      where: { id: postAuthorId },
      data: { karma: user.karma + 1 },
    });
  }
}

export async function onContentRemoved(userId: string, reason: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    const newKarma = Math.max(-100, user.karma - 2);
    await prisma.user.update({
      where: { id: userId },
      data: { karma: newKarma },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "mod_action",
        title: "Content Removed — Karma Penalty",
        message: `Your content was removed.\n\nReason: ${reason}\nKarma penalty: -2 (now: ${newKarma})\n\nHow to recover karma:\n• Post quality content (+1 per upvote)\n• Login daily (+2 per day when active)\n• Comment helpfully on others' posts`,
      },
    });
  }
}
