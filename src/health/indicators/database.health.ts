import { PrismaService } from '@/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { HealthIndicatorService, type HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicatorService {
	constructor(private readonly prisma: PrismaService) {
		super();
	}

	async isHealthy(key: string): Promise<HealthIndicatorResult> {
		const indicator = this.check(key);
		try {
			await this.prisma.$queryRaw`SELECT 1`;

			return indicator.up({
				database: 'connected',
				connection: true,
			});
		} catch (error) {
			return indicator.down({
				database: 'disconnected',
				error: (error as Error).message,
			});
		}
	}
}
