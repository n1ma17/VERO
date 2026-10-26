import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
} from 'pg';

/**
 * The single PostgreSQL connection pool for the whole application.
 *
 * `pool` is exposed deliberately: Better Auth shares this exact pool instead of
 * opening its own (see `src/lib/auth/auth.config.ts`).
 */
@Injectable()
export class PgService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgService.name);

  readonly pool: Pool;

  constructor(config: ConfigService) {
    this.pool = new Pool({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
      max: 20,
      idleTimeoutMillis: 30_000,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.pool.query('SELECT 1');
    this.logger.log('PostgreSQL pool ready');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<R>> {
    return this.pool.query<R>(text, values);
  }

  /**
   * Runs `fn` on one dedicated connection inside a transaction.
   *
   * Never issue BEGIN/COMMIT through `query()` — a pool hands out a different
   * connection per call, so the BEGIN and the COMMIT would land on different
   * sessions and the transaction would silently not exist.
   */
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
