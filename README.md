# 🐷 BaadFunds

A cute, fully-working investment simulator built to teach Baad how SIPs, fixed-rate
plans, penalties, early-withdrawal charges, and loans work in real life — with real
compounding math under the hood.

Two routes:
- `/` — Baad's world: dashboard, plans, calculator, loan requests, payments, chatbot, coupons
- `/admin` — Soham's control room (password: **Baad**)

---

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the contents of `backend/supabase/schema.sql`.
3. Go to **Project Settings → API** and copy your **Project URL** and **service_role key**
   (not the anon key — the backend needs the service role key to bypass row-level security).

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# paste your Supabase URL + service role key into .env
npm install
npm run dev
```

The API runs at `http://localhost:4000`. Check `http://localhost:4000/api/health`.

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. It proxies `/api` requests to the backend automatically
(see `vite.config.js`), so both need to be running at once.

## 4. First-time admin setup

1. Go to `/admin` and log in with password **Baad**.
2. Create your first plan (e.g. "Daily Diyas" — daily, ₹10 min, 8%, 12-month maturity).
3. Optionally drop a welcome coupon in the Coupons tab so Baad gets a scratch-card
   surprise the first time she opens the site.

## How the money math works

- Every approved payment compounds **daily** at the plan's fixed annual rate from the
  moment it's approved — this is the same math a real recurring deposit uses.
- The SIP Calculator (`/calculator`) uses the identical formula, so it's genuinely useful
  outside of BaadFunds too.
- If a due payment isn't approved by midnight, it's automatically flagged with a penalty
  (2 burgers 🍔) — visible on the dashboard and in `/admin`.
- Withdrawing before a plan's maturity date automatically attaches an early-exit charge
  (2 steamed momos 🥟).
- Loans accrue interest monthly (default 50%) from the moment they're approved, and
  approving a loan automatically settles Baad's next due SIP payment.

## Deploying (Netlify frontend + Render backend)

**Backend on Render**
1. New Web Service → point it at this repo, root directory `backend`.
2. Build command: `npm install` · Start command: `npm start`.
3. Add environment variables from `backend/.env.example` (`SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`). Don't set `PORT` — Render sets it
   automatically and `server.js` already reads `process.env.PORT`.
4. Once deployed, copy your Render URL (e.g. `https://baadfunds-api.onrender.com`).

**Frontend on Netlify**
1. Root directory `frontend`. Build command: `npm run build`. Publish directory: `dist`.
2. In Netlify's dashboard → Site settings → Environment variables, add
   `VITE_API_URL` = your Render URL from above (no trailing slash).
3. React Router needs a rewrite rule so refreshing `/plans` or `/admin` doesn't 404.
   **Netlify doesn't use `.htaccess`** (that's an Apache thing) — instead this project
   already includes `frontend/public/_redirects` containing `/* /index.html 200`, which
   Vite copies into the build automatically. Nothing else needed.
4. Redeploy after adding the env variable (Netlify only bakes it in at build time).

No other code changes are needed — `api.js` now reads `VITE_API_URL` in production and
falls back to the local dev proxy automatically.

## Notes on the payment flow

The UPI QR/deep-link and WhatsApp confirmation message are simulated, exactly like the
module you provided — there's no real payment gateway. Baad picks UPI or Cash, optionally
messages Soham on WhatsApp (+91 9359118747) to confirm, and every payment sits as
"pending/attempted" until you manually approve it in `/admin`. Nothing is auto-confirmed.

## Project structure

```
BaadFunds/
  backend/            Express API
    routes/           plans, investments, payments, withdrawals, loans, coupons, admin, chatbot
    utils/            compounding + maturity math
    supabase/schema.sql
  frontend/           Vite + React app
    src/pages/        Dashboard, Plans, Enroll, Payment, Calculator, Loan
    src/pages/admin/  AdminLogin, AdminDashboard + 4 management panels
    src/components/   Navbar, Chatbot (Soham), CouponPopup (scratch card)
```
