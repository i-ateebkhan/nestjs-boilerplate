import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export abstract class UserUpdateDto {
	@ApiProperty()
	@IsString()
	@Length(2, 30)
	fullName: string;
}
