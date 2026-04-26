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
 * Distance in metres from point P to the closest point on segment A→B.
 * Uses local equirectangular projection (lng scaled by cos(lat)) — accurate
 * within tens of metres at city scale.
 */
export function pointToSegmentDistance(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const M_PER_DEG_LAT = 111_320;
  const cosLat = Math.cos((aLat * Math.PI) / 180);
  const mPerDegLng = M_PER_DEG_LAT * cosLat;

  const px = (pLng - aLng) * mPerDegLng;
  const py = (pLat - aLat) * M_PER_DEG_LAT;
  const bx = (bLng - aLng) * mPerDegLng;
  const by = (bLat - aLat) * M_PER_DEG_LAT;

  const segLenSq = bx * bx + by * by;
  if (segLenSq === 0) {
    return Math.sqrt(px * px + py * py);
  }

  let t = (px * bx + py * by) / segLenSq;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;

  const dx = px - t * bx;
  const dy = py - t * by;
  return Math.sqrt(dx * dx + dy * dy);
}
