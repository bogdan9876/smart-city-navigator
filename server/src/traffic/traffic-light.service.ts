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
    const MAX_SPEED_KMH = 60;
    const now = Date.now();
    const cycleMs = (light.green + light.red) * 1000;
    const elapsed = (now - light.start) % cycleMs;
    const isGreen = elapsed < light.green * 1000;

    type Window = { start: number; end: number };
    const windows: Window[] = [];

    if (isGreen) {
      const remainingGreen = (light.green * 1000 - elapsed) / 1000;
      windows.push({ start: 0, end: remainingGreen });
      for (let n = 1; n <= 5; n++) {
        const s = remainingGreen + light.red + (n - 1) * (light.green + light.red);
        windows.push({ start: s, end: s + light.green });
      }
    } else {
      const timeToGreen = (cycleMs - elapsed) / 1000;
      for (let n = 0; n <= 5; n++) {
        const s = timeToGreen + n * (light.green + light.red);
        windows.push({ start: s, end: s + light.green });
      }
    }

    for (const win of windows) {
      const targetTime = win.start === 0 ? win.end : win.start;
      const speedKmh = Math.round((distanceToLightMeters / targetTime) * 3.6);
      if (speedKmh <= MAX_SPEED_KMH) {
        return {
          phase: isGreen ? 'GREEN' : 'RED',
          timeLeft: Math.round(targetTime),
          recommendedSpeedKmh: speedKmh,
        };
      }
    }

    const last = windows[windows.length - 1];
    const fallbackTime = last.start === 0 ? last.end : last.start;
    return {
      phase: isGreen ? 'GREEN' : 'RED',
      timeLeft: Math.round(fallbackTime),
      recommendedSpeedKmh: Math.min(MAX_SPEED_KMH, Math.round((distanceToLightMeters / fallbackTime) * 3.6)),
    };
  }
}
