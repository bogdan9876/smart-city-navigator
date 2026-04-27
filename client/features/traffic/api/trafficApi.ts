import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

/**
 * Sends pre-built Mapbox route coords to the server for traffic light analysis.
 * Returns green-wave advice without triggering an internal OSRM call.
 */
export const postRouteAnalysis = async (
    coords: [number, number][],
    totalDistanceMeters?: number,
): Promise<any | null> => {
    try {
        const res = await axios.post(`${API_URL}/traffic/analyse`, {
            coords,
            totalDistanceMeters,
        });
        return res.data;
    } catch (error: any) {
        console.error('[trafficApi] postRouteAnalysis error:', error.message);
        return null;
    }
};
