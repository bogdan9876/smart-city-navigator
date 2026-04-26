import { Injectable } from '@nestjs/common';
import { RoutingService } from './routing.service';
import { TrafficLightService } from './traffic-light.service';

@Injectable()
export class TrafficService {
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

    const lightsOnRoute = this.trafficLightService.findAllLightsOnRoute(coords);

    if (lightsOnRoute.length === 0) {
      return {
        hasLight: false,
        routeCoords: coords,
        distanceMeters: Math.round(distanceMeters),
      };
    }

    const wave = this.trafficLightService.calculateGreenWave(lightsOnRoute);
    const first = wave.lightsAhead[0];

    return {
      hasLight: true,
      routeCoords: coords,
      distanceMeters: Math.round(distanceMeters),

      // Legacy single-light fields point to the closest light:
      distanceToLight: Math.round(first.distanceMeters),
      phase: first.phaseAtArrival,
      timeLeft: first.timeLeftAtArrival,
      recommendedSpeedKmh: wave.recommendedSpeedKmh,
      targetLight: first.light,

      // Green-wave additions:
      lightsAhead: wave.lightsAhead.map((l) => ({
        light: l.light,
        distanceMeters: Math.round(l.distanceMeters),
        phaseAtArrival: l.phaseAtArrival,
        timeLeftAtArrival: l.timeLeftAtArrival,
      })),
      greenCount: wave.greenCount,
    };
  }
}
