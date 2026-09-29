import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpService } from './services/http.service';
import { CommonService } from './services/common.service';
import { RedisService } from './services/redis.service';

@Global()
@Module({
	imports: [HttpModule],
	providers: [CommonService, HttpService, RedisService],
	exports: [CommonService, HttpService, RedisService],
})
export class SharedModule {}
