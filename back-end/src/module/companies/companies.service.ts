import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { parseLogoDataUrl } from '../../common/money/logo.js';
import { isUniqueViolation } from '../../lib/database/pg-error.js';
import { PgService } from '../../lib/database/pg.service.js';
import type { SaveCompanyDto } from './dto/save-company.dto.js';

export type CompanyDto = {
  id: string;
  name: string;
  hasLogo: boolean;
  createdAt: string;
};

type CompanyRow = {
  id: string;
  name: string;
  created_at: Date | string;
  has_logo: boolean;
};

const COMPANY_SELECT = `
  SELECT
    c.id,
    c.name,
    c.created_at,
    (l.company_id IS NOT NULL) AS has_logo
  FROM companies AS c
  LEFT JOIN company_logos AS l ON l.company_id = c.id
`;

function mapCompany(row: CompanyRow): CompanyDto {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at);
  return {
    id: row.id,
    name: row.name,
    hasLogo: row.has_logo,
    createdAt,
  };
}

@Injectable()
export class CompaniesService {
  constructor(private readonly pg: PgService) {}

  async list(userId: string): Promise<CompanyDto[]> {
    const { rows } = await this.pg.query<CompanyRow>(
      `${COMPANY_SELECT}
       WHERE c.user_id = $1
       ORDER BY lower(c.name), c.created_at`,
      [userId],
    );
    return rows.map(mapCompany);
  }

  async getById(userId: string, id: string): Promise<CompanyDto> {
    const { rows } = await this.pg.query<CompanyRow>(
      `${COMPANY_SELECT}
       WHERE c.user_id = $1 AND c.id = $2`,
      [userId, id],
    );
    const company = rows[0];
    if (!company) throw new NotFoundException('Company not found');
    return mapCompany(company);
  }

  async create(userId: string, dto: SaveCompanyDto): Promise<CompanyDto> {
    const name = dto.name.trim();
    try {
      const { rows } = await this.pg.query<{ id: string }>(
        `INSERT INTO companies (user_id, name)
         VALUES ($1, $2)
         RETURNING id`,
        [userId, name],
      );
      const id = rows[0].id;
      if (dto.logoUrl) await this.upsertLogo(id, dto.logoUrl);
      return this.getById(userId, id);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('A company with this name already exists.');
      }
      throw error;
    }
  }

  async update(userId: string, id: string, dto: SaveCompanyDto): Promise<CompanyDto> {
    const name = dto.name.trim();
    try {
      const { rowCount } = await this.pg.query(
        `UPDATE companies
            SET name = $3
          WHERE user_id = $1 AND id = $2`,
        [userId, id, name],
      );
      if (!rowCount) throw new NotFoundException('Company not found');
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('A company with this name already exists.');
      }
      throw error;
    }

    if (dto.logoUrl) await this.upsertLogo(id, dto.logoUrl);
    else if (dto.logoUrl === null) {
      await this.pg.query('DELETE FROM company_logos WHERE company_id = $1', [id]);
    }

    return this.getById(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { rowCount } = await this.pg.query(
      'DELETE FROM companies WHERE user_id = $1 AND id = $2',
      [userId, id],
    );
    if (!rowCount) throw new NotFoundException('Company not found');
  }

  async getLogo(
    userId: string,
    id: string,
  ): Promise<{ mediaType: string; bytes: Buffer }> {
    const { rows } = await this.pg.query<{ media_type: string; bytes: Buffer }>(
      `SELECT l.media_type, l.bytes
         FROM company_logos AS l
         JOIN companies AS c ON c.id = l.company_id
        WHERE c.user_id = $1 AND c.id = $2`,
      [userId, id],
    );
    const logo = rows[0];
    if (!logo) throw new NotFoundException('Logo not found');
    return { mediaType: logo.media_type, bytes: logo.bytes };
  }

  private async upsertLogo(companyId: string, dataUrl: string): Promise<void> {
    const logo = parseLogoDataUrl(dataUrl);
    await this.pg.query(
      `INSERT INTO company_logos (company_id, media_type, bytes)
       VALUES ($1, $2, $3)
       ON CONFLICT (company_id) DO UPDATE
          SET media_type = EXCLUDED.media_type,
              bytes = EXCLUDED.bytes`,
      [companyId, logo.mediaType, logo.bytes],
    );
  }
}
