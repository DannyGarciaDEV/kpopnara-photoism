import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Location from '@/lib/models/Location';
import QueueEntry from '@/lib/models/QueueEntry';
import Session from '@/lib/models/Session';
import { verifyToken } from '@/lib/auth';

type QueueDoc = {
  _id: { toString: () => string };
  position: number;
  name: string;
  pronouns?: string;
  phone?: string;
  status: 'waiting' | 'notified' | 'active' | 'done' | 'no_show' | 'cancelled';
};

function dedupeQueue(entries: QueueDoc[]) {
  const priority: Record<string, number> = { active: 3, notified: 2, waiting: 1 };
  const byKey = new Map<string, QueueDoc>();

  for (const entry of entries) {
    const key = `${entry.position}::${entry.name.trim().toLowerCase()}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, entry);
      continue;
    }
    const existingPriority = priority[existing.status] ?? 0;
    const currentPriority = priority[entry.status] ?? 0;
    if (currentPriority > existingPriority) {
      byKey.set(key, entry);
    }
  }

  return Array.from(byKey.values()).sort((a, b) => a.position - b.position);
}

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
  const rawQueue = await QueueEntry.find({ location_id, status: { $in: ['waiting', 'notified', 'active'] } }).sort({ position: 1 });
  const queue = dedupeQueue(rawQueue as unknown as QueueDoc[]);

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

  // Who should go after the current booth user (or first in line if no active session)
  const nextUpEntry =
    queue.find(e => e.status === 'notified' && e._id.toString() !== activeSession?.queue_entry_id)
    ?? queue.find(e => e.status === 'waiting' && e._id.toString() !== activeSession?.queue_entry_id)
    ?? null;

  return NextResponse.json({
    location: location ? { id: location.id, name: location.name } : null,
    queue: queueData,
    activeSession: activeSessionWithName,
    nextUp: nextUpEntry
      ? {
          id: nextUpEntry._id.toString(),
          position: nextUpEntry.position,
          name: nextUpEntry.name,
          pronouns: nextUpEntry.pronouns ?? undefined,
        }
      : null,
  });
}