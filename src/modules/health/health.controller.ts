import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheckService, MemoryHealthIndicator, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '@/database/prisma.service';
import { ResponseMessage } from '@/common/response';
import { Public } from '@/modules/auth/auth.decorators';

const MB = 1024 * 1024;

@ApiTags('Health')
@Controller('health')
export class HealthController {
	constructor(
		private readonly health: HealthCheckService,
		private readonly memory: MemoryHealthIndicator,
		private readonly database: PrismaHealthIndicator,
		private readonly prisma: PrismaService,
	) {}

	@Get('readiness')
	@Public()
	readinessHandler() {}

	@Get()
	@Public()
	@ResponseMessage('Healthy')
	async checkHealthHandler() {
		const result = await this.health.check([
			() => this.memory.checkHeap('memory_heap', 512 * MB),
			() => this.memory.checkRSS('memory_rss', 1024 * MB),
			() => this.database.pingCheck('database', this.prisma),
		]);
		return result.details;
	}
}
