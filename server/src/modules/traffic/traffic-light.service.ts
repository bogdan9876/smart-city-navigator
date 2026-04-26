import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { getDistance, projectPointOnSegment } from '../../common/utils/geo.util';
import {
  GreenWaveResult,
  LightAhead,
  LightOnRoute,
  TrafficLight,
} from './interfaces/traffic-light.interface';

const MIN_SPEED_KMH = 5;
const MAX_SPEED_KMH = 60;
const SPEED_STEP_KMH = 1;
const LIGHT_PROXIMITY_METERS = 35;

@Injectable()
export class TrafficLightService implements OnModuleInit {
  private readonly logger = new Logger(TrafficLightService.name);
  private lights: TrafficLight[] = [];

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    await this.reloadLights();
  }

  async reloadLights(): Promise<void> {
    const rows = await this.db.trafficLight.findMany({ orderBy: { id: 'asc' } });
    this.lights = rows.map((r) => ({
      id: r.id,
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      green: r.green,
      red: r.red,
      start: r.start.getTime(),
    }));
    this.logger.log(`Loaded ${this.lights.length} traffic lights from DB`);
  }

  /**
   * Finds every traffic light whose perpendicular distance to the route is
   * within LIGHT_PROXIMITY_METERS, computes the cumulative distance from
   * route start to each light's foot-of-perpendicular, and returns them
   * sorted by distance.
   */
  findAllLightsOnRoute(coords: [number, number][]): LightOnRoute[] {
    if (coords.length < 2) return [];

    const cumDist: number[] = [0];
    for (let i = 0; i < coords.length - 1; i++) {
      const d = getDistance(
        coords[i][1], coords[i][0],
        coords[i + 1][1], coords[i + 1][0],
      );
      cumDist.push(cumDist[i] + d);
    }

    const matches: LightOnRoute[] = [];

    for (const light of this.lights) {
      let bestIdx = -1;
      let bestT = 0;
      let bestPerp = Infinity;

      for (let i = 0; i < coords.length - 1; i++) {
        const proj = projectPointOnSegment(
          light.lat, light.lng,
          coords[i][1], coords[i][0],
          coords[i + 1][1], coords[i + 1][0],
        );
        if (proj.distance < LIGHT_PROXIMITY_METERS && proj.distance < bestPerp) {
          bestPerp = proj.distance;
          bestIdx = i;
          bestT = proj.t;
        }
      }

      if (bestIdx >= 0) {
        const segLen = cumDist[bestIdx + 1] - cumDist[bestIdx];
        matches.push({
          light,
          distanceMeters: cumDist[bestIdx] + segLen * bestT,
        });
      }
    }

    return matches.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  /**
   * Brute-forces speed candidates in [MIN_SPEED_KMH..MAX_SPEED_KMH] and picks
   * the one that hits GREEN at the maximum number of lights. Ties broken by
   * higher speed (faster trip overall).
   */
  calculateGreenWave(
    lights: LightOnRoute[],
    now: number = Date.now(),
  ): GreenWaveResult {
    if (lights.length === 0) {
      return { recommendedSpeedKmh: MAX_SPEED_KMH, lightsAhead: [], greenCount: 0 };
    }

    let bestSpeed = MIN_SPEED_KMH;
    let bestCount = -1;
    let bestDetails: LightAhead[] = [];

    for (let v = MIN_SPEED_KMH; v <= MAX_SPEED_KMH; v += SPEED_STEP_KMH) {
      const vMs = v / 3.6;
      let count = 0;
      const details: LightAhead[] = [];

      for (const { light, distanceMeters } of lights) {
        const tSec = distanceMeters / vMs;
        const cycleSec = light.green + light.red;
        const elapsed = (now - light.start) / 1000 + tSec;
        const cyclePos = ((elapsed % cycleSec) + cycleSec) % cycleSec;
        const isGreen = cyclePos < light.green;
        const timeLeft = isGreen ? light.green - cyclePos : cycleSec - cyclePos;

        if (isGreen) count++;
        details.push({
          light,
          distanceMeters,
          phaseAtArrival: isGreen ? 'GREEN' : 'RED',
          timeLeftAtArrival: Math.round(timeLeft),
        });
      }

      if (count > bestCount || (count === bestCount && v > bestSpeed)) {
        bestSpeed = v;
        bestCount = count;
        bestDetails = details;
      }
    }

    return {
      recommendedSpeedKmh: bestSpeed,
      lightsAhead: bestDetails,
      greenCount: bestCount,
    };
  }
}
