# Kpop Nara Photoism Queue System

A digital queue and timer management system for Photoism booths at Kpop Nara locations.

## Features

- Customer queue joining via QR code (name + pronouns; phone optional)
- Real-time queue status (polling)
- “You’re next” and 5-minute timed sessions
- Staff dashboard for queue management
- Multi-location support (NYC, Boston, etc.)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set:
   - `MONGODB_URI` – MongoDB connection string
   - `JWT_SECRET` – at least 32 characters for staff auth

3. Seed the database (dev only; no secret required):
   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage

- **Customers:** Visit `/locations/nyc` or `/locations/boston` to join the queue.
- **Staff:** Visit `/staff/login`, then `/staff/dashboard` to manage the queue.

## Production

### Checklist

- [ ] Set `MONGODB_URI` (e.g. MongoDB Atlas) and `JWT_SECRET` (≥32 chars) in your host.
- [ ] Set `SEED_SECRET` in production if you need to run seed once after deploy (see below).
- [ ] Do **not** rely on default seed passwords; change them after first seed or use signup.
- [ ] Use HTTPS (Vercel/default deployments provide this).

### Build and run

```bash
npm run build
npm run start
```

### Deploy (e.g. Vercel)

1. Connect the repo and set environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `SEED_SECRET` (optional; only if you want to call the seed endpoint in production)

2. Deploy. The app will validate required env at runtime (DB and JWT).

3. (Optional) Run seed once after first deploy:
   ```bash
   curl -X POST https://your-app.vercel.app/api/seed -H "X-Seed-Secret: YOUR_SEED_SECRET"
   ```
   If `SEED_SECRET` is not set, `POST /api/seed` returns 403 in production.

### Health check

- **GET /api/health** – Returns 200 if the app and database are reachable (for monitoring/uptime checks).

### Logo

- `public/kpopnara-logo.png` is used as favicon and in the app UI.

## Tech Stack

- Next.js (App Router)
- MongoDB (Mongoose)
- Tailwind CSS
