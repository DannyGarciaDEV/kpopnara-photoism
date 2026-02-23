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
  const { queue_entry_id } = await request.json();

  if (!queue_entry_id) {
    return NextResponse.json({ error: 'Queue entry ID is required' }, { status: 400 });
  }

  const entry = await QueueEntry.findById(queue_entry_id);
  if (!entry || entry.location_id !== location_id) {
    return NextResponse.json({ error: 'Invalid queue entry' }, { status: 400 });
  }
  if (entry.status !== 'waiting' && entry.status !== 'notified') {
    return NextResponse.json({ error: 'Only the next person in line can start a session' }, { status: 400 });
  }

  // Check if there's already an active session
  const activeSession = await Session.findOne({ location_id, status: 'active' });
  if (activeSession) {
    return NextResponse.json({ error: 'There is already an active session' }, { status: 400 });
  }

  entry.status = 'active';
  await entry.save();

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 5 * 60 * 1000); // 5 minutes

  const session = new Session({
    location_id,
    queue_entry_id: entry._id,
    start_time: startTime,
    end_time: endTime,
  });

  await session.save();

  // Notify next
  await notifyNext(location_id);

  return NextResponse.json({ success: true });
}