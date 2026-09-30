import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyReply } from 'fastify';
import { map, type Observable } from 'rxjs';
import { envelope, RESPONSE_MESSAGE_KEY } from './response';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
	constructor(private readonly reflector: Reflector) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const message = this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ?? 'Success';
		const reply = context.switchToHttp().getResponse<FastifyReply>();
		return next.handle().pipe(map((data) => envelope(reply.statusCode, message, data ?? null)));
	}
}
