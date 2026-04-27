import { Injectable } from '@nestjs/common';
import { RoutingService } from './routing.service';
import { TrafficLightService } from './traffic-light.service';
import { getDistance } from '../../common/utils/geo.util';

@Injectable()
export class TrafficService {
  constructor(
    private readonly routingService: RoutingService,
    private readonly trafficLightService: TrafficLightService,
  ) {}

  // ── Legacy: builds route via OSRM (kept for reference) ────────────────────
  async getTrafficAdvice(
    userLat: number,
    userLng: number,
    destLat: number,
    destLng: number,
  ) {
    const { distanceMeters, coords } = await this.routingService.getRoute(
      userLat, userLng, destLat, destLng,
    );
    return this.buildResponse(coords, distanceMeters);
  }

  // ── New: accepts pre-built Mapbox coords, no OSRM call ────────────────────
  analyseRoute(
    coords: [number, number][],
    totalDistanceMeters?: number,
  ) {
    // If Mapbox already gave us the distance — use it. Otherwise compute from coords.
    const distanceMeters = totalDistanceMeters ?? this.calcDistanceFromCoords(coords);
    return this.buildResponse(coords, distanceMeters);
  }

  // ── Shared response builder ────────────────────────────────────────────────
  private buildResponse(coords: [number, number][], distanceMeters: number) {
    const lightsOnRoute = this.trafficLightService.findAllLightsOnRoute(coords);

    if (lightsOnRoute.length === 0) {
      return {
        hasLight: false,
        distanceMeters: Math.round(distanceMeters),
      };
    }

    const wave = this.trafficLightService.calculateGreenWave(lightsOnRoute);
    const first = wave.lightsAhead[0];

    return {
      hasLight: true,
      distanceMeters: Math.round(distanceMeters),
      distanceToLight: Math.round(first.distanceMeters),
      phase: first.phaseAtArrival,
      timeLeft: first.timeLeftAtArrival,
      recommendedSpeedKmh: wave.recommendedSpeedKmh,
      targetLight: first.light,
      lightsAhead: wave.lightsAhead.map((l) => ({
        light: l.light,
        distanceMeters: Math.round(l.distanceMeters),
        phaseAtArrival: l.phaseAtArrival,
        timeLeftAtArrival: l.timeLeftAtArrival,
      })),
      greenCount: wave.greenCount,
    };
  }

  private calcDistanceFromCoords(coords: [number, number][]): number {
    let total = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      total += getDistance(
        coords[i][1], coords[i][0],
        coords[i + 1][1], coords[i + 1][0],
      );
    }
    return total;
  }
}

