import axios from 'axios';

export const fetchRouteAdvice = async (userLoc: { latitude: number, longitude: number }, destination: { lat: number, lng: number }) => {
    const url = `${process.env.EXPO_PUBLIC_API_URL}/traffic/advice?lat=${userLoc.latitude}&lng=${userLoc.longitude}&destLat=${destination.lat}&destLng=${destination.lng}`;

    try {
        const res = await axios.get(url);
        return res.data;
    } catch (error: any) {
        console.error("Помилка зв'язку з бекендом:", error.message);
        return null;
    }
};
