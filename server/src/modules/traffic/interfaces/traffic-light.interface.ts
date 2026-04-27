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
  /**
   * The compass bearing (0–359°) of traffic that this light controls.
   * 0 = north, 90 = east, 180 = south, 270 = west.
   * If null, bearing check is skipped (unknown direction).
   */
  heading: number | null;
}

export interface LightOnRoute {
  light: TrafficLight;
  /** Distance from route start to the light, in metres */
  distanceMeters: number;
}

export interface LightAhead {
  light: TrafficLight;
  distanceMeters: number;
  phaseAtArrival: 'GREEN' | 'RED';
  /** Seconds until phase changes at the predicted arrival moment */
  timeLeftAtArrival: number;
}

export interface GreenWaveResult {
  recommendedSpeedKmh: number;
  lightsAhead: LightAhead[];
  greenCount: number;
}
