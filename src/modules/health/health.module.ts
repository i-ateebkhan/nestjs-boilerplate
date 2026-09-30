import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { MemoryHealthIndicator } from './indicators/memory.health';
import { DatabaseHealthIndicator } from './indicators/database.health';

@Module({
	imports: [TerminusModule],
	controllers: [HealthController],
	providers: [MemoryHealthIndicator, DatabaseHealthIndicator],
})
export class HealthModule {}
