import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Location from '@/lib/models/Location';
import QueueEntry from '@/lib/models/QueueEntry';
import Session from '@/lib/models/Session';

type QueueDoc = {
  _id: { toString: () => string };
  position: number;
  name: string;
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

/** Public API: queue order and who is next for the Photoism display (no auth). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  await dbConnect();

  const { slug } = await params;

  const location = await Location.findOne({ id: slug });
  if (!location) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 });
  }

  const rawQueue = await QueueEntry.find({
    location_id: slug,
    status: { $in: ['waiting', 'notified', 'active'] },
  }).sort({ position: 1 });
  const queue = dedupeQueue(rawQueue as unknown as QueueDoc[]);

  let activeSession: { name: string; countdown: number } | null = null;
  const session = await Session.findOne({ location_id: slug, status: 'active' });
  if (session) {
    const now = new Date();
    const end = new Date(session.end_time!);
    const countdown = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
    const activeEntry = await QueueEntry.findById(session.queue_entry_id);
    activeSession = {
      name: activeEntry?.name ?? '—',
      countdown,
    };
  }

  // Next up: someone waiting/notified (never the active booth user)
  const activeQueueEntryId = session?.queue_entry_id?.toString();
  const nextEntry =
    queue.find(e => e.status === 'notified' && e._id.toString() !== activeQueueEntryId)
    ?? queue.find(e => e.status === 'waiting' && e._id.toString() !== activeQueueEntryId);
  const nextUp = nextEntry
    ? { name: nextEntry.name, position: nextEntry.position }
    : null;

  const queueList = queue.map(e => ({
    position: e.position,
    name: e.name,
    status: e.status,
  }));

  return NextResponse.json({
    locationName: location.name,
    activeSession,
    nextUp,
    queue: queueList,
  });
}
