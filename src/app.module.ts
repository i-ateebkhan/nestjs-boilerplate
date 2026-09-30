import { Module, type ExecutionContext } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './database/prisma.module';
import { UserModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AuthGuard } from './shared/guards/auth.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { env } from './config/env.config';
import { SentryModule } from '@sentry/nestjs/setup';
import { IS_PUBLIC_KEY } from './shared/decorators/public.decorator';
import type { FastifyRequestWithUser } from './shared/decorators/current-user.decorator';

const reflector = new Reflector();
const isPublic = (context: ExecutionContext) =>
	reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]) ?? false;

@Module({
	imports: [
		SentryModule.forRoot(),
		ThrottlerModule.forRoot({
			storage: env.REDIS_URL ? new ThrottlerStorageRedisService(env.REDIS_URL) : undefined,
			throttlers: [
				{
					name: 'public',
					ttl: env.RATE_LIMIT_TTL,
					limit: env.RATE_LIMIT_MAX,
					skipIf: (context) => !isPublic(context),
				},
				{
					name: 'user',
					ttl: env.RATE_LIMIT_TTL,
					limit: env.RATE_LIMIT_USER_MAX,
					skipIf: isPublic,
					getTracker: (req) => (req as FastifyRequestWithUser).user.id,
				},
			],
		}),
		SharedModule,
		PrismaModule,
		HealthModule,
		UserModule,
		AuthModule,
	],
	providers: [
		{ provide: APP_GUARD, useClass: AuthGuard },
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
	],
})
export class AppModule {}
