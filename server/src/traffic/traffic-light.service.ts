import { Injectable } from '@nestjs/common';
import { trafficLights, TrafficLight } from './data/lights.data';
import { getDistance } from '../utils/geo.util';

@Injectable()
export class TrafficLightService {
  findNearestLightOnRoute(
    coords: [number, number][],
  ): { light: TrafficLight; idx: number } | null {
    let lightOnRoute: TrafficLight | null = null;
    let lightIndex = -1;

    for (const light of trafficLights) {
      for (let i = 0; i < coords.length; i++) {
        const isNear =
          getDistance(coords[i][1], coords[i][0], light.lat, light.lng) < 60;
        if (isNear) {
          lightOnRoute = light;
          lightIndex = i;
          break;
        }
      }
      if (lightOnRoute) break;
    }

    if (!lightOnRoute) return null;
    return { light: lightOnRoute, idx: lightIndex };
  }

  calculateDistanceToLight(
    coords: [number, number][],
    lightIndex: number,
  ): number {
    let distanceToLight = 0;
    for (let i = 0; i < lightIndex; i++) {
      distanceToLight += getDistance(
        coords[i][1],
        coords[i][0],
        coords[i + 1][1],
        coords[i + 1][0],
      );
    }
    return distanceToLight;
  }

  calculateLightPhaseAndSpeed(
    light: TrafficLight,
    distanceToLightMeters: number,
  ) {
    const now = Date.now();
    const cycle = (light.green + light.red) * 1000;
    const elapsed = (now - light.start) % cycle;
    const isGreen = elapsed < light.green * 1000;
    const timeLeft = isGreen
      ? (light.green * 1000 - elapsed) / 1000
      : (cycle - elapsed) / 1000;

    const speedMps = distanceToLightMeters / timeLeft;
    const recommendedSpeedKmh = Math.round(speedMps * 3.6);

    return {
      phase: isGreen ? 'GREEN' : 'RED',
      timeLeft: Math.round(timeLeft),
      recommendedSpeedKmh,
    };
  }
}
