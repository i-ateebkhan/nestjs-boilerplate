import {
	Injectable,
	Logger,
	type CallHandler,
	type ExecutionContext,
	type NestInterceptor,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { tap, type Observable } from 'rxjs';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
	private readonly logger = new Logger(LoggerInterceptor.name);

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const startTime = Date.now();
		const request = context.switchToHttp().getRequest<FastifyRequest>();
		const response = context.switchToHttp().getResponse<FastifyReply>();

		const { method, url, ip } = request;

		return next.handle().pipe(
			tap({
				next: (res) => {
					const endTime = Date.now();
					const duration = endTime - startTime;
					const statusCode = (res as { status: number }).status;
					const message = (res as { message: string }).message;

					this.logger.log(`${method} ${url} - ${statusCode} - ${duration}ms - ${ip} - Message: ${message}`);
				},
				error: (error) => {
					const endTime = Date.now();
					const duration = endTime - startTime;
					const statusCode = error.status || response.statusCode || 500;

					this.logger.error(
						`${method} ${url} - ${statusCode} - ${duration}ms - ${ip} - Error: ${error.message}`,
					);
				},
			}),
		);
	}
}
