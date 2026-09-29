import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './database/prisma.module';
import { UserModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './shared/guards/auth.guard';
import { PublicRateLimitGuard } from './shared/guards/public-rate-limit.guard';
import { ThrottlerModule } from '@nestjs/throttler';
import { env } from './config/env.config';

@Module({
	imports: [
		ThrottlerModule.forRoot([
			{
				name: 'public',
				ttl: env.RATE_LIMIT_TTL,
				limit: env.RATE_LIMIT_MAX,
			},
		]),
		SharedModule,
		PrismaModule,
		HealthModule,
		UserModule,
		AuthModule,
	],
	providers: [
		{ provide: APP_GUARD, useClass: AuthGuard },
		{ provide: APP_GUARD, useClass: PublicRateLimitGuard },
	],
})
export class AppModule {}
