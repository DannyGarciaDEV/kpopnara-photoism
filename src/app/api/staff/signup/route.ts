import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import Location from '@/lib/models/Location';
import StaffUser from '@/lib/models/StaffUser';

const ALLOWED_LOCATION_IDS = ['nyc', 'boston'];

export async function POST(request: NextRequest) {
  await dbConnect();

  const body = await request.json();
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const location_id = typeof body?.location_id === 'string' ? body.location_id.trim().toLowerCase() : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  if (!location_id || !ALLOWED_LOCATION_IDS.includes(location_id)) {
    return NextResponse.json({ error: 'Please select a valid location (NYC or Boston)' }, { status: 400 });
  }

  // Ensure location exists
  const location = await Location.findOne({ id: location_id });
  if (!location) {
    await Location.findOneAndUpdate(
      { id: location_id },
      {
        id: location_id,
        name: location_id === 'nyc' ? 'Kpop Nara NYC' : 'Kpop Nara Boston',
        city: location_id === 'nyc' ? 'New York' : 'Boston',
        is_active: true,
      },
      { upsert: true }
    );
  }

  const existing = await StaffUser.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  await StaffUser.create({ email, password_hash, location_id });

  return NextResponse.json({ success: true, message: 'Account created. You can now log in.' });
}
