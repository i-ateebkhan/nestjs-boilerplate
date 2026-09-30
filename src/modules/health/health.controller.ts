import { Controller, Get, HttpStatus } from '@nestjs/common';
import { HealthCheckService } from '@nestjs/terminus';
import { MemoryHealthIndicator } from './indicators/memory.health';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { ApiTags } from '@nestjs/swagger';
import { ResponseMapper } from '@/shared/mappers/response.map';
import { CommonService } from '@/shared/services/common.service';
import { Public } from '@/shared/decorators/public.decorator';

@ApiTags('Health')
@Controller('/api/health')
export class HealthController {
	constructor(
		private readonly health: HealthCheckService,
		private readonly memoryIndicator: MemoryHealthIndicator,
		private readonly databaseIndicator: DatabaseHealthIndicator,
		private readonly commonService: CommonService,
	) {}

	@Get('/readiness')
	@Public()
	readinessHandler() {
		return ResponseMapper.map();
	}

	@Get()
	@Public()
	async checkHealthHandler() {
		const response = await this.health.check([
			() => this.memoryIndicator.isHealthy('memory'),
			() => this.databaseIndicator.isHealthy('database'),
		]);
		if (!this.commonService.isEmptyObject(response.error || {}))
			return ResponseMapper.map({
				message: 'UnHealthy',
				data: response.error,
				status: HttpStatus.SERVICE_UNAVAILABLE,
			});
		return ResponseMapper.map({ message: 'Healthy', data: response.details });
	}
}
