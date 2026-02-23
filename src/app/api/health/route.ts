import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

/**
 * GET /api/health - for production monitoring (e.g. Vercel, uptime checks).
 * Returns 200 if the app and DB are reachable.
 */
export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('Health check failed:', e);
    return NextResponse.json(
      { status: 'error', message: 'Database unavailable' },
      { status: 503 }
    );
  }
}
