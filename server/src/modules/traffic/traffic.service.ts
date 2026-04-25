import { Injectable, Logger } from '@nestjs/common';
import { RoutingService } from './routing.service';
import { TrafficLightService } from './traffic-light.service';

@Injectable()
export class TrafficService {
  private readonly logger = new Logger(TrafficService.name);

  constructor(
    private readonly routingService: RoutingService,
    private readonly trafficLightService: TrafficLightService,
  ) {}

  async getTrafficAdvice(
    userLat: number,
    userLng: number,
    destLat: number,
    destLng: number,
  ) {
    const { distanceMeters, coords } = await this.routingService.getRoute(
      userLat, userLng, destLat, destLng,
    );

    const lightInfo = this.trafficLightService.findNearestLightOnRoute(coords);

    if (!lightInfo) {
      return {
        hasLight: false,
        routeCoords: coords,
        distanceMeters: Math.round(distanceMeters),
      };
    }

    const distanceToLight = this.trafficLightService.calculateDistanceToLight(
      coords,
      lightInfo.idx,
    );

    const phaseInfo = this.trafficLightService.calculateLightPhaseAndSpeed(
      lightInfo.light,
      distanceToLight,
    );

    return {
      hasLight: true,
      routeCoords: coords,
      distanceMeters: Math.round(distanceMeters),
      distanceToLight: Math.round(distanceToLight),
      phase: phaseInfo.phase,
      timeLeft: phaseInfo.timeLeft,
      recommendedSpeedKmh: phaseInfo.recommendedSpeedKmh,
      targetLight: lightInfo.light,
    };
  }
}
