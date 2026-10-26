import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PgService } from '../../lib/database/pg.service.js';
import { UsersService, type PublicUserRow } from './users.service.js';

const USER_ROW: PublicUserRow = {
  id: 'user-a',
  name: 'Old Name',
  email: 'a@example.com',
  emailVerified: true,
  image: null,
  username: null,
  role: 'USER',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersService', () => {
  let service: UsersService;
  const pg = { query: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PgService, useValue: pg }],
    }).compile();

    service = module.get(UsersService);
  });

  it('forbids viewing another user profile', async () => {
    await expect(service.getById('user-a', 'user-b')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('returns the profile for the requesting user', async () => {
    pg.query.mockResolvedValue({ rows: [USER_ROW] });

    await expect(service.getById('user-a', 'user-a')).resolves.toEqual(
      USER_ROW,
    );
  });

  it('updates only allowed profile fields', async () => {
    pg.query.mockResolvedValueOnce({ rows: [{ ...USER_ROW, name: 'New Name' }] });

    const result = await service.updateProfile('user-a', { name: 'New Name' });

    expect(pg.query).toHaveBeenCalledTimes(1);
    const [sql, values] = pg.query.mock.calls[0] as [string, unknown[]];

    expect(sql).toMatch(/^UPDATE "users"\s+SET "name" = \$1\s+WHERE "id" = \$2/);

    const setClause = sql.slice(sql.indexOf('SET'), sql.indexOf('WHERE'));
    for (const blocked of ['"email"', '"role"', '"status"', '"emailVerified"']) {
      expect(setClause).not.toContain(blocked);
    }

    expect(values).toEqual(['New Name', 'user-a']);
    expect(result.name).toBe('New Name');
  });

  it('rejects a username that belongs to someone else', async () => {
    pg.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    await expect(
      service.updateProfile('user-a', { username: 'taken_name' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(pg.query).toHaveBeenCalledTimes(1);
  });

  it('does not write when the request changes nothing', async () => {
    pg.query.mockResolvedValueOnce({ rows: [USER_ROW] });

    await expect(service.updateProfile('user-a', {})).resolves.toEqual(USER_ROW);
    expect(pg.query.mock.calls[0]?.[0]).toMatch(/^SELECT /);
  });
});
