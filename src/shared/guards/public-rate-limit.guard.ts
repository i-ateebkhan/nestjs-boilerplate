import { Injectable, type ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerStorage, type ThrottlerModuleOptions } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PublicRateLimitGuard extends ThrottlerGuard {
	constructor(
		options: ThrottlerModuleOptions,
		storageService: ThrottlerStorage,
		reflector: Reflector,
		private readonly reflectorService: Reflector,
	) {
		super(options, storageService, reflector);
	}

	override async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflectorService.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!isPublic) return true;
		return super.canActivate(context);
	}
}
