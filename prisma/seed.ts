import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@saidit.local",
      password: adminPassword,
      displayName: "Admin",
      role: "admin",
      trustScore: 100,
    },
  });
  console.log(`Admin user created: ${admin.username}`);

  const demoPassword = await bcrypt.hash("demo123", 12);
  const demo = await prisma.user.upsert({
    where: { username: "demo" },
    update: {},
    create: {
      username: "demo",
      email: "demo@saidit.local",
      password: demoPassword,
      displayName: "Demo User",
      role: "user",
      trustScore: 50,
    },
  });
  console.log(`Demo user created: ${demo.username}`);

  const general = await prisma.community.upsert({
    where: { name: "general" },
    update: {},
    create: {
      name: "general",
      displayName: "General Discussion",
      description: "The default community for all Saidit users. Talk about anything.",
      creatorId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: "admin" },
          { userId: demo.id, role: "member" },
        ],
      },
      rules: {
        create: [
          { title: "Be respectful", description: "Treat others with respect. No personal attacks.", order: 1 },
          { title: "No spam", description: "Self-promotion is allowed in moderation.", order: 2 },
          { title: "Follow the law", description: "No illegal content of any kind.", order: 3 },
        ],
      },
    },
  });
  console.log(`Community created: ${general.name}`);

  const tech = await prisma.community.upsert({
    where: { name: "technology" },
    update: {},
    create: {
      name: "technology",
      displayName: "Technology",
      description: "News and discussion about technology, programming, and the internet.",
      creatorId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: "admin" },
          { userId: demo.id, role: "member" },
        ],
      },
    },
  });
  console.log(`Community created: ${tech.name}`);

  const gaming = await prisma.community.upsert({
    where: { name: "gaming" },
    update: {},
    create: {
      name: "gaming",
      displayName: "Gaming",
      description: "Video games, board games, tabletop RPGs, and more.",
      creatorId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: "admin" },
          { userId: demo.id, role: "member" },
        ],
      },
    },
  });
  console.log(`Community created: ${gaming.name}`);

  await prisma.contentFilter.createMany({
    data: [
      { pattern: "child exploitation|child porn|cp ", type: "keyword", action: "remove", severity: 3, description: "CSAM content" },
      { pattern: "dox|doxx|personal information|home address", type: "keyword", action: "flag", severity: 2, description: "Potential doxxing" },
      { pattern: "kill yourself|kys|die in a fire", type: "keyword", action: "flag", severity: 2, description: "Encouraging self-harm" },
      { pattern: "https?://[^\\s]*\\.(exe|bat|cmd|scr|pif)", type: "regex", action: "remove", severity: 3, description: "Executable file links" },
    ],
  });
  console.log("Default content filters created");

  const invite = await prisma.invite.create({
    data: {
      code: "WELCOME1",
      inviterId: admin.id,
    },
  });
  console.log(`Welcome invite created: ${invite.code}`);

  console.log("\n--- Test Credentials ---");
  console.log("Admin: admin / admin123");
  console.log("Demo:  demo / demo123");
  console.log("Invite Code: WELCOME1");
  console.log("------------------------\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
