import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('traffic')
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('advice')
  async getAdvice(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('lightId') lightId: string
  ) {
    return this.appService.calculateSpeed(Number(lat), Number(lng), Number(lightId));
  }
}