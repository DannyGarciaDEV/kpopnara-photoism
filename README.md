# Kpop Nara Photoism Queue System

A digital queue and timer management system for Photoism booths at Kpop Nara locations.

## Features

- Customer queue joining via QR code
- Real-time queue status
- SMS notifications
- 5-minute timed sessions
- Staff dashboard for queue management
- Multi-location support (NYC, Boston, etc.)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set:
   - `MONGODB_URI` – MongoDB connection string
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` – for SMS
   - `JWT_SECRET` – at least 32 characters for staff auth

3. Seed the database:
   POST to `/api/seed` or run a script.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage

- Customers: Visit `/locations/nyc` to join the queue.
- Staff: Visit `/staff/login` to log in, then `/staff/dashboard` to manage.

## Production

- **Build:** `npm run build` (requires only `JWT_SECRET` and `MONGODB_URI` for static/API analysis; Twilio is lazy-loaded at runtime).
- **Run:** `npm run start`
- **Deploy:** Set the same env vars in your host (e.g. Vercel). Seed via `POST /api/seed` after first deploy.
- Logo: `public/kpopnara-logo.png` is used as favicon and in the app UI.

## Tech Stack

- Next.js
- MongoDB (Mongoose)
- Twilio (SMS)
- Tailwind CSS
# kpopnara-photoism
