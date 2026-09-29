import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import { ResponseMapper } from '../mappers/response.map';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		return next.handle().pipe(
			map((data) => {
				if (data instanceof ResponseMapper) {
					const httpResponse = context.switchToHttp().getResponse();
					httpResponse.status(data.status);

					return data.toJSON();
				}

				return data;
			}),
		);
	}
}
