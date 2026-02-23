import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import QueueEntry from '@/lib/models/QueueEntry';
import Session from '@/lib/models/Session';
import { verifyToken } from '@/lib/auth';

async function notifyNext(location_id: string) {
  const nextEntry = await QueueEntry.findOne({ location_id, status: 'waiting' }).sort({ position: 1 });
  if (nextEntry) {
    nextEntry.status = 'notified';
    nextEntry.notified_at = new Date();
    await nextEntry.save();
    // Customer sees "You're next" on their screen (no SMS)
  }
}

export async function POST(request: NextRequest) {
  await dbConnect();

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload || !payload.location_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const location_id = payload.location_id;

  const activeSession = await Session.findOne({ location_id, status: 'active' });
  if (!activeSession) {
    return NextResponse.json({ error: 'No active session' }, { status: 400 });
  }

  activeSession.end_time = new Date();
  activeSession.status = 'completed';
  await activeSession.save();

  const entry = await QueueEntry.findById(activeSession.queue_entry_id);
  if (entry) {
    entry.status = 'done';
    await entry.save();
  }

  // Notify next
  await notifyNext(location_id);

  return NextResponse.json({ success: true });
}