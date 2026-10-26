import type { ConfigService } from '@nestjs/config';

export type ArcjetRuleMode = 'DRY_RUN' | 'LIVE';

const VALID_MODES = new Set<ArcjetRuleMode>(['DRY_RUN', 'LIVE']);

/**
 * Resolves Arcjet rule mode from env. Defaults to DRY_RUN outside production
 * so local traffic is not blocked while rules are tuned.
 */
export function arcjetRuleMode(config: ConfigService): ArcjetRuleMode {
  const explicit =
    config.get<string>('ARCJET_MODE') ??
    config.get<string>('ARCJET_RULE_MODE');

  if (explicit && VALID_MODES.has(explicit as ArcjetRuleMode)) {
    return explicit as ArcjetRuleMode;
  }

  if (config.get<string>('ARCJET_ENV') === 'development') {
    return 'DRY_RUN';
  }

  if (config.get<string>('NODE_ENV') !== 'production') {
    return 'DRY_RUN';
  }

  return 'LIVE';
}
