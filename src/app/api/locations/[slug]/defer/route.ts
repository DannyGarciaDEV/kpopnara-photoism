import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import QueueEntry from '@/lib/models/QueueEntry';

async function notifyNextIfNoneNotified(location_id: string) {
  const alreadyNotified = await QueueEntry.findOne({ location_id, status: 'notified' });
  if (alreadyNotified) return;

  const nextEntry = await QueueEntry.findOne({ location_id, status: 'waiting' }).sort({ position: 1 });
  if (nextEntry) {
    nextEntry.status = 'notified';
    nextEntry.notified_at = new Date();
    await nextEntry.save();
  }
}

/** Customer defers their turn: let next person go, keep me in queue at the end. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  await dbConnect();

  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === 'string' ? body.id.trim() : '';

  if (!id) {
    return NextResponse.json({ error: 'Queue id is required' }, { status: 400 });
  }

  const entry = await QueueEntry.findById(id);
  if (!entry || entry.location_id !== slug) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  if (!['waiting', 'notified', 'no_show'].includes(entry.status)) {
    return NextResponse.json({ error: 'You can only defer while waiting or skipped' }, { status: 400 });
  }

  const maxPositionEntry = await QueueEntry.findOne({
    location_id: slug,
    status: { $in: ['waiting', 'notified', 'active'] },
  })
    .sort({ position: -1 })
    .select('position');

  entry.position = (maxPositionEntry?.position ?? 0) + 1;
  entry.status = 'waiting';
  entry.notified_at = undefined;
  await entry.save();

  await notifyNextIfNoneNotified(slug);

  return NextResponse.json({ success: true });
}
