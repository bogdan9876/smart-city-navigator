import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
    const [userLoc, setUserLoc] = useState<{ latitude: number, longitude: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        let subscription: Location.LocationSubscription;

        const startTracking = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Немає доступу до GPS');
                setUserLoc({ latitude: 49.8450, longitude: 24.0250 });
                return;
            }

            try {
                let initialLocation = await Location.getCurrentPositionAsync({});
                setUserLoc({
                    latitude: initialLocation.coords.latitude,
                    longitude: initialLocation.coords.longitude,
                });

                subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.BestForNavigation,
                        timeInterval: 2000,
                        distanceInterval: 10,
                    },
                    (loc) => {
                        setUserLoc({
                            latitude: loc.coords.latitude,
                            longitude: loc.coords.longitude,
                        });
                    }
                );
            } catch (e) {
                setErrorMsg('Помилка отримання координат');
            }
        };

        startTracking();

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, []);

    return { userLoc, errorMsg };
}