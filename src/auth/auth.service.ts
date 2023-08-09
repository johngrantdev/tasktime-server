import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async generateTokens(user: { _id: string; email: string }) {
    const payload = { _id: user._id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  extractPayload(token: string): any {
    return this.jwtService.decode(token);
  }

  async validateUser(email: string) {
    return await this.usersService.getUserByEmail(email);
  }
}
