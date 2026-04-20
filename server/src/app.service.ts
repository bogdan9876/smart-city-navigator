import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TrafficLight, trafficLights } from './traffic/data/lights.data';

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) { }

  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async calculateSpeed(userLat: number, userLng: number, destLat: number, destLng: number) {
    try {
      const url = `http://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const response = await firstValueFrom(this.httpService.get(url));
      const routeData = response.data.routes[0];
      const coords = routeData.geometry.coordinates;

      const totalDistanceMeters = Math.round(routeData.distance);

      let lightOnRoute: TrafficLight | null = null;
      let lightIndex = -1;

      for (const light of trafficLights) {
        for (let i = 0; i < coords.length; i++) {
          const isNear = this.getDistance(coords[i][1], coords[i][0], light.lat, light.lng) < 60;
          if (isNear) {
            lightOnRoute = light;
            lightIndex = i;
            break;
          }
        }
        if (lightOnRoute) break;
      }

      if (!lightOnRoute) {
        return {
          hasLight: false,
          routeCoords: coords,
          totalDistance: totalDistanceMeters
        };
      }

      let distanceToLight = 0;
      for (let i = 0; i < lightIndex; i++) {
        distanceToLight += this.getDistance(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]);
      }

      const MAX_SPEED_KMH = 60;
      const now = Date.now();
      const cycleMs = (lightOnRoute.green + lightOnRoute.red) * 1000;
      const elapsed = (now - lightOnRoute.start) % cycleMs;
      const isGreen = elapsed < lightOnRoute.green * 1000;

      type Window = { start: number; end: number };
      const windows: Window[] = [];

      if (isGreen) {
        const remainingGreen = (lightOnRoute.green * 1000 - elapsed) / 1000;
        windows.push({ start: 0, end: remainingGreen });
        for (let n = 1; n <= 5; n++) {
          const s = remainingGreen + lightOnRoute.red + (n - 1) * (lightOnRoute.green + lightOnRoute.red);
          windows.push({ start: s, end: s + lightOnRoute.green });
        }
      } else {
        const timeToGreen = (cycleMs - elapsed) / 1000;
        for (let n = 0; n <= 5; n++) {
          const s = timeToGreen + n * (lightOnRoute.green + lightOnRoute.red);
          windows.push({ start: s, end: s + lightOnRoute.green });
        }
      }

      let recommendedSpeedKmh = MAX_SPEED_KMH;
      let targetTime = windows[windows.length - 1].start || windows[windows.length - 1].end;

      for (const win of windows) {
        const t = win.start === 0 ? win.end : win.start;
        const kmh = Math.round((distanceToLight / t) * 3.6);
        if (kmh <= MAX_SPEED_KMH) {
          recommendedSpeedKmh = kmh;
          targetTime = t;
          break;
        }
      }

      return {
        hasLight: true,
        routeCoords: coords,
        totalDistance: totalDistanceMeters,
        distanceToLight: Math.round(distanceToLight),
        distanceMeters: Math.round(distanceToLight),
        phase: isGreen ? 'GREEN' : 'RED',
        timeLeft: Math.round(targetTime),
        recommendedSpeedKmh,
        targetLight: lightOnRoute
      };

    } catch (error) {
      return { error: 'Не вдалося прокласти дорогу' };
    }
  }
}