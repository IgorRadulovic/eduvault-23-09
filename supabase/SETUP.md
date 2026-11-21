# Supabase + Firebase Setup Guide

**How it fits together**
- **Firebase** handles sign-up / login (email + Google).
- **Supabase** stores everything else: users' profiles and roles, products, orders, enrollments, coupons, reviews, files.
- The browser sends the user's **Firebase ID token** with every Supabase request (Supabase "Third-Party Auth").
  Row Level Security policies read the Firebase UID from it (`auth.jwt()->>'sub'`) to decide what each user may see.

## Your keys explained

In Supabase → Project Settings → API Keys:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon / publishable** key → `VITE_SUPABASE_ANON_KEY` (safe in the browser)
- **service_role / secret** key → NEVER put this in the frontend or in a `VITE_` variable.

## Step-by-step

### 1. Firebase: enable sign-in methods and domains
Firebase Console → Authentication:
- **Sign-in method**: enable *Email/Password* and *Google*.
- **Settings → Authorized domains**: add your Vercel domain(s), e.g. `your-site.vercel.app` and your custom domain.

### 2. Supabase: trust your Firebase project
Supabase Dashboard → **Authentication → Third-Party Auth** → *Add provider* → **Firebase** →
enter your **Firebase Project ID** (Firebase Console → Project settings → General). Save.

Without this step Supabase rejects the Firebase tokens and every logged-in request fails.

> Optional: Supabase recommends adding a `role: "authenticated"` custom claim to Firebase users.
> This app does **not** require it: the policies work for tokens with or without that claim.

### 3. Run the schema
Supabase → **SQL Editor** → New query → paste the whole of `schema.sql` → **Run**.

It creates the tables, security policies, checkout/coupon functions, and the storage buckets
(`product-images`, `course-videos`, `ebook-files`). It is safe to run again after changes.

### 4. Environment variables
Local `.env.local` (copy from `.env.local.example`) **and** Vercel → Project → Settings → Environment Variables:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
(+ the other VITE_FIREBASE_* values)
```
After changing variables in Vercel, **redeploy**: Vite bakes them in at build time.

### 5. Make yourself admin
1. Sign up on the website once (this creates your row in `public.users`).
2. In Supabase SQL Editor run:
   ```sql
   update public.users set role = 'admin' where email = 'you@example.com';
   ```
3. Sign out and back in → you'll be sent to `/admin`. From then on you can promote other users
   in Admin → Users.

### 6. Add products
Use Admin → Products → *Add Product* (tick **Published**), or submit through `/create`.
Courses submitted by non-admins via `/create` are saved as **drafts**. An admin publishes them from
Admin → Products → edit → tick *Published*.

### 7. Verify
- Logged out: homepage shows published products.
- Sign up: a new row appears in `public.users` (Table Editor).
- Add to cart → checkout: a row appears in `orders`, `order_items`, `enrollments`, and the item shows in **My Courses**.

## Checkout is in demo mode
There is no payment provider yet. `place_order()` records the order as **completed** and grants access
immediately, so anyone who signs in can enroll for free. Before going live, integrate Stripe: create the
order as `pending`, and grant enrollments from a Stripe webhook running server-side (e.g. a Vercel
Function using the service_role key).
