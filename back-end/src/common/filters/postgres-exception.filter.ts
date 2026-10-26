import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Response } from 'express';
import { BadRequestException } from '@nestjs/common';
import { isClientSqlError, isPgError, isUniqueViolation } from '../../lib/database/pg-error.js';

@Catch()
export class PostgresExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(exception.getResponse());
      return;
    }

    if (isUniqueViolation(exception)) {
      const conflict = new ConflictException('That record already exists');
      response.status(conflict.getStatus()).json(conflict.getResponse());
      return;
    }

    if (isClientSqlError(exception) && isPgError(exception)) {
      const bad = new BadRequestException(exception.message);
      response.status(bad.getStatus()).json(bad.getResponse());
      return;
    }

    const fallback = new InternalServerErrorException('Unexpected server error');
    response.status(fallback.getStatus()).json(fallback.getResponse());
  }
}
