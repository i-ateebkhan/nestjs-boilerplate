import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export abstract class PaginationDTO {
	@ApiProperty({
		default: 1,
		example: 1,
		description: 'Page number for pagination',
	})
	@IsNumber()
	readonly page: number;

	@ApiProperty({
		default: 10,
		example: 10,
		description: 'Number of items per page',
	})
	@IsNumber()
	readonly limit: number;
}
