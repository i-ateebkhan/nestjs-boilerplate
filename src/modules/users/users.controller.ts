import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '@/common/response';
import { CurrentUser } from '@/modules/auth/auth.decorators';
import { UsersService } from './users.service';
import { UserUpdateDto } from './users.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get('me')
	@ResponseMessage('Profile fetched')
	getProfileHandler(@CurrentUser() userId: string) {
		return this.usersService.getProfile(userId);
	}

	@Put('me')
	@ResponseMessage('User updated')
	async profileUpdateHandler(@CurrentUser() userId: string, @Body() body: UserUpdateDto) {
		await this.usersService.updateProfile(userId, { fullName: body.fullName });
	}
}
