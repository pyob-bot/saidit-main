import prisma from "./db";

const BOT_NAME = "SaiditBot";

interface ScanResult {
  safe: boolean;
  action: "approve" | "delete" | "flag";
  reason?: string;
  category?: string;
  severity?: number;
}

const PATTERNS = {
  csam: {
    patterns: ["child pornography", "child porn", "cp ", "cp.", "cp,", "pedo", "pedophile", "preteen", "underage sex", "child exploitation", "loli"],
    severity: 3,
    category: "CSAM / Child Exploitation",
    action: "delete" as const,
  },
  terrorism: {
    patterns: ["isis", "al qaeda", "terrorist attack", "bomb making", "build a bomb", "homemade explosive", "pipe bomb", "molotov cocktail", "shoot up", "mass shooting plan"],
    severity: 3,
    category: "Terrorism / Violence",
    action: "delete" as const,
  },
  threats: {
    patterns: ["kill you", "kill yourself", "kys", "die in a fire", "gonna murder", "i will find you", "you're dead", "i know where you live", "i'll hurt you", "threat", "death threat", "kill them all"],
    severity: 2,
    category: "Threats / Incitement",
    action: "delete" as const,
  },
  doxing: {
    patterns: ["home address", "phone number", "social security", "credit card", "full name and address", "real name is", "dox", "doxx", "personal information", "ip address", "location data"],
    severity: 3,
    category: "Doxing / Personal Information",
    action: "delete" as const,
  },
  selfharm: {
    patterns: ["how to suicide", "ways to kill myself", "cutting myself", "want to die", "end my life", "suicide method", "overdose instructions"],
    severity: 2,
    category: "Self-Harm / Suicide",
    action: "delete" as const,
  },
  malware: {
    patterns: [".exe download", "free virus", "keylogger", "hack account", "steal password", "phishing", "ransomware", "malware download", "cracked software"],
    severity: 2,
    category: "Malware / Hacking",
    action: "delete" as const,
  },
  hate: {
    patterns: ["nigger", "faggot", "kike", "spic", "chink", "raghead", "gook", "wetback", "tranny", "kill all [race]", "gas the"],
    severity: 2,
    category: "Hate Speech",
    action: "delete" as const,
  },
  drugs: {
    patterns: ["buy cocaine", "buy heroin", "buy meth", "sell drugs", "drug dealer", "fentanyl sale", "order drugs", "darknet drugs"],
    severity: 2,
    category: "Illegal Drugs",
    action: "delete" as const,
  },
  weapons: {
    patterns: ["buy gun without", "illegal firearm", "ghost gun", "unregistered weapon", "sell rifle", "buy explosives"],
    severity: 2,
    category: "Illegal Weapons",
    action: "delete" as const,
  },
  spam: {
    patterns: ["buy now", "limited offer", "click here", "free money", "make money fast", "work from home guaranteed", "double your investment", "crypto pump", "guaranteed returns"],
    severity: 1,
    category: "Spam / Scams",
    action: "delete" as const,
  },
  nsfw: {
    patterns: ["pornhub", "xvideos", "xhamster", "redtube", "onlyfans free", "nudes leaked", "sex tape", "explicit content"],
    severity: 1,
    category: "NSFW / Adult Content",
    action: "flag" as const,
  },
};

const DANGEROUS_DOMAINS = [
  "bit.ly",
  "tinyurl.com",
  "goo.gl",
  "t.co",
  "is.gd",
  "cutt.ly",
  "shorturl.at",
];

const BLOCKED_DOMAINS = [
  "darkweb",
  "onion",
  "tor2web",
  "pastebin.com",
  "hastebin.com",
];

function containsURL(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+/gi;
  return text.match(urlRegex) || [];
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function scanContent(
  text: string,
  userId: string
): Promise<ScanResult> {
  const lowerText = text.toLowerCase();

  for (const [key, config] of Object.entries(PATTERNS)) {
    for (const pattern of config.patterns) {
      if (lowerText.includes(pattern.toLowerCase())) {
        return {
          safe: false,
          action: config.action,
          reason: `Detected: ${config.category} — matched "${pattern}"`,
          category: config.category,
          severity: config.severity,
        };
      }
    }
  }

  const urls = containsURL(text);
  for (const url of urls) {
    const domain = extractDomain(url);

    for (const blocked of BLOCKED_DOMAINS) {
      if (domain.includes(blocked)) {
        return {
          safe: false,
          action: "delete",
          reason: `Blocked domain: ${domain}`,
          category: "Blocked URL",
          severity: 2,
        };
      }
    }

    for (const suspicious of DANGEROUS_DOMAINS) {
      if (domain.includes(suspicious)) {
        return {
          safe: false,
          action: "flag",
          reason: `Suspicious shortened URL: ${domain} — may lead to dangerous content`,
          category: "Suspicious Link",
          severity: 1,
        };
      }
    }
  }

  if (text.length > 0 && urls.length > 3) {
    return {
      safe: false,
      action: "delete",
      reason: "Excessive link posting (possible spam)",
      category: "Spam",
      severity: 1,
    };
  }

  return { safe: true, action: "approve" };
}

export async function botEnforce(
  contentType: "post" | "comment",
  contentId: string,
  userId: string,
  text: string,
  title?: string
): Promise<ScanResult> {
  const fullText = title ? `${title} ${text}` : text;
  const result = await scanContent(fullText, userId);

  if (!result.safe) {
    if (contentType === "post") {
      await prisma.post.update({
        where: { id: contentId },
        data: { isRemoved: true },
      });
    } else {
      await prisma.comment.update({
        where: { id: contentId },
        data: { isRemoved: true, body: "[removed by SaiditBot]" },
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const newKarma = Math.max(-100, (user?.karma || 0) - 2);

    await prisma.user.update({
      where: { id: userId },
      data: { karma: newKarma },
    });

    await prisma.screeningLog.create({
      data: {
        contentType,
        contentId,
        action: "removed",
        reason: result.reason || "Content violates site rules",
        trustBefore: user?.trustScore || 50,
        trustAfter: Math.max(0, (user?.trustScore || 50) - 10),
        autoMod: true,
        userId,
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "mod_action",
        title: `${contentType === "post" ? "Post" : "Comment"} Removed by SaiditBot`,
        message: `Your ${contentType} was removed.\n\nReason: ${result.reason}\nCategory: ${result.category}\nKarma penalty: -2 (now: ${newKarma})\n\nHow to earn karma back:\n• Post quality content that gets upvoted (+1 per upvote)\n• Login daily when active (+2 per day)\n• Be helpful and contribute positively`,
        link: `/u/${user?.username}`,
      },
    });

    return result;
  }

  return { safe: true, action: "approve" };
}

export async function checkUsername(username: string): Promise<ScanResult> {
  const result = await scanContent(username, "");
  if (!result.safe) {
    return {
      safe: false,
      action: "delete",
      reason: `Username contains inappropriate content: ${result.category}`,
      category: result.category,
    };
  }
  return { safe: true, action: "approve" };
}
