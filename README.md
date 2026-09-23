# EduVault — Course & eBook Selling Platform

A production-ready React frontend. All mock data has clearly marked swap points for your backend.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies (Node 18+ required)
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and set VITE_API_BASE_URL

# 3. Start dev server
npm run dev
# → http://localhost:5173
```

---

## 🔑 Demo Logins

| Role    | Email                  | Password  |
|---------|------------------------|-----------|
| Admin   | admin@eduvault.com     | admin123  |
| Student | jane@example.com       | pass123   |

---

## 📁 Project Structure

```
eduvault/
├── public/
│   ├── logo.png           ← Your logo (replace with yours)
│   ├── robots.txt
│   ├── sitemap.xml        ← Update URLs before launch
│   └── _redirects         ← Netlify SPA routing
│
├── src/
│   ├── api/
│   │   ├── client.js      ← Fetch wrapper (set VITE_API_BASE_URL)
│   │   ├── services.js    ← ALL API calls — swap MOCK→REAL here
│   │   └── mockData.js    ← DELETE when backend is live
│   │
│   ├── context/
│   │   └── index.jsx      ← Auth, Theme, Cart, Toast
│   │
│   ├── hooks/
│   │   └── index.js       ← useAsync, useForm, validators
│   │
│   ├── components/
│   │   ├── ui/index.jsx           ← Button, Badge, Input, Modal, Table…
│   │   └── layout/
│   │       ├── Navbar.jsx
│   │       ├── Footer.jsx
│   │       ├── AuthGuard.jsx      ← RequireAuth, RequireAdmin, RequireGuest
│   │       ├── ErrorBoundary.jsx  ← Catches React errors gracefully
│   │       ├── SEO.jsx            ← Per-page meta tags
│   │       └── CookieBanner.jsx   ← GDPR consent
│   │
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── CatalogPage.jsx   ← /courses and /ebooks
│   │   ├── ProductPage.jsx   ← /product/:slug
│   │   ├── CartPage.jsx
│   │   ├── CheckoutPage.jsx  ← Multi-step checkout (wire up Stripe)
│   │   ├── MyCourses.jsx
│   │   ├── NotFound.jsx
│   │   ├── auth/AuthPages.jsx
│   │   └── admin/AdminDashboard.jsx
│   │
│   ├── utils/helpers.js
│   ├── styles/global.css    ← Design tokens (light + dark)
│   ├── App.jsx              ← Routes + ScrollToTop
│   └── main.jsx             ← Entry point
│
├── index.html               ← Full SEO meta tags
├── vite.config.js           ← Build optimizations + dev proxy
├── vercel.json              ← Vercel SPA routing + security headers
├── netlify.toml             ← Netlify SPA routing + headers
├── .env.example             ← Copy to .env.local
└── package.json
```

---

## 🔌 Connecting Your Backend

Open `src/api/services.js` — every function has a **MOCK** block and a **REAL** line:

```js
export async function authLogin({ email, password }) {
  // MOCK — delete this block when backend is ready
  await delay(650);
  ...

  // REAL: uncomment when backend is ready
  // const d = await api.post('/auth/login', { email, password });
  // persist(d.user, d.token); return d.user;
}
```

**Steps:**
1. Set `VITE_API_BASE_URL=https://your-api.com/api` in `.env.local`
2. For each function in `services.js`: delete the MOCK block, uncomment the REAL line
3. Delete `src/api/mockData.js`
4. Done ✓

---

## 💳 Stripe Integration (Checkout)

`src/pages/CheckoutPage.jsx` has a clearly marked TODO:

```js
// TODO: Replace with real Stripe integration
// const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
// const { error } = await stripe.redirectToCheckout({ ... });
```

Install Stripe and replace that block:

```bash
npm install @stripe/stripe-js
```

---

## 🏗 Deploy to Production

### Vercel (recommended)
```bash
npm i -g vercel
vercel --prod
```
`vercel.json` already configures SPA routing and security headers.

### Netlify
```bash
npm run build
# Drag & drop the /dist folder to Netlify
# or connect your Git repo — netlify.toml handles the rest
```

### Any static host
```bash
npm run build
# Upload /dist to S3, Cloudflare Pages, etc.
# Configure your host to serve index.html for all routes
```

---

## ✅ Production Checklist

### Must do before launch
- [ ] Connect real backend (`services.js` — swap MOCK→REAL)
- [ ] Integrate Stripe payments (`CheckoutPage.jsx`)
- [ ] Replace `/public/logo.png` with your final logo asset
- [ ] Set `VITE_SITE_URL` in `.env.local` to your real domain
- [ ] Update `public/sitemap.xml` with your real domain + all product URLs
- [ ] Set up HTTPS on your domain (automatic on Vercel/Netlify)
- [ ] Delete `src/api/mockData.js` after backend is live

### Strongly recommended
- [ ] Set up error tracking: [Sentry](https://sentry.io) — add to `ErrorBoundary.componentDidCatch`
- [ ] Set up analytics: [Plausible](https://plausible.io) or Google Analytics 4
- [ ] Configure transactional email: [Resend](https://resend.com) or SendGrid for order receipts
- [ ] Test on mobile devices
- [ ] Run Lighthouse audit (`npm run build && npm run preview`, then DevTools → Lighthouse)
- [ ] Set up a staging environment

### Nice to have
- [ ] Add e2e tests with Playwright
- [ ] Set up a CI/CD pipeline (GitHub Actions)

---

## 🎨 Customisation

| What              | Where                             |
|-------------------|-----------------------------------|
| Logo              | `/public/logo.png`                |
| Brand colors      | `src/styles/global.css` — `:root` |
| Dark mode colors  | `src/styles/global.css` — `[data-theme="dark"]` |
| Fonts             | `index.html` + `global.css`       |
| Site name / URLs  | `src/components/layout/SEO.jsx`   |
| Demo products     | `src/api/mockData.js`             |

---

## 🛡 Security (already configured)

- ✅ Security headers via `vercel.json` / `netlify.toml`
- ✅ JWT token stored in localStorage (move to httpOnly cookie when backend supports it)
- ✅ 401 handler clears stale tokens automatically
- ✅ Admin routes protected both client-side and should be protected server-side too
- ✅ Input validation on all forms
- ✅ `noIndex` on checkout, cart, and auth pages
- ✅ robots.txt blocks admin/private pages from crawlers

---

## 📦 Stack

| Tech              | Version  | Purpose                    |
|-------------------|----------|----------------------------|
| React             | 18       | UI framework               |
| React Router      | v6       | Client-side routing        |
| Vite              | 5        | Build tool                 |
| CSS Variables     | —        | Design system (no CSS framework) |
# eduvault-23-09
