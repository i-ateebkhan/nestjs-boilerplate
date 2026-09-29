import { Sse, type MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';

export function SseStream(route?: string) {
	return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;
		descriptor.value = function (...args: unknown[]) {
			const generator = originalMethod.apply(this, args);

			return new Observable<MessageEvent>((observer) => {
				(async () => {
					try {
						for await (const value of generator) {
							observer.next({ data: value });
						}
						observer.complete();
					} catch (error) {
						observer.error(error);
					}
				})();
			});
		};
		Sse(route)(target, propertyKey, descriptor);
		return descriptor;
	};
}
