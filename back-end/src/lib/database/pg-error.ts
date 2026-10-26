const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';
const CHECK_VIOLATION = '23514';
const NOT_NULL_VIOLATION = '23502';
const RAISE_EXCEPTION = 'P0001';

export type PgErrorLike = {
  code: string;
  message: string;
};

export function isPgError(error: unknown): error is PgErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

export function isUniqueViolation(error: unknown): boolean {
  return isPgError(error) && error.code === UNIQUE_VIOLATION;
}

export function isClientSqlError(error: unknown): boolean {
  if (!isPgError(error)) return false;
  return (
    error.code === UNIQUE_VIOLATION ||
    error.code === FOREIGN_KEY_VIOLATION ||
    error.code === CHECK_VIOLATION ||
    error.code === NOT_NULL_VIOLATION ||
    error.code === RAISE_EXCEPTION
  );
}
