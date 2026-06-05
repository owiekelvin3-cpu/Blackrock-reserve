# Platinum Crest Bank

Premium digital banking platform built with Next.js 14, TypeScript, Tailwind CSS, Prisma, Supabase PostgreSQL, and NextAuth.

## Deploy to Vercel

1. Push this repo to GitHub and import it in [Vercel](https://vercel.com/new).
2. Add these **Environment Variables** in the Vercel project settings:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooled connection string (with `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase direct connection string (for Prisma migrations) |
| `NEXTAUTH_URL` | Your production URL, e.g. `https://platinum-crest-bank.vercel.app` |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Optional — Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional — Google OAuth |

3. Deploy. Vercel runs `npm install` (which triggers `prisma generate` via `postinstall`) then `npm run build`.
4. After first deploy, apply the database schema:

```bash
npx prisma db push
```

Run this locally with production `DATABASE_URL` / `DIRECT_URL`, or use Supabase SQL editor after exporting the schema.

## Local development

```bash
npm install
cp .env.example .env
# Fill in Supabase + NextAuth values in .env
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:push` | Sync Prisma schema to database |
| `npm run db:studio` | Open Prisma Studio |

## Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL via Supabase + Prisma
- **Auth:** NextAuth.js (credentials + optional Google)
- **UI:** Tailwind CSS, Framer Motion, Recharts, Lucide icons
