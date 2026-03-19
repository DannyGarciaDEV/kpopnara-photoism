import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Location from '@/lib/models/Location';
import QueueEntry from '@/lib/models/QueueEntry';
import Session from '@/lib/models/Session';

/** Public API: queue order and who is next for the Photoism display (no auth). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  await dbConnect();

  const { slug } = await params;

  const location = await Location.findOne({ id: slug });
  if (!location) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 });
  }

  const queue = await QueueEntry.find({
    location_id: slug,
    status: { $in: ['waiting', 'notified', 'active'] },
  }).sort({ position: 1 });

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
  const nextEntry = queue.find(e => e.status === 'notified') ?? queue.find(e => e.status === 'waiting');
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
