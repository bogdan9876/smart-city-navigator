import { Injectable } from '@nestjs/common';
import { trafficLights } from './data/lights.data';
import { getDistance } from '../../common/utils/geo.util';
import {
  LightOnRouteResult,
  LightPhaseResult,
  TrafficLight,
} from './interfaces/traffic-light.interface';

const MAX_SPEED_KMH = 60;
const LIGHT_PROXIMITY_METERS = 60;
const LOOKAHEAD_WINDOWS = 5;

@Injectable()
export class TrafficLightService {
  findNearestLightOnRoute(coords: [number, number][]): LightOnRouteResult | null {
    for (const light of trafficLights) {
      for (let i = 0; i < coords.length; i++) {
        const dist = getDistance(coords[i][1], coords[i][0], light.lat, light.lng);
        if (dist < LIGHT_PROXIMITY_METERS) {
          return { light, idx: i };
        }
      }
    }
    return null;
  }

  calculateDistanceToLight(coords: [number, number][], lightIndex: number): number {
    let total = 0;
    for (let i = 0; i < lightIndex; i++) {
      total += getDistance(
        coords[i][1], coords[i][0],
        coords[i + 1][1], coords[i + 1][0],
      );
    }
    return total;
  }

  calculateLightPhaseAndSpeed(
    light: TrafficLight,
    distanceMeters: number,
  ): LightPhaseResult {
    const cycleMs = (light.green + light.red) * 1_000;
    const elapsed = (Date.now() - light.start) % cycleMs;
    const isGreen = elapsed < light.green * 1_000;

    const windows = this.buildGreenWindows(light, elapsed, isGreen);

    for (const win of windows) {
      const targetTime = win.start === 0 ? win.end : win.start;
      const speedKmh = Math.round((distanceMeters / targetTime) * 3.6);

      if (speedKmh <= MAX_SPEED_KMH) {
        return {
          phase: isGreen ? 'GREEN' : 'RED',
          timeLeft: Math.round(targetTime),
          recommendedSpeedKmh: speedKmh,
        };
      }
    }

    // Fallback: slowest possible window
    const last = windows[windows.length - 1];
    const fallbackTime = last.start === 0 ? last.end : last.start;
    return {
      phase: isGreen ? 'GREEN' : 'RED',
      timeLeft: Math.round(fallbackTime),
      recommendedSpeedKmh: Math.min(
        MAX_SPEED_KMH,
        Math.round((distanceMeters / fallbackTime) * 3.6),
      ),
    };
  }

  private buildGreenWindows(
    light: TrafficLight,
    elapsed: number,
    isGreen: boolean,
  ): { start: number; end: number }[] {
    const windows: { start: number; end: number }[] = [];

    if (isGreen) {
      const remainingGreen = (light.green * 1_000 - elapsed) / 1_000;
      windows.push({ start: 0, end: remainingGreen });
      for (let n = 1; n <= LOOKAHEAD_WINDOWS; n++) {
        const s = remainingGreen + light.red + (n - 1) * (light.green + light.red);
        windows.push({ start: s, end: s + light.green });
      }
    } else {
      const timeToGreen = ((light.green + light.red) * 1_000 - elapsed) / 1_000;
      for (let n = 0; n <= LOOKAHEAD_WINDOWS; n++) {
        const s = timeToGreen + n * (light.green + light.red);
        windows.push({ start: s, end: s + light.green });
      }
    }

    return windows;
  }
}
