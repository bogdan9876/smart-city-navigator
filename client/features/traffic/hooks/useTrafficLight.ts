import { useState, useEffect, useRef } from 'react';
import { haversineMeters } from '@/features/location/utils/locationUtils';
import type { RouteTraffic } from './useRouteTraffic';

const MIN_SPEED_KMH = 5;
const MAX_SPEED_KMH = 60;
const SPEED_STEP_KMH = 1;
const JAM_SPEED_THRESHOLD_KMH = 10;

type Phase = 'GREEN' | 'RED';

type LightInfo = {
    light: { id: number; name: string; lat: number; lng: number; green: number; red: number; start: number };
    distanceMeters: number;
};

type LightAhead = LightInfo & {
    phaseAtArrival: Phase;
    timeLeftAtArrival: number;
};

export type LiveTrafficData = {
    phase: Phase;
    timeLeft: number;
    isInJam: boolean;
    speed: number | null;
    estimatedJamExitMinutes: number | null;
    speedAfterJam: number | null;
    jamBeforeLightMeters: number;
    /** Multi-light green-wave snapshot at the recommended speed. */
    lightsAhead: LightAhead[];
    greenCount: number;
};

type Coord = { latitude: number; longitude: number };

function getNearestSegmentLevel(
    segments: RouteTraffic['segments'],
    userLocation: Coord,
): RouteTraffic['segments'][number]['level'] | null {
    let minDist = Infinity;
    let nearestLevel: RouteTraffic['segments'][number]['level'] | null = null;

    for (const seg of segments) {
        for (const coord of seg.coords) {
            const d = haversineMeters(userLocation, coord);
            if (d < minDist) {
                minDist = d;
                nearestLevel = seg.level;
            }
        }
    }
    return nearestLevel;
}

function phaseAt(light: LightInfo['light'], offsetSec: number, now: number) {
    const cycleSec = light.green + light.red;
    const elapsed = (now - light.start) / 1000 + offsetSec;
    const cyclePos = ((elapsed % cycleSec) + cycleSec) % cycleSec;
    const isGreen = cyclePos < light.green;
    const timeLeft = isGreen ? light.green - cyclePos : cycleSec - cyclePos;
    return { isGreen, timeLeft };
}

/**
 * Brute-forces speeds 5..60 km/h. Picks the speed that turns the most lights
 * GREEN at predicted arrival time. Ties → higher speed (faster trip).
 *
 * `extraTimeSec` shifts every arrival time forward by N seconds — used when
 * the user is stuck in a jam before the lights.
 *
 * `effectiveDistanceShift` reduces every light's distance by N metres — the
 * portion of the route the user covers slowly inside the jam at jamSpeed.
 * Speed `v` then applies only AFTER that portion.
 */
function findGreenWave(
    lights: LightInfo[],
    now: number,
    extraTimeSec: number = 0,
    distanceCoveredInJam: number = 0,
    jamSpeedMps: number = 3,
): { speed: number | null; lightsAhead: LightAhead[]; greenCount: number } {
    if (lights.length === 0) return { speed: null, lightsAhead: [], greenCount: 0 };

    let bestSpeed: number | null = null;
    let bestCount = -1;
    let bestDetails: LightAhead[] = [];

    for (let v = MIN_SPEED_KMH; v <= MAX_SPEED_KMH; v += SPEED_STEP_KMH) {
        const vMs = v / 3.6;
        let count = 0;
        const details: LightAhead[] = [];

        for (const li of lights) {
            const distAfterJam = Math.max(0, li.distanceMeters - distanceCoveredInJam);
            const jamPart = Math.min(li.distanceMeters, distanceCoveredInJam);
            const tSec = extraTimeSec + jamPart / jamSpeedMps + distAfterJam / vMs;
            const { isGreen, timeLeft } = phaseAt(li.light, tSec, now);
            if (isGreen) count++;
            details.push({
                light: li.light,
                distanceMeters: li.distanceMeters,
                phaseAtArrival: isGreen ? 'GREEN' : 'RED',
                timeLeftAtArrival: Math.round(timeLeft),
            });
        }

        if (count > bestCount || (count === bestCount && (bestSpeed === null || v > bestSpeed))) {
            bestSpeed = v;
            bestCount = count;
            bestDetails = details;
        }
    }

    return { speed: bestSpeed, lightsAhead: bestDetails, greenCount: bestCount };
}

export function useTrafficLight(
    advice: any,
    trafficInfo: RouteTraffic | null | undefined,
    userLocation: Coord | null | undefined,
    gpsSpeedMs: number | null | undefined,
) {
    const [liveTrafficData, setLiveTrafficData] = useState<LiveTrafficData | null>(null);

    const userLocationRef = useRef(userLocation);
    userLocationRef.current = userLocation;
    const gpsSpeedMsRef = useRef(gpsSpeedMs);
    gpsSpeedMsRef.current = gpsSpeedMs;

    useEffect(() => {
        if (!advice || !advice.hasLight || !Array.isArray(advice.lightsAhead) || advice.lightsAhead.length === 0) {
            setLiveTrafficData(null);
            return;
        }

        const lightsAhead: LightInfo[] = advice.lightsAhead.map((l: any) => ({
            light: l.light,
            distanceMeters: l.distanceMeters,
        }));
        const firstLight = lightsAhead[0].light;
        const distanceToFirstLight = lightsAhead[0].distanceMeters;

        const tick = () => {
            const now = Date.now();
            const { isGreen: isGreenNow, timeLeft: timeLeftNow } = phaseAt(firstLight, 0, now);

            const userLocation = userLocationRef.current;
            const gpsSpeedMs = gpsSpeedMsRef.current;

            // --- Jam analysis (relative to FIRST light) ---
            let jamBeforeLightMeters = 0;
            if (trafficInfo?.jamStart && userLocation && trafficInfo.jamLengthMeters > 0) {
                const distToJamStart = haversineMeters(userLocation, trafficInfo.jamStart);
                if (distToJamStart < distanceToFirstLight) {
                    const jamEndDist = distToJamStart + trafficInfo.jamLengthMeters;
                    jamBeforeLightMeters = Math.max(0, Math.min(jamEndDist, distanceToFirstLight) - distToJamStart);
                }
            }

            const currentKmh = gpsSpeedMs != null && gpsSpeedMs >= 0 ? gpsSpeedMs * 3.6 : null;
            const nearestLevel =
                trafficInfo?.segments?.length && userLocation
                    ? getNearestSegmentLevel(trafficInfo.segments, userLocation)
                    : null;
            const isInJam =
                currentKmh != null &&
                currentKmh < JAM_SPEED_THRESHOLD_KMH &&
                nearestLevel === 'TRAFFIC_JAM' &&
                jamBeforeLightMeters > 0;

            const jamSpeedMps = gpsSpeedMs != null && gpsSpeedMs > 0.3 ? gpsSpeedMs : 3;
            const timeInJamSec = jamBeforeLightMeters / jamSpeedMps;

            // --- Green wave across ALL lights ---
            const wave = isInJam
                ? findGreenWave(lightsAhead, now, 0, jamBeforeLightMeters, jamSpeedMps)
                : findGreenWave(lightsAhead, now);

            if (isInJam) {
                setLiveTrafficData({
                    phase: isGreenNow ? 'GREEN' : 'RED',
                    timeLeft: Math.round(timeLeftNow),
                    isInJam: true,
                    speed: null,
                    estimatedJamExitMinutes: Math.max(1, Math.ceil(timeInJamSec / 60)),
                    speedAfterJam: wave.speed,
                    jamBeforeLightMeters: Math.round(jamBeforeLightMeters),
                    lightsAhead: wave.lightsAhead,
                    greenCount: wave.greenCount,
                });
            } else {
                setLiveTrafficData({
                    phase: isGreenNow ? 'GREEN' : 'RED',
                    timeLeft: Math.round(timeLeftNow),
                    isInJam: false,
                    speed: wave.speed,
                    estimatedJamExitMinutes: null,
                    speedAfterJam: null,
                    jamBeforeLightMeters: Math.round(jamBeforeLightMeters),
                    lightsAhead: wave.lightsAhead,
                    greenCount: wave.greenCount,
                });
            }
        };

        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [advice, trafficInfo]);

    return liveTrafficData;
}
