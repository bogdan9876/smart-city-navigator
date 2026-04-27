import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TrafficService } from './traffic.service';
import { TrafficQueryDto } from './dto/traffic-query.dto';
import { AnalyseRouteDto } from './dto/analyse-route.dto';

@ApiTags('Traffic')
@Controller('traffic')
export class TrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  /**
   * Main endpoint — client sends pre-built Mapbox coords.
   * Server analyses traffic lights on the given route and returns
   * green-wave recommendation. No internal routing call is made.
   */
  @Post('analyse')
  @ApiOperation({ summary: 'Аналіз світлофорів на готовому маршруті (Mapbox coords)' })
  @ApiResponse({ status: 200, description: 'Результат аналізу світлофорів' })
  @ApiResponse({ status: 400, description: 'Невірний формат координат' })
  analyseRoute(@Body() dto: AnalyseRouteDto) {
    return this.trafficService.analyseRoute(dto.coords, dto.totalDistanceMeters);
  }

  /**
   * @deprecated Use POST /traffic/analyse instead.
   * Kept for backward compatibility — builds route via OSRM internally.
   */
  @Get('advice')
  @ApiOperation({ summary: '[Deprecated] Отримати рекомендацію через OSRM' })
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
