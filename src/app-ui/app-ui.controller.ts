import { Controller, Get, Param, Res } from '@nestjs/common';
import { AppUiService } from './app-ui.service';
import { SkipAuth } from 'src/shared/decorators/SkipAuth.decorator';

@Controller()
export class AppUiController {
  constructor(private readonly appUiService: AppUiService) {}

  // Catch-all route for the protected app
  @Get('app*')
  serveProtectedApp(@Res() res, @Param('0') path?: string): void {
    this.appUiService.serveApp(res, 'protected', path);
  }

  // Catch-all route for the public app
  // perhaps serve static is faster to serve the public site?
  // assuming it will avoid the guards and middleware
  // or can the middleware help with security?
  @SkipAuth()
  @Get('*')
  servePublicApp(@Res() res, @Param('0') path?: string): void {
    this.appUiService.serveApp(res, 'public', path);
  }
}
