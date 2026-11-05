# Reality Check

**Understand the world. One decision at a time.**

An interactive decision-simulation platform: economics policy, a business strategy game, environmental policy to 2050, and global dilemmas, with a step-by-step "Ask why" AI tutor.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Supabase (auth + Postgres with row-level security) and the Anthropic API.

---

## What works with no setup at all

Run it with zero configuration and every simulator, chart, comparison, challenge, badge and saved simulation works. Progress is stored in the visitor's browser ("guest mode").

Three features need the services below:

| Feature | Needs |
|---|---|
| Accounts, progress across devices | Supabase |
| Leaderboard, "How others decided" | Supabase |
| "Ask why" explanations | Anthropic API key |

---

## 1. Run it on your computer

Install [Node.js](https://nodejs.org) (version 18.17 or newer, the LTS download is fine). Then, in a terminal inside this folder:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

---

## 2. Set up Supabase (accounts and shared data) — about 10 minutes

1. Create a free account at [supabase.com](https://supabase.com) → **New project**. Choose a region close to your users (e.g. Mumbai). Save the database password somewhere safe.
2. In the project, open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, and click **Run**. You should see "Success. No rows returned".
3. Open **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy `.env.example` to a new file called `.env.local` and paste the two values in.
5. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` for now (change to your live URL after deploying)
   - Redirect URLs: add `http://localhost:3000/auth/callback` and, later, `https://YOUR-DOMAIN/auth/callback`
6. Restart `npm run dev`. "Sign in" now appears in the navigation. Email magic links work immediately.

**Optional: Google sign-in.** Authentication → Providers → Google. Follow Supabase's guide to create OAuth credentials in Google Cloud Console and paste the client ID and secret.

> Supabase's built-in email sender is rate-limited (a few emails per hour). Fine for testing; for a public launch, connect a free SMTP provider such as Resend under Authentication → Emails → SMTP settings.

## 3. Turn on "Ask why" (AI explanations) — 5 minutes

1. Create an account at [console.anthropic.com](https://console.anthropic.com), add a small amount of credit, and create an API key.
2. Put it in `.env.local` as `ANTHROPIC_API_KEY=...`

The key is only ever read on the server (`app/api/explain/route.ts`); it is never sent to the browser. By default only signed-in users can use the assistant, which protects your bill. Each answer is capped at 700 tokens and each user at 12 questions a minute.

**Set a monthly spend limit in the Anthropic console** before you share the site publicly.

## 4. Put it online (Vercel, free) — 10 minutes

1. Create a GitHub account and upload this folder as a new repository (GitHub Desktop is the easiest way). `.env.local` is excluded automatically, so your keys stay off GitHub.
2. Sign in to [vercel.com](https://vercel.com) with GitHub → **Add New → Project** → import the repository.
3. Before clicking Deploy, open **Environment Variables** and add the same variables as in `.env.local`.
4. Deploy. You get a live URL like `reality-check.vercel.app`.
5. Back in Supabase → Authentication → URL Configuration, set the Site URL to that address and add `https://reality-check.vercel.app/auth/callback` to Redirect URLs.

**Custom domain:** buy one (Namecheap, GoDaddy, Cloudflare), then Vercel → Project → Settings → Domains → Add, and follow the DNS instructions. Update the Supabase URLs again to match.

---

## How the code is organised

```
app/                    Pages (one folder per route) and server routes
  api/explain/route.ts  AI tutor: validates input, checks sign-in, rate-limits, streams the answer
  auth/callback/        Finishes email and Google sign-in
components/
  AppProvider.tsx       Signed-in user, progress (local or cloud), XP and badges, toasts
  AskWhy.tsx            The floating explanation assistant
  ui.tsx                Sliders, charts, KPI cards, dialogs, data-tier labels
  sims/                 One component per page; useScenario.ts keeps settings in the URL
lib/
  models/               The three simulation models — pure functions, easy to test and change
  content/index.ts      Mechanism explanations, challenges, and every sourced historical fact
  progress.ts           XP values and badge rules
supabase/schema.sql     Tables, security rules, XP trigger, leaderboard and vote-tally functions
```

### Data honesty rules (please keep them)

- Every number on screen is labelled **Historical record**, **Model estimate** or **Hypothetical scenario**.
- Historical records live in `lib/content/index.ts` with a named source and link. Only add one after checking it at the source.
- Model coefficients are documented in each simulator's "Model assumptions" panel. If you change a coefficient, update that text.

### Security notes

- Row-level security means each user can only read and write their own simulations, history and reasoning. The leaderboard and vote totals are exposed only through two aggregate functions.
- XP can only change through the `events` table, whose trigger enforces fixed amounts, a 3-second duplicate filter, a badge cap and a 1,500 XP daily cap. Users cannot edit their XP directly.
- The AI route's rate limit is in memory, so it resets per server instance. For heavy traffic, swap it for Upstash Redis.

### Ideas for what to build next

- Let users rename their display name on the dashboard (the database already allows it).
- Pull live indicators from the World Bank API (`api.worldbank.org/v2`) into a "Real data" tab, clearly labelled with the retrieval date.
- Add a teacher mode: a class code that groups students' challenge answers for discussion.
- Unit tests for `lib/models/*` with Vitest.
