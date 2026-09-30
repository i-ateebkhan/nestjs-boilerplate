import { Catch, HttpException, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import type { FastifyReply } from 'fastify';
import { envelope } from './response';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	@SentryExceptionCaptured()
	catch(exception: unknown, host: ArgumentsHost) {
		const reply = host.switchToHttp().getResponse<FastifyReply>();
		const status =
			exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
		return reply.status(status).send(envelope(status, this.messageOf(exception)));
	}

	private messageOf(exception: unknown): string {
		if (exception instanceof ThrottlerException) return 'Too Many Request';
		if (!(exception instanceof HttpException)) return 'INTERNAL_SERVER_ERROR';

		const response = exception.getResponse();
		if (typeof response === 'string') return response;
		const message = (response as { message?: unknown }).message;
		if (Array.isArray(message)) return String(message[0]);
		return typeof message === 'string' ? message : exception.message;
	}
}
