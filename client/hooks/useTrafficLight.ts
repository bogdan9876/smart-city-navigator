import { useState, useEffect } from 'react';

export function useTrafficLight(advice: any) {
    const [liveTrafficData, setLiveTrafficData] = useState<{ phase: string, timeLeft: number, speed: number } | null>(null);

    useEffect(() => {
        if (!advice || !advice.hasLight || !advice.targetLight) {
            setLiveTrafficData(null);
            return;
        }

        const light = advice.targetLight;
        const distance = advice.distanceMeters;

        const updateTrafficData = () => {
            const now = Date.now();
            const cycle = (light.green + light.red) * 1000;
            const elapsed = (now - light.start) % cycle;
            const isGreen = elapsed < light.green * 1000;
            const timeLeft = isGreen ? (light.green * 1000 - elapsed) / 1000 : (cycle - elapsed) / 1000;

            setLiveTrafficData({
                phase: isGreen ? 'GREEN' : 'RED',
                timeLeft: Math.round(timeLeft),
                speed: Math.round((distance / timeLeft) * 3.6)
            });
        };

        updateTrafficData();
        const timer = setInterval(updateTrafficData, 1000);

        return () => clearInterval(timer);
    }, [advice]);

    return liveTrafficData;
}