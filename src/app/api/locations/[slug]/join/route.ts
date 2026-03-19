import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Location from '@/lib/models/Location';
import QueueEntry from '@/lib/models/QueueEntry';
import { estimateWaitForNewJoin } from '@/lib/estimate-queue-wait';

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  await dbConnect();

  const { slug } = await params;
  const { name, pronouns } = await request.json();

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  let location = await Location.findOne({ id: slug });
  if (!location) {
    // Ensure default locations exist (so app works without running /api/seed)
    const defaults: Record<string, { name: string; city: string }> = {
      nyc: { name: 'Kpop Nara NYC', city: 'New York' },
      boston: { name: 'Kpop Nara Boston', city: 'Boston' },
    };
    const def = defaults[slug.toLowerCase()];
    if (def) {
      location = await Location.findOneAndUpdate(
        { id: slug },
        { id: slug, name: def.name, city: def.city, is_active: true },
        { upsert: true, new: true }
      );
    }
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
  }

  // Queue numbers reset each day: position = 1, 2, 3... for everyone who joins today
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const countToday = await QueueEntry.countDocuments({
    location_id: slug,
    created_at: { $gte: startOfToday },
  });
  const position = countToday + 1;

  // Before this person exists in DB: everyone currently in line is ahead
  const estimatedWait = await estimateWaitForNewJoin(slug);

  const queueEntry = new QueueEntry({
    location_id: slug,
    name: name.trim(),
    pronouns: typeof pronouns === 'string' ? pronouns.trim() || undefined : undefined,
    phone: '', // optional; empty so no phone collected
    position,
  });

  await queueEntry.save();

  return NextResponse.json({
    id: queueEntry._id.toString(),
    position,
    estimatedWait,
  });
}