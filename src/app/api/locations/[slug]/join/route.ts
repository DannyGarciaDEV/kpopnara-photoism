import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Location from '@/lib/models/Location';
import QueueEntry from '@/lib/models/QueueEntry';

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

  // Find the max position for this location
  const maxPosition = await QueueEntry.findOne({ location_id: slug }).sort({ position: -1 }).select('position');
  const position = maxPosition ? maxPosition.position + 1 : 1;

  const queueEntry = new QueueEntry({
    location_id: slug,
    name: name.trim(),
    pronouns: typeof pronouns === 'string' ? pronouns.trim() || undefined : undefined,
    phone: '', // optional; empty so no phone collected
    position,
  });

  await queueEntry.save();

  // Estimated wait: assume 5 min per person, but since sessions are 5 min, and one at a time, wait = position * 5 min
  const estimatedWait = position * 5; // minutes

  return NextResponse.json({
    id: queueEntry._id.toString(),
    position,
    estimatedWait,
  });
}