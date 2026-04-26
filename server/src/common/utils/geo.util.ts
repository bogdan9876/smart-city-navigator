/**
 * Haversine formula — calculates distance in metres between two GPS points.
 */
export function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Projects point P onto segment A→B using local equirectangular projection
 * (lng scaled by cos(lat)). Accurate within tens of metres at city scale.
 *
 * Returns:
 *   distance — perpendicular distance in metres to the closest point on segment
 *   t        — clamped position [0..1] along the segment (0 = A, 1 = B)
 */
export function projectPointOnSegment(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): { distance: number; t: number } {
  const M_PER_DEG_LAT = 111_320;
  const cosLat = Math.cos((aLat * Math.PI) / 180);
  const mPerDegLng = M_PER_DEG_LAT * cosLat;

  const px = (pLng - aLng) * mPerDegLng;
  const py = (pLat - aLat) * M_PER_DEG_LAT;
  const bx = (bLng - aLng) * mPerDegLng;
  const by = (bLat - aLat) * M_PER_DEG_LAT;

  const segLenSq = bx * bx + by * by;
  if (segLenSq === 0) {
    return { distance: Math.sqrt(px * px + py * py), t: 0 };
  }

  let t = (px * bx + py * by) / segLenSq;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;

  const dx = px - t * bx;
  const dy = py - t * by;
  return { distance: Math.sqrt(dx * dx + dy * dy), t };
}

export function pointToSegmentDistance(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  return projectPointOnSegment(pLat, pLng, aLat, aLng, bLat, bLng).distance;
}
