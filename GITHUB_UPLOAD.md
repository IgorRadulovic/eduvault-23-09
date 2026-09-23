# GitHub Upload Guide — Replacing Your Existing Repository

This guide covers replacing whatever is currently in your GitHub repo with this fresh codebase.

---

## Before You Start

You need:
- [Git](https://git-scm.com/downloads) installed on your computer
- A GitHub account
- Your existing repo URL (e.g. `https://github.com/YOUR_USERNAME/eduvault`)

---

## Option A — Replace existing repo (recommended)

This keeps the same repo URL, same Vercel connection, same history.

### Step 1 — Set up your .env.local

Before anything else, rename `.env.local.example` → `.env.local` and fill in your Supabase keys:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

The Firebase values are already filled in. `.env.local` is gitignored — it will never be committed.

### Step 2 — Open Terminal in the project folder

```bash
# Mac: right-click the eduvault-production folder → "New Terminal at Folder"
# Windows: open the folder, then Shift+Right-click → "Open PowerShell here"
```

### Step 3 — Install dependencies

```bash
npm install
```

### Step 4 — Test it works locally

```bash
npm run dev
```

Open http://localhost:5173 — if it loads, you're good.
Press Ctrl+C to stop.

### Step 5 — Connect to your existing GitHub repo

```bash
# Initialize git (if not already)
git init

# Add your existing remote (replace with YOUR repo URL)
git remote add origin https://github.com/YOUR_USERNAME/eduvault.git

# If you already have a remote set:
git remote set-url origin https://github.com/YOUR_USERNAME/eduvault.git

# Verify it's set correctly
git remote -v
```

### Step 6 — Replace the old code with the new code

```bash
# Stage everything
git add .

# Commit
git commit -m "feat: complete EduVault platform rebuild

- Firebase Auth (email + Google)
- Supabase database integration
- Course/eBook creation flow
- Admin dashboard (products, orders, users, coupons)
- Scroll reveal animations
- SEO, security headers, GDPR cookie banner
- Vercel deployment config"

# Force push to main — this REPLACES the old code on GitHub
# (Use this only if you're OK overwriting the old history)
git push origin main --force
```

> ⚠️ `--force` overwrites the remote branch. Your old code will be gone from the repo.
> If you want to keep the old code, create a backup branch first:
> `git push origin main:backup-old-code` before force pushing.

---

## Option B — Create a fresh repo

If you want a clean start with no old history:

### Step 1 — Create a new repo on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Name it `eduvault` (or whatever you prefer)
3. Leave it empty (no README, no .gitignore)
4. Click **Create repository**

### Step 2 — Push the code

```bash
# In your project folder:
git init
git add .
git commit -m "Initial commit — EduVault platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/eduvault.git
git push -u origin main
```

---

## After Pushing — Set Up Vercel

### If you already have a Vercel project connected:

1. Go to [vercel.com](https://vercel.com) → your project → **Settings → Environment Variables**
2. Add or update these variables:

| Variable | Value |
|----------|-------|
| `VITE_FIREBASE_API_KEY` | `YOUR_FIREBASE_API_KEY` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `YOUR_PROJECT.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `YOUR_FIREBASE_PROJECT_ID` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `YOUR_PROJECT.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `YOUR_MESSAGING_SENDER_ID` |
| `VITE_FIREBASE_APP_ID` | `YOUR_FIREBASE_APP_ID` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `YOUR_MEASUREMENT_ID` |
| `VITE_SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |
| `VITE_SITE_URL` | `https://your-domain.vercel.app` |

3. Go to **Deployments** → click the three dots on the latest → **Redeploy**

### If you need to connect a new Vercel project:

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Add all env variables above
4. Click **Deploy**

---

## After Deploying — Fix Google Sign-In

Google sign-in won't work until you whitelist your domain in Firebase:

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select project **YOUR_FIREBASE_PROJECT_ID**
3. **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain** and add:
   - `your-project.vercel.app`
   - `yourdomain.com` (when you have a custom domain)

---

## Setting Up GitHub Actions (Auto-deploy)

For automatic deployment on every `git push`:

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add each variable:

```
VERCEL_TOKEN          → Get from vercel.com/account/tokens
VERCEL_ORG_ID         → Run: vercel link  →  check .vercel/project.json → orgId
VERCEL_PROJECT_ID     → Same file → projectId
VITE_FIREBASE_API_KEY → YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN → YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID  → YOUR_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET → YOUR_PROJECT.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID → YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID  → YOUR_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID → YOUR_MEASUREMENT_ID
VITE_SUPABASE_URL     → your Supabase URL
VITE_SUPABASE_ANON_KEY → your Supabase anon key
VITE_SITE_URL         → https://your-domain.vercel.app
```

Once set: every `git push origin main` auto-deploys to production.

---

## Day-to-Day Workflow

After the initial setup, updating your site is just:

```bash
# Make your changes...

git add .
git commit -m "your description of what changed"
git push
```

If GitHub Actions is set up → auto-deploys in ~1 minute.
If not → go to Vercel dashboard → Deployments → Redeploy.

---

## Supabase Setup (if not done yet)

See `supabase/SETUP.md` for step-by-step instructions, including:
- Where to find your anon key (it's the "publishable" one, not the "secret" one)
- How to run the schema SQL
- How to create the product-images storage bucket
