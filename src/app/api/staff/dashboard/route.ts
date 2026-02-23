import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Location from '@/lib/models/Location';
import QueueEntry from '@/lib/models/QueueEntry';
import Session from '@/lib/models/Session';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

  // Get queue entries
  const queue = await QueueEntry.find({ location_id, status: { $in: ['waiting', 'notified', 'active'] } }).sort({ position: 1 });

  // Get active session
  let activeSession = null;
  const session = await Session.findOne({ location_id, status: 'active' });
  if (session) {
    const now = new Date();
    const end = new Date(session.end_time!);
    const countdown = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
    activeSession = {
      id: session._id.toString(),
      queue_entry_id: session.queue_entry_id.toString(),
      countdown,
    };
  }

  const location = await Location.findOne({ id: location_id });
  const queueData = queue.map(entry => ({
    id: entry._id.toString(),
    position: entry.position,
    name: entry.name,
    pronouns: entry.pronouns,
    phone: entry.phone && entry.phone.length >= 4 ? `***${entry.phone.slice(-4)}` : '****',
    status: entry.status,
  }));

  let activeSessionWithName: { id: string; queue_entry_id: string; countdown: number; name?: string; pronouns?: string } | null = activeSession;
  if (activeSession && queue.length) {
    const activeEntry = queue.find(e => e._id.toString() === activeSession.queue_entry_id);
    if (activeEntry) {
      activeSessionWithName = { ...activeSession, name: activeEntry.name, pronouns: activeEntry.pronouns ?? undefined };
    }
  }

  return NextResponse.json({
    location: location ? { name: location.name } : null,
    queue: queueData,
    activeSession: activeSessionWithName,
  });
}