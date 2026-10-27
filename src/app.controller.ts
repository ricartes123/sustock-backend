import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { APP_ROUTES } from './app.routes';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get(APP_ROUTES.HEALTH.ROOT)
  checkHealth() {
    return this.appService.checkHealth();
  }
}
