import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import Location from '@/lib/models/Location';
import StaffUser from '@/lib/models/StaffUser';

export async function POST(request: NextRequest) {
  // In production, require a secret header so only you can run seed
  if (process.env.NODE_ENV === 'production') {
    const secret = request.headers.get('x-seed-secret');
    const expected = process.env.SEED_SECRET;
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  await dbConnect();

  // Seed locations
  const locations = [
    { id: 'nyc', name: 'Kpop Nara NYC', city: 'New York' },
    { id: 'boston', name: 'Kpop Nara Boston', city: 'Boston' },
  ];

  for (const loc of locations) {
    await Location.findOneAndUpdate({ id: loc.id }, loc, { upsert: true });
  }

  // Seed staff
  const staff = [
    { email: 'staff@nyc.com', password: 'password', location_id: 'nyc' },
    { email: 'staff@boston.com', password: 'password', location_id: 'boston' },
    { email: 'dannygarciadev@gmail.com', password: 'dannycortesxd', location_id: 'boston' },
  ];

  for (const s of staff) {
    const hash = bcrypt.hashSync(s.password, 10);
    const email = s.email.trim().toLowerCase();
    await StaffUser.findOneAndUpdate(
      { email },
      { email, password_hash: hash, location_id: s.location_id },
      { upsert: true }
    );
  }

  return NextResponse.json({ success: true });
}