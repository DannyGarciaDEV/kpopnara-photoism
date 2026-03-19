import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import QueueEntry from '@/lib/models/QueueEntry';

async function notifyNext(location_id: string) {
  const nextEntry = await QueueEntry.findOne({ location_id, status: 'waiting' }).sort({ position: 1 });
  if (nextEntry) {
    nextEntry.status = 'notified';
    nextEntry.notified_at = new Date();
    await nextEntry.save();
  }
}

/** Customer removes themselves from the queue (waiting / notified only). */
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

  if (entry.status !== 'waiting' && entry.status !== 'notified') {
    return NextResponse.json({ error: 'You can only leave the queue while waiting' }, { status: 400 });
  }

  entry.status = 'cancelled';
  await entry.save();
  await notifyNext(slug);

  return NextResponse.json({ success: true });
}
