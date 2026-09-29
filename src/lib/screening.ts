import prisma from "./db";

export interface ScreeningResult {
  allowed: boolean;
  action: "approved" | "delayed" | "removed";
  reason?: string;
  delayMinutes?: number;
  newTrustScore?: number;
}

const DEFAULT_FILTERS = [
  { pattern: "child exploitation|child porn|cp ", type: "keyword", action: "remove", severity: 3, description: "CSAM content" },
  { pattern: "dox|doxx|personal information|home address|phone number", type: "keyword", action: "flag", severity: 2, description: "Potential doxxing" },
  { pattern: "kill yourself|kys|die in a fire", type: "keyword", action: "flag", severity: 2, description: "Encouraging self-harm" },
  { pattern: "https?://[^\\s]*\\.(exe|bat|cmd|scr|pif)", type: "regex", action: "remove", severity: 3, description: "Executable file links" },
];

const TRUST_THRESHOLDS = {
  NEW_USER: 50,
  LOW_TRUST: 30,
  SCREENED: 15,
  MAX_DELAY_MINUTES: 60,
  DELAY_PER_FLAG: 10,
  TRUST_DECAY_FLAGGED: 10,
  TRUST_REGEN_PER_DAY: 2,
  TRUST_REGEN_CAP: 50,
};

export async function screenContent(
  userId: string,
  contentType: "post" | "comment",
  contentId: string,
  text: string
): Promise<ScreeningResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { allowed: false, action: "removed", reason: "User not found" };
  }

  if (user.isBanned) {
    return { allowed: false, action: "removed", reason: "Account suspended" };
  }

  let currentTrust = user.trustScore;

  const daysSinceRegen = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const regenAmount = Math.min(
    daysSinceRegen * TRUST_THRESHOLDS.TRUST_REGEN_PER_DAY,
    TRUST_THRESHOLDS.TRUST_REGEN_CAP - currentTrust
  );
  if (regenAmount > 0) {
    currentTrust = Math.min(currentTrust + regenAmount, TRUST_THRESHOLDS.TRUST_REGEN_CAP);
  }

  const filters = await prisma.contentFilter.findMany({ where: { isActive: true } });
  const allFilters = [...DEFAULT_FILTERS, ...filters.map(f => ({ pattern: f.pattern, type: f.type, action: f.action, severity: f.severity, description: f.description || "" }))];

  for (const filter of allFilters) {
    let matched = false;
    try {
      if (filter.type === "regex") {
        matched = new RegExp(filter.pattern, "i").test(text);
      } else {
        const keywords = filter.pattern.split("|").map(k => k.trim().toLowerCase());
        const lowerText = text.toLowerCase();
        matched = keywords.some(kw => kw.length > 0 && lowerText.includes(kw));
      }
    } catch {
      continue;
    }

    if (matched) {
      if (filter.action === "remove") {
        const newTrust = Math.max(0, currentTrust - TRUST_THRESHOLDS.TRUST_DECAY_FLAGGED * 3);
        await prisma.user.update({
          where: { id: userId },
          data: {
            trustScore: newTrust,
            flaggedCount: { increment: 1 },
          },
        });

        await prisma.screeningLog.create({
          data: {
            contentType,
            contentId,
            action: "removed",
            reason: filter.description || "Matched content filter",
            trustBefore: currentTrust,
            trustAfter: newTrust,
            autoMod: true,
            userId,
          },
        });

        return {
          allowed: false,
          action: "removed",
          reason: filter.description || "Content violates site rules",
          newTrustScore: newTrust,
        };
      }

      if (filter.action === "flag" || filter.action === "delay") {
        const newTrust = Math.max(0, currentTrust - TRUST_THRESHOLDS.TRUST_DECAY_FLAGGED);
        const delayMinutes = user.trustScore <= TRUST_THRESHOLDS.SCREENED
          ? TRUST_THRESHOLDS.MAX_DELAY_MINUTES
          : Math.max(5, TRUST_THRESHOLDS.MAX_DELAY_MINUTES - currentTrust);

        await prisma.user.update({
          where: { id: userId },
          data: {
            trustScore: newTrust,
            flaggedCount: { increment: 1 },
            cooldownUntil: new Date(Date.now() + delayMinutes * 60 * 1000),
          },
        });

        await prisma.screeningLog.create({
          data: {
            contentType,
            contentId,
            action: "delayed",
            reason: filter.description || "Content flagged for review",
            trustBefore: currentTrust,
            trustAfter: newTrust,
            autoMod: true,
            userId,
          },
        });

        return {
          allowed: true,
          action: "delayed",
          reason: filter.description || "Content flagged — will be visible after review period",
          delayMinutes,
          newTrustScore: newTrust,
        };
      }
    }
  }

  if (currentTrust < TRUST_THRESHOLDS.LOW_TRUST) {
    const delayMinutes = Math.max(
      5,
      Math.floor(TRUST_THRESHOLDS.MAX_DELAY_MINUTES * (1 - currentTrust / 100))
    );

    if (user.cooldownUntil && user.cooldownUntil > new Date()) {
      return {
        allowed: true,
        action: "delayed",
        reason: "Account is in cooldown period — content will appear after delay",
        delayMinutes: Math.ceil((user.cooldownUntil.getTime() - Date.now()) / 60000),
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        cooldownUntil: new Date(Date.now() + delayMinutes * 60 * 1000),
      },
    });

    return {
      allowed: true,
      action: "delayed",
      reason: "New/low-trust account — content will be visible after screening period",
      delayMinutes,
    };
  }

  return { allowed: true, action: "approved" };
}

export async function manuallyApproveContent(contentId: string, contentType: "post" | "comment") {
  if (contentType === "post") {
    await prisma.post.update({
      where: { id: contentId },
      data: { isRemoved: false },
    });
  } else {
    await prisma.comment.update({
      where: { id: contentId },
      data: { isRemoved: false },
    });
  }
}

export async function incrementTrust(userId: string, amount: number = 1) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const newTrust = Math.min(100, user.trustScore + amount);
  await prisma.user.update({
    where: { id: userId },
    data: { trustScore: newTrust },
  });
}
