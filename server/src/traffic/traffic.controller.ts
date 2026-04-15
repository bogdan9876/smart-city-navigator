import { Controller, Get, Query } from '@nestjs/common';
import { TrafficService } from './traffic.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@ApiTags('Traffic')
@Controller('traffic')
export class TrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  @Get('advice')
  @ApiOperation({ summary: 'Отримати рекомендацію швидкості (Traffic Advice)' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lng', type: Number })
  @ApiQuery({ name: 'destLat', type: Number })
  @ApiQuery({ name: 'destLng', type: Number })
  @ApiResponse({ status: 200, description: 'Успішне отримання рекомендацій' })
  async getAdvice(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('destLat') destLat: string,
    @Query('destLng') destLng: string,
  ) {
    return this.trafficService.getTrafficAdvice(
      Number(lat),
      Number(lng),
      Number(destLat),
      Number(destLng),
    );
  }
}
