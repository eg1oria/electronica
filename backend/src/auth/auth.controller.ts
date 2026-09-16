import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AdminOnly } from './admin.decorator';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import type { AuthUser } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @AdminOnly()
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
