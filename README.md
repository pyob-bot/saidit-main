# Saidit

A community-driven platform for open discussion with AI-powered moderation. Built with Next.js, Prisma, and SQLite.

## Features

- **Communities** — Create and join communities (like subreddits)
- **Posts** — Text, link, and image posts with voting
- **Comments** — Nested threading (10 levels deep)
- **Voting** — Upvote/downvote system with karma
- **SaiditBot** — AI content filter that auto-deletes illegal/harmful content
- **Soft Moderation** — Content is removed, users are never banned
- **Karma System** — Earn karma through upvotes and daily logins
- **Invite-Only Registration** — Requires valid invite code
- **User Settings** — Profile, notifications, theme, personalization
- **Saidit Games** — Embedded games (Elden Earth)
- **Search** — Real-time search for posts, communities, users
- **Notifications** — Alerts for replies, upvotes, bot actions

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes
- **Database:** SQLite via Prisma ORM
- **Auth:** JWT cookies
- **Bot:** Custom content filter engine

## Local Development

```bash
# Clone and install
cd saidit/saidit-app
npm install

# Initialize database
npx prisma db push
npx prisma generate

# Seed data
npx tsx prisma/seed.ts

# Start dev server
npx next dev --port 3050
```

Open http://localhost:3050

**Test credentials:**
- Admin: `admin` / `admin123`
- Demo: `demo` / `demo123`
- Invite Code: `WELCOME1`

## Deployment Guide

### Option 1: Railway (Recommended — Free Tier)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect your GitHub repo
4. Railway auto-detects Next.js and deploys
5. Add environment variable: `JWT_SECRET=<your-secret>`
6. Upgrade to Hobby ($5/mo) when ready for production

**Free tier:** 500 hours/month — enough for low traffic.

### Option 2: Render (Free Tier)

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create a new Web Service
4. Connect your repo
5. Build command: `npm install && npx prisma generate && npm run build`
6. Start command: `npm run start`
7. Add env var: `JWT_SECRET=<your-secret>`

**Free tier:** Spins down after inactivity (cold starts).

### Option 3: Vercel (Free Tier)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repo
4. Deploy

**Note:** SQLite won't persist on Vercel. Switch to PostgreSQL for production:
- Use [Neon](https://neon.tech) (free PostgreSQL)
- Update `prisma/schema.prisma` provider to `"postgresql"`
- Set `DATABASE_URL` env var

### Database Options (Free)

| Service | Free Tier | Notes |
|---------|-----------|-------|
| SQLite | Unlimited | Local/dev only |
| Neon | 512 MB | PostgreSQL, recommended for production |
| Supabase | 500 MB | PostgreSQL + auth |
| Turso | 9 GB | SQLite edge database |

### Cloudflare (Free CDN + DNS)

1. Add your domain to Cloudflare
2. Point DNS to your hosting provider
3. Enable proxy (orange cloud)
4. Enable SSL/TLS (Full mode)
5. Set up Page Rules for caching

### Google AdSense (Ads)

1. Deploy your site first
2. Go to [adsense.google.com](https://adsense.google.com)
3. Add your site URL
4. Wait for approval (1-14 days)
5. Create ad units (banner, sidebar)
6. Add ad code to layout components

**Recommended ad placements:**
- Header banner (728x90)
- Sidebar (300x250)
- Between posts (responsive)

### Firebase (Analytics + Hosting)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Add Firebase Analytics to track users
4. Use Firebase Hosting for static assets

## Hosting Cost Roadmap

| Year | Users | Monthly Cost | Stack |
|------|-------|-------------|-------|
| Year 1 | Up to 500 | $0 | Free tier (Railway/Render) + Neon |
| Year 2 | Up to 750 | $5-10 | Railway Hobby + Neon |
| Year 3 | Up to 1000 | $15-25 | Railway Pro + Neon paid |
| Year 4+ | +250/year | Scale up | Add load balancer |

## User Cap System

- Year 1: 500 max users
- Year 2: 750 max users
- Year 3: 1000 max users
- Each subsequent year: +250 users
- Enforced via invite-only registration

## SaiditBot Rules

The AI bot automatically detects and removes:

| Category | Action |
|----------|--------|
| CSAM / Child Exploitation | Delete + -2 karma |
| Terrorism / Violence | Delete + -2 karma |
| Threats / Incitement | Delete + -2 karma |
| Doxing | Delete + -2 karma |
| Self-Harm | Delete + -2 karma |
| Malware / Hacking | Delete + -2 karma |
| Hate Speech | Delete + -2 karma |
| Illegal Drugs | Delete + -2 karma |
| Illegal Weapons | Delete + -2 karma |
| Spam / Scams | Delete + -2 karma |
| NSFW | Flag |
| Suspicious Links | Flag |

**Karma Rules:**
- -2 karma per bot deletion
- +2 karma for daily login (if active within 3 days)
- +1 karma per upvote received
- Cannot post/comment with negative karma

## Project Structure

```
saidit-app/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts             # Seed data
│   └── dev.db              # SQLite database
├── src/
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── c/              # Community pages
│   │   ├── games/          # Games section
│   │   ├── post/           # Post detail pages
│   │   ├── settings/       # User settings
│   │   ├── search/         # Search results
│   │   └── u/              # User profiles
│   ├── components/         # React components
│   └── lib/
│       ├── auth.ts         # JWT auth
│       ├── bot.ts          # SaiditBot engine
│       ├── karma.ts        # Karma system
│       ├── screening.ts    # Content screening
│       └── session.ts      # Session management
└── README.md
```

## Roadmap

- [ ] Real-time updates (WebSocket)
- [ ] Dark mode toggle
- [ ] Direct messages
- [ ] User following
- [ ] Post flairs
- [ ] Advanced search filters
- [ ] Mobile app (React Native)
- [ ] OAuth (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Custom community themes
- [ ] Post awards/trophies
- [ ] Mod log transparency

## License

Private — All rights reserved.
