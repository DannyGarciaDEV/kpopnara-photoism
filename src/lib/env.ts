/**
 * Validate required env vars. Call once at app startup or in critical paths.
 * In production, missing vars should fail fast.
 */
const required = [
  'MONGODB_URI',
  'JWT_SECRET',
] as const;

export function validateEnv(): void {
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Set them in .env.local (dev) or your host (production).'
    );
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters.');
  }
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
