import { useEffect, useRef, useState } from 'react';

export type TrafficLevel = 'NORMAL' | 'SLOW' | 'TRAFFIC_JAM';
export type Coord = { latitude: number; longitude: number };

export type TrafficSegment = {
    coords: Coord[];
    level: TrafficLevel;
};

export type RouteTraffic = {
    coords: Coord[];
    /** Raw GeoJSON coords [[lng, lat], ...] — same as Mapbox response, for sending to server */
    rawCoords: [number, number][];
    segments: TrafficSegment[];
    worstLevel: TrafficLevel;
    delaySeconds: number;
    delayMinutes: number;
    jamLengthMeters: number;
    totalDurationSeconds: number;
    totalDurationMinutes: number;
    totalDistanceMeters: number;
    jamStart: Coord | null;
};

function haversineMeters(a: Coord, b: Coord): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

export function useRouteTraffic(
    origin: Coord | null | undefined,
    destination: { lat: number; lng: number } | null | undefined,
) {
    const [data, setData] = useState<RouteTraffic | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const originRef = useRef(origin);
    originRef.current = origin;
    const hasOrigin = !!origin;

    useEffect(() => {
        if (!destination) {
            setData(null);
            return;
        }
        const snapshotOrigin = originRef.current;
        if (!snapshotOrigin) return;

        const key = process.env.EXPO_PUBLIC_MAPBOX_KEY;
        if (!key) {
            setError('Missing EXPO_PUBLIC_MAPBOX_KEY');
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        console.log('[useRouteTraffic] → fetch mapbox', {
            origin: snapshotOrigin,
            destination,
            keyPresent: !!key,
        });

        const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${snapshotOrigin.longitude},${snapshotOrigin.latitude};${destination.lng},${destination.lat}?annotations=congestion,distance,duration&geometries=geojson&overview=full&access_token=${key}`;

        fetch(url)
            .then(async (r) => {
                const json = await r.json();
                console.log('[useRouteTraffic] ← response', {
                    status: r.status,
                    ok: r.ok,
                    hasRoutes: !!json?.routes?.length,
                    errorMessage: json?.message,
                });
                if (!r.ok) {
                    throw new Error(json?.message ?? `HTTP ${r.status}`);
                }
                return json;
            })
            .then((json) => {
                if (cancelled) return;

                const route = json?.routes?.[0];
                if (!route) {
                    console.warn('[useRouteTraffic] No route in response');
                    setData(null);
                    setLoading(false);
                    return;
                }

                const rawCoords: [number, number][] = route.geometry?.coordinates ?? [];
                const coords: Coord[] = rawCoords.map((c: any) => ({ latitude: c[1], longitude: c[0] }));
                
                const congestions = route.legs?.[0]?.annotation?.congestion ?? [];
                
                const segments: TrafficSegment[] = [];
                
                if (coords.length > 1 && congestions.length > 0) {
                    const mapCongestion = (c: string): TrafficLevel => {
                        if (c === 'severe' || c === 'heavy') return 'TRAFFIC_JAM';
                        if (c === 'moderate') return 'SLOW';
                        return 'NORMAL';
                    };

                    let currentLevel: TrafficLevel = mapCongestion(congestions[0]);
                    let currentSegmentCoords: Coord[] = [coords[0]];

                    for (let i = 0; i < congestions.length; i++) {
                        const level = mapCongestion(congestions[i]);
                        const nextCoord = coords[i + 1];
                        
                        if (!nextCoord) break;
                        
                        if (level === currentLevel) {
                            currentSegmentCoords.push(nextCoord);
                        } else {
                            currentSegmentCoords.push(nextCoord); // End of current segment
                            segments.push({ level: currentLevel, coords: currentSegmentCoords });
                            currentLevel = level;
                            currentSegmentCoords = [nextCoord]; // Start of next segment
                        }
                    }
                    if (currentSegmentCoords.length > 1) {
                        segments.push({ level: currentLevel, coords: currentSegmentCoords });
                    }
                } else {
                    segments.push({ level: 'NORMAL', coords });
                }

                let jamLengthMeters = 0;
                let jamStart: Coord | null = null;
                for (const seg of segments) {
                    if (seg.level !== 'TRAFFIC_JAM') continue;
                    if (!jamStart && seg.coords.length > 0) jamStart = seg.coords[0];
                    for (let i = 1; i < seg.coords.length; i++) {
                        jamLengthMeters += haversineMeters(seg.coords[i - 1], seg.coords[i]);
                    }
                }

                const worstLevel: TrafficLevel = segments.some((s) => s.level === 'TRAFFIC_JAM')
                    ? 'TRAFFIC_JAM'
                    : segments.some((s) => s.level === 'SLOW')
                        ? 'SLOW'
                        : 'NORMAL';

                const duration = route.duration ?? 0;
                const distance = route.distance ?? 0;
                
                // Mapbox doesn't always provide static duration for free, so we estimate
                const typicalSpeedMps = 11; // ~40 km/h avg in city
                const staticDuration = distance / typicalSpeedMps;
                let delaySeconds = Math.max(0, duration - staticDuration);
                
                // Refine delay based on jam length:
                // time_in_jam = jamLength / jam_speed (5 km/h ≈ 1.4 m/s)
                // time_normal = jamLength / normal_speed (40 km/h ≈ 11 m/s)
                // extra = time_in_jam - time_normal
                if (jamLengthMeters > 50) {
                    const jamDelay = jamLengthMeters / 1.4 - jamLengthMeters / 11;
                    delaySeconds = Math.max(delaySeconds, jamDelay);
                }

                const result: RouteTraffic = {
                    coords,
                    rawCoords,
                    segments,
                    worstLevel,
                    delaySeconds,
                    delayMinutes: Math.round(delaySeconds / 60),
                    jamLengthMeters: Math.round(jamLengthMeters),
                    totalDurationSeconds: duration,
                    totalDurationMinutes: Math.max(1, Math.round(duration / 60)),
                    totalDistanceMeters: Math.round(distance),
                    jamStart,
                };
                console.log('[useRouteTraffic] ✓ parsed mapbox', {
                    coordsCount: coords.length,
                    segmentsCount: segments.length,
                    worstLevel,
                    totalDistanceMeters: result.totalDistanceMeters,
                    totalDurationMinutes: result.totalDurationMinutes,
                    delayMinutes: result.delayMinutes,
                });
                setData(result);
                setLoading(false);
            })
            .catch((err) => {
                if (cancelled) return;
                console.warn('[useRouteTraffic] ✗ error', err?.message ?? err);
                setError(err?.message ?? 'Route fetch failed');
                setData(null);
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [destination?.lat, destination?.lng, hasOrigin]);

    return { data, loading, error };
}
