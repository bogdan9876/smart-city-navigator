export interface TrafficLight {
    id: number;
    name: string;
    lat: number;
    lng: number;
    green: number;
    red: number;
    start: number;
}

export const trafficLights: TrafficLight[] = [
    { id: 1, name: "Оперний", lat: 49.844447073340596, lng: 24.02537395413035, green: 30, red: 20, start: 1709724000000 },
    { id: 2, name: "Пл. Ринок", lat: 49.8416, lng: 24.0324, green: 45, red: 15, start: 1709724100000 },
    { id: 3, name: "Митна", lat: 49.8396, lng: 24.0358, green: 25, red: 35, start: 1709724200000 }
];