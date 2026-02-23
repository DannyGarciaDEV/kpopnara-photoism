import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET!;

export function signToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET);
}

export function verifyToken(token: string): { location_id: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === 'object' && payload && 'location_id' in payload) {
      return payload as { location_id: string };
    }
    return null;
  } catch {
    return null;
  }
}
