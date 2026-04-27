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
/** Max perpendicular distance from the route polyline to count a light as "on route". */
const LIGHT_PROXIMITY_METERS = 80;
/**
 * Two lights that project within this window (metres along the route) are
 * treated as belonging to the same intersection. Only the closest one
 * (smallest perpendicular distance) is kept.
 */
const DEDUP_WINDOW_METERS = 60;
/**
 * Lights inside DEDUP_WINDOW are only merged if their headings differ by
 * less than this. Different headings = different signal heads serving
 * different movements at the same physical intersection — keep them apart.
 */
const DEDUP_HEADING_TOLERANCE_DEG = 30;
/**
 * A light is considered "oncoming / cross-traffic" if its heading differs
 * from the route bearing by more than this value. Lights with heading=null
 * are always kept. 35° tolerates curves, OSRM segment jitter, and diagonal
 * roads, but rejects side streets merging at sharper angles.
 */
const HEADING_TOLERANCE_DEG = 35;
/**
 * Length of the route window BEFORE the light's projection used to estimate
 * approach bearing. We look only backwards because that's the direction the
 * driver was travelling when they reached the light — the segments AFTER
 * the projection are departure (post-intersection), which we must not blend
 * in or turns will pull the estimate toward the wrong direction.
 */
const APPROACH_BEARING_BACK_METERS = 80;
/**
 * Minimum coherence (|sum of unit vectors| / total length) for the averaged
 * bearing to be considered reliable. Below this, the route is too chaotic
 * (sharp turn, zigzag polyline) and we fall back to the anchor segment
 * bearing.
 */
const APPROACH_BEARING_MIN_COHERENCE = 0.6;

/** Compass bearing (0-359) from point A to point B. */
function calcSegmentBearing(
  aLat: number, aLng: number,
  bLat: number, bLng: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const x = Math.sin(dLng) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
}

/** Smallest angle between two compass bearings (0-180). */
function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Extended internally to carry perpendicular distance for de-duplication. */
type LightOnRouteRaw = LightOnRoute & { perpMeters: number };

/**
 * Length-weighted circular mean of route bearings within a route-distance
 * window `[centerDist - backMeters, centerDist]` — i.e. only segments BEFORE
 * the projection point. Partial segments at the window boundary contribute
 * by their overlap length. Returns the averaged bearing plus a coherence
 * value in [0, 1] — 1 = all sampled segments aligned, 0 = totally cancelling
 * out (sharp turn or zigzag). Returns NaN bearing when the window contains
 * no sampleable segments.
 */
function computeApproachBearing(
  coords: [number, number][],
  cumDist: number[],
  centerDist: number,
  backMeters: number,
): { bearing: number; coherence: number } {
  const windowStart = centerDist - backMeters;
  const windowEnd = centerDist;

  let sumX = 0;
  let sumY = 0;
  let totalLen = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const segStart = cumDist[i];
    const segEnd = cumDist[i + 1];
    const overlapStart = Math.max(segStart, windowStart);
    const overlapEnd = Math.min(segEnd, windowEnd);
    const overlapLen = overlapEnd - overlapStart;
    if (overlapLen <= 0) continue;

    const segBearing = calcSegmentBearing(
      coords[i][1], coords[i][0],
      coords[i + 1][1], coords[i + 1][0],
    );
    const rad = (segBearing * Math.PI) / 180;
    sumX += Math.cos(rad) * overlapLen;
    sumY += Math.sin(rad) * overlapLen;
    totalLen += overlapLen;
  }

  if (totalLen === 0) return { bearing: NaN, coherence: 0 };

  const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
  const coherence = magnitude / totalLen;
  const bearing = ((Math.atan2(sumY, sumX) * 180) / Math.PI + 360) % 360;
  return { bearing, coherence };
}

/**
 * Groups lights that project within DEDUP_WINDOW_METERS of each other along
 * the route AND share a similar heading, then returns only the closest-to-road
 * representative of each group. Lights with different headings at the same
 * spot remain as separate entries (different movements / signal heads).
 */
function deduplicateByWindow(
  sorted: LightOnRouteRaw[],
  windowMeters: number,
  headingToleranceDeg: number,
): LightOnRoute[] {
  const result: LightOnRoute[] = [];
  const used = new Array<boolean>(sorted.length).fill(false);

  for (let i = 0; i < sorted.length; i++) {
    if (used[i]) continue;

    let best = sorted[i];
    used[i] = true;

    for (let j = i + 1; j < sorted.length; j++) {
      if (used[j]) continue;
      if (sorted[j].distanceMeters - sorted[i].distanceMeters > windowMeters) break;

      const ha = sorted[i].light.heading;
      const hb = sorted[j].light.heading;
      const headingsCompatible =
        ha === null || hb === null || angleDiff(ha, hb) <= headingToleranceDeg;

      if (headingsCompatible) {
        used[j] = true;
        if (sorted[j].perpMeters < best.perpMeters) best = sorted[j];
      }
    }

    result.push({ light: best.light, distanceMeters: best.distanceMeters });
  }

  return result;
}

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
      heading: r.heading ?? null,
    }));
    this.logger.log(`Loaded ${this.lights.length} traffic lights from DB`);
  }

  /**
   * Finds every traffic light whose perpendicular distance to the route is
   * within LIGHT_PROXIMITY_METERS, computes the cumulative distance from
   * route start to each light's foot-of-perpendicular, and returns them
   * sorted by distance — with same-intersection duplicates removed.
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

    const matches: LightOnRouteRaw[] = [];

    for (const light of this.lights) {
      // ── Step 1: find the closest segment by perpendicular distance ──
      let bestIdx = -1;
      let bestT = 0;
      let bestPerp = Infinity;

      for (let i = 0; i < coords.length - 1; i++) {
        const proj = projectPointOnSegment(
          light.lat, light.lng,
          coords[i][1], coords[i][0],
          coords[i + 1][1], coords[i + 1][0],
        );
        if (proj.distance < bestPerp) {
          bestPerp = proj.distance;
          bestIdx = i;
          bestT = proj.t;
        }
      }

      const tooFar = bestIdx < 0 || bestPerp >= LIGHT_PROXIMITY_METERS;
      let onRoute = !tooFar;
      let bearingUsed: number | null = null;
      let bearingSource: 'avg' | 'segment' | 'none' = 'none';

      // ── Step 2: heading check using approach bearing (look only backward) ──
      if (onRoute && light.heading !== null) {
        const segLen = cumDist[bestIdx + 1] - cumDist[bestIdx];
        const projDist = cumDist[bestIdx] + segLen * bestT;
        const { bearing: approachBearing, coherence } = computeApproachBearing(
          coords, cumDist, projDist, APPROACH_BEARING_BACK_METERS,
        );

        if (!Number.isNaN(approachBearing) && coherence >= APPROACH_BEARING_MIN_COHERENCE) {
          bearingUsed = approachBearing;
          bearingSource = 'avg';
        } else {
          // Chaotic spot (sharp turn / zigzag) or window empty — fall back
          // to the anchor segment's bearing.
          bearingUsed = calcSegmentBearing(
            coords[bestIdx][1], coords[bestIdx][0],
            coords[bestIdx + 1][1], coords[bestIdx + 1][0],
          );
          bearingSource = 'segment';
        }

        if (angleDiff(bearingUsed!, light.heading) > HEADING_TOLERANCE_DEG) {
          onRoute = false;
        }
      }

      this.logger.debug(
        `Light "${light.name}" [hdg=${light.heading ?? '?'}°] — min dist to route: ${bestPerp.toFixed(1)} m` +
        (bearingUsed !== null
          ? ` | route bearing≈${bearingUsed.toFixed(0)}° (${bearingSource})`
          : '') +
        (onRoute ? ' ✓ ON ROUTE' : ' ✗ too far / wrong dir'),
      );

      if (onRoute) {
        const segLen = cumDist[bestIdx + 1] - cumDist[bestIdx];
        matches.push({
          light,
          distanceMeters: cumDist[bestIdx] + segLen * bestT,
          perpMeters: bestPerp,
        });
      }
    }

    // Sort by distance along route, then de-duplicate same-intersection lights.
    matches.sort((a, b) => a.distanceMeters - b.distanceMeters);
    const deduped = deduplicateByWindow(
      matches,
      DEDUP_WINDOW_METERS,
      DEDUP_HEADING_TOLERANCE_DEG,
    );

    this.logger.log(
      `Found ${matches.length} raw / ${deduped.length} deduped lights on route`,
    );
    return deduped;
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
