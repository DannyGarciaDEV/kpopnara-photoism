import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import StaffUser from '@/lib/models/StaffUser';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await dbConnect();

  const body = await request.json();
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = await StaffUser.findOne({ email });
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = signToken({ location_id: user.location_id });

  return NextResponse.json({ token });
}