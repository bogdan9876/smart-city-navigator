export interface TrafficLight {
  id: number;
  name: string;
  lat: number;
  lng: number;
  /** Green phase duration in seconds */
  green: number;
  /** Red phase duration in seconds */
  red: number;
  /** Epoch ms when the cycle started (used for deterministic phase calculation) */
  start: number;
}

export interface LightPhaseResult {
  phase: 'GREEN' | 'RED';
  timeLeft: number;
  recommendedSpeedKmh: number;
}

export interface LightOnRouteResult {
  light: TrafficLight;
  idx: number;
}
