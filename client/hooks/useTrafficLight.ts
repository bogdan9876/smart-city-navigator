import { useState, useEffect, useRef } from 'react';
import { haversineMeters } from '@/utils/locationUtils';
import type { RouteTraffic } from './useRouteTraffic';

const NORMAL_SPEED_MPS = 11; // ~40 km/h free-flow city speed
const JAM_SPEED_THRESHOLD_KMH = 10;

export type LiveTrafficData = {
    phase: 'GREEN' | 'RED';
    timeLeft: number;
    isInJam: boolean;
    // When NOT in jam:
    speed: number | null;
    // When in jam:
    estimatedJamExitMinutes: number | null;
    speedAfterJam: number | null;
    jamBeforeLightMeters: number;
};

type Coord = { latitude: number; longitude: number };

// Finds the Mapbox congestion level of the route segment closest to the user's position.
// Returns null if no segment data available.
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

function buildGreenWindows(light: { green: number; red: number; start: number }, count: number) {
    const cycle = (light.green + light.red) * 1000;
    const elapsed = (Date.now() - light.start) % cycle;
    const isGreen = elapsed < light.green * 1000;
    const timeLeftSec = isGreen
        ? (light.green * 1000 - elapsed) / 1000
        : (cycle - elapsed) / 1000;

    const windows: Array<{ start: number; end: number }> = [];

    if (isGreen) {
        windows.push({ start: 0, end: timeLeftSec });
    }

    let nextStart = isGreen ? timeLeftSec + light.red : timeLeftSec;
    for (let i = 0; i < count; i++) {
        windows.push({ start: nextStart, end: nextStart + light.green });
        nextStart += light.green + light.red;
    }

    return { windows, isGreen, timeLeftSec };
}

export function useTrafficLight(
    advice: any,
    trafficInfo: RouteTraffic | null | undefined,
    userLocation: Coord | null | undefined,
    gpsSpeedMs: number | null | undefined,
) {
    const [liveTrafficData, setLiveTrafficData] = useState<LiveTrafficData | null>(null);

    // Refs for frequently-changing GPS values — avoids recreating the interval on every GPS tick.
    const userLocationRef = useRef(userLocation);
    userLocationRef.current = userLocation;
    const gpsSpeedMsRef = useRef(gpsSpeedMs);
    gpsSpeedMsRef.current = gpsSpeedMs;

    useEffect(() => {
        if (!advice || !advice.hasLight || !advice.targetLight) {
            setLiveTrafficData(null);
            return;
        }

        const light = advice.targetLight;
        const distanceToLight: number = advice.distanceMeters;

        const updateTrafficData = () => {
            // --- 1. Current phase ---
            const { windows, isGreen, timeLeftSec } = buildGreenWindows(light, 10);

            // --- 2. Jam portion before traffic light ---
            const userLocation = userLocationRef.current;
            const gpsSpeedMs = gpsSpeedMsRef.current;
            let jamBeforeLightMeters = 0;
            if (trafficInfo?.jamStart && userLocation && trafficInfo.jamLengthMeters > 0) {
                const distToJamStart = haversineMeters(userLocation, trafficInfo.jamStart);
                // Jam is relevant only if it starts before the traffic light
                if (distToJamStart < distanceToLight) {
                    const jamEndDist = distToJamStart + trafficInfo.jamLengthMeters;
                    jamBeforeLightMeters = Math.max(0, Math.min(jamEndDist, distanceToLight) - distToJamStart);
                }
            }

            // --- 3. Is user currently in jam ---
            // Requires BOTH: low GPS speed AND Mapbox confirms jam at user's position.
            // This prevents false positives when stopped at a red light on a clear road.
            const currentKmh = gpsSpeedMs != null && gpsSpeedMs >= 0 ? gpsSpeedMs * 3.6 : null;
            const nearestLevel = trafficInfo?.segments?.length && userLocation
                ? getNearestSegmentLevel(trafficInfo.segments, userLocation)
                : null;
            const isInJam =
                currentKmh != null &&
                currentKmh < JAM_SPEED_THRESHOLD_KMH &&
                nearestLevel === 'TRAFFIC_JAM' &&
                jamBeforeLightMeters > 0;

            // --- 4. Time spent in jam before the light ---
            // Fallback: 3 m/s (~11 km/h) when GPS unavailable.
            const jamSpeedMps = gpsSpeedMs != null && gpsSpeedMs > 0.3 ? gpsSpeedMs : 3;
            const timeInJamSec = jamBeforeLightMeters / jamSpeedMps;
            // distanceAfterJam = all distance the driver can control (before + after jam section)
            const distanceAfterJam = Math.max(0, distanceToLight - jamBeforeLightMeters);

            // --- 5 & 6. Iterate windows like the server does: first where speed ≤ 60 km/h ---
            // Mirrors traffic-light.service.ts logic but accounts for jam delay.
            const MAX_SPEED_KMH = 60;
            const findOptimalSpeed = (): number | null => {
                if (distanceAfterJam <= 0) return null;
                for (const win of windows) {
                    const t = win.start === 0 ? win.end : win.start;
                    if (t <= 0 || t <= timeInJamSec) continue; // window not reachable after jam exit
                    const freeTime = t - timeInJamSec;
                    const kmh = Math.round((distanceAfterJam / freeTime) * 3.6);
                    if (kmh >= 5 && kmh <= MAX_SPEED_KMH) return kmh;
                }
                return null; // all windows need > 60 km/h → show РУХАЙТЕСЬ ВІЛЬНО
            };

            if (isInJam) {
                setLiveTrafficData({
                    phase: isGreen ? 'GREEN' : 'RED',
                    timeLeft: Math.round(timeLeftSec),
                    isInJam: true,
                    speed: null,
                    estimatedJamExitMinutes: Math.max(1, Math.ceil(timeInJamSec / 60)),
                    speedAfterJam: findOptimalSpeed(),
                    jamBeforeLightMeters: Math.round(jamBeforeLightMeters),
                });
            } else {
                setLiveTrafficData({
                    phase: isGreen ? 'GREEN' : 'RED',
                    timeLeft: Math.round(timeLeftSec),
                    isInJam: false,
                    speed: findOptimalSpeed(),
                    estimatedJamExitMinutes: null,
                    speedAfterJam: null,
                    jamBeforeLightMeters: Math.round(jamBeforeLightMeters),
                });
            }
        };

        updateTrafficData();
        const timer = setInterval(updateTrafficData, 1000);
        return () => clearInterval(timer);
    }, [advice, trafficInfo]);

    return liveTrafficData;
}
