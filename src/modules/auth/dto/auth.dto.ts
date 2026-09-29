import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export abstract class SigninDto {
	@ApiProperty({
		example: 'user@example.com',
		description: 'User email',
	})
	@IsEmail()
	email: string;

	@ApiProperty({
		example: 'password123',
		description: 'User password',
	})
	@IsString()
	@Length(8, 32)
	password: string;
}

export abstract class SignupDto extends SigninDto {
	@ApiProperty({
		example: 'John Doe',
		description: 'Full name of the user',
	})
	@IsString()
	@Length(2, 30)
	fullName: string;
}

export abstract class RefreshAccessDto {
	@ApiProperty({
		example:
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
		description: 'Refresh token',
	})
	@IsString()
	@Length(100, 500)
	@IsOptional()
	refreshToken?: string;
}
