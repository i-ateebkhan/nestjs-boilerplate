import { Injectable } from '@nestjs/common';
import { HealthIndicatorService, type HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class MemoryHealthIndicator extends HealthIndicatorService {
	async isHealthy(key: string): Promise<HealthIndicatorResult> {
		const memoryUsage = process.memoryUsage();
		const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
		const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
		const rssMB = Math.round(memoryUsage.rss / 1024 / 1024);

		// Define memory thresholds (adjust based on your needs)
		const maxHeapUsed = 512; // MB
		const maxRSS = 1024; // MB

		const isMemoryHealthy = heapUsedMB < maxHeapUsed && rssMB < maxRSS;
		const indicator = this.check(key);

		if (isMemoryHealthy)
			return indicator.up({
				heapUsed: `${heapUsedMB}MB`,
				heapTotal: `${heapTotalMB}MB`,
				rss: `${rssMB}MB`,
				external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
			});

		return indicator.down({
			heapUsed: `${heapUsedMB}MB`,
			heapTotal: `${heapTotalMB}MB`,
			rss: `${rssMB}MB`,
			external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
		});
	}
}
