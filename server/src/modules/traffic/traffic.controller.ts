import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TrafficService } from './traffic.service';
import { TrafficQueryDto } from './dto/traffic-query.dto';

@ApiTags('Traffic')
@Controller('traffic')
export class TrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  @Get('advice')
  @ApiOperation({ summary: 'Отримати рекомендацію швидкості на маршруті' })
  @ApiResponse({ status: 200, description: 'Рекомендація з урахуванням найближчого світлофора' })
  @ApiResponse({ status: 400, description: 'Невірні параметри координат' })
  getAdvice(@Query() query: TrafficQueryDto) {
    return this.trafficService.getTrafficAdvice(
      query.lat,
      query.lng,
      query.destLat,
      query.destLng,
    );
  }
}
