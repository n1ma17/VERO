export function validateAuthEnv(config: Record<string, unknown>): void {
  const secret = config.BETTER_AUTH_SECRET;
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error(
      'BETTER_AUTH_SECRET must be set and at least 32 characters. Generate one with: npx auth@latest secret',
    );
  }

  const baseUrl = config.BETTER_AUTH_URL;
  if (typeof baseUrl !== 'string' || baseUrl.length === 0) {
    throw new Error('BETTER_AUTH_URL must be set (e.g. http://localhost:3000)');
  }

  try {
    new URL(baseUrl);
  } catch {
    throw new Error('BETTER_AUTH_URL must be a valid URL');
  }
}
