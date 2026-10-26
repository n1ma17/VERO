import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../../lib/database/pg-error.js';
import { PgService } from '../../lib/database/pg.service.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

const PUBLIC_USER_COLUMNS =
  '"id", "name", "email", "emailVerified", "image", "username", "role", "status", "createdAt", "updatedAt"';

export interface PublicUserRow {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  username: string | null;
  role: 'ADMIN' | 'USER';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly pg: PgService) {}

  async getProfile(userId: string): Promise<PublicUserRow> {
    const { rows } = await this.pg.query<PublicUserRow>(
      `SELECT ${PUBLIC_USER_COLUMNS} FROM "users" WHERE "id" = $1`,
      [userId],
    );

    const user = rows[0];
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getById(
    requesterId: string,
    targetId: string,
  ): Promise<PublicUserRow> {
    if (requesterId !== targetId) {
      throw new ForbiddenException('You can only view your own profile');
    }
    return this.getProfile(targetId);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<PublicUserRow> {
    if (dto.username) {
      const { rows } = await this.pg.query(
        'SELECT 1 FROM "users" WHERE "username" = $1 AND "id" <> $2 LIMIT 1',
        [dto.username, userId],
      );
      if (rows.length > 0) {
        throw new ConflictException('Username is already taken');
      }
    }

    const assignments: string[] = [];
    const values: unknown[] = [];

    if (dto.name !== undefined) {
      values.push(dto.name);
      assignments.push(`"name" = $${values.length}`);
    }
    if (dto.username !== undefined) {
      values.push(dto.username);
      assignments.push(`"username" = $${values.length}`);
    }

    if (assignments.length === 0) {
      return this.getProfile(userId);
    }

    values.push(userId);

    let user: PublicUserRow | undefined;
    try {
      const { rows } = await this.pg.query<PublicUserRow>(
        `UPDATE "users"
            SET ${assignments.join(', ')}
          WHERE "id" = $${values.length}
      RETURNING ${PUBLIC_USER_COLUMNS}`,
        values,
      );
      user = rows[0];
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Username is already taken');
      }
      throw error;
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
