export function runtimeEnv() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim() ?? '';
  const secret = process.env.NEON_AUTH_COOKIE_SECRET ?? '';
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';
  const configured = baseUrl.startsWith('https://') && secret.length >= 32 && databaseUrl.startsWith('postgres');
  return { baseUrl, secret, databaseUrl, appUrl, configured };
}
