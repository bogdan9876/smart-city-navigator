export const haversineMeters = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
};

export const getBearing = (start: { latitude: number, longitude: number }, end: { latitude: number, longitude: number }) => {
    const toRad = (val: number) => (val * Math.PI) / 180;
    const toDeg = (val: number) => (val * 180) / Math.PI;

    const lat1 = toRad(start.latitude);
    const lon1 = toRad(start.longitude);
    const lat2 = toRad(end.latitude);
    const lon2 = toRad(end.longitude);

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

    const bearing = toDeg(Math.atan2(y, x));
    return (bearing + 360) % 360;
};