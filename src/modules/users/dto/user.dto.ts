import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export abstract class UserUpdateDto {
	@ApiProperty()
	@IsString()
	@Length(2, 30)
	fullName: string;
}

export abstract class ChangePasswordDto {
	@ApiProperty()
	@IsString()
	oldPassword: string;

	@ApiProperty()
	@IsString()
	@Length(8, 32)
	newPassword: string;

	@ApiProperty()
	@IsString()
	confirmPassword: string;
}
