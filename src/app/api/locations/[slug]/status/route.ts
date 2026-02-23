import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import QueueEntry from '@/lib/models/QueueEntry';
import Session from '@/lib/models/Session';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  await dbConnect();

  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const entry = await QueueEntry.findById(id);
  if (!entry || entry.location_id !== slug) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  let countdown = null;
  if (entry.status === 'active') {
    const session = await Session.findOne({ queue_entry_id: id, status: 'active' });
    if (session && session.end_time) {
      const now = new Date();
      const end = new Date(session.end_time);
      countdown = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000)); // seconds
    }
  }

  // Recalculate position in case others were removed
  const activeEntries = await QueueEntry.find({ location_id: slug, status: { $in: ['waiting', 'notified', 'active'] } }).sort({ position: 1 });
  const currentPosition = activeEntries.findIndex(e => e._id.toString() === id) + 1;

  return NextResponse.json({
    status: entry.status,
    position: currentPosition,
    countdown,
  });
}