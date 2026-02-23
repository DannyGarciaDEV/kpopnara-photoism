import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import QueueEntry from '@/lib/models/QueueEntry';
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
  const { queue_entry_id } = await request.json();

  if (!queue_entry_id) {
    return NextResponse.json({ error: 'Queue entry ID is required' }, { status: 400 });
  }

  const entry = await QueueEntry.findById(queue_entry_id);
  if (!entry || entry.location_id !== location_id) {
    return NextResponse.json({ error: 'Invalid queue entry' }, { status: 400 });
  }

  entry.status = 'no_show';
  await entry.save();

  // Notify next
  await notifyNext(location_id);

  return NextResponse.json({ success: true });
}