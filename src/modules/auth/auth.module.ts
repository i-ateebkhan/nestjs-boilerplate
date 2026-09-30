import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '@/modules/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

@Module({
	imports: [UsersModule, JwtModule],
	controllers: [AuthController],
	providers: [AuthService, SessionService],
	exports: [AuthService],
})
export class AuthModule {}
