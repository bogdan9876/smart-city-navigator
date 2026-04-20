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

      const now = Date.now();
      const cycle = (lightOnRoute.green + lightOnRoute.red) * 1000;
      const elapsed = (now - lightOnRoute.start) % cycle;
      const isGreen = elapsed < lightOnRoute.green * 1000;
      const timeLeft = isGreen ? (lightOnRoute.green * 1000 - elapsed) / 1000 : (cycle - elapsed) / 1000;

      const speedMps = distanceToLight / Math.max(timeLeft, 1);

      return {
        hasLight: true,
        routeCoords: coords,
        totalDistance: totalDistanceMeters,
        distanceToLight: Math.round(distanceToLight),
        distanceMeters: Math.round(distanceToLight),
        phase: isGreen ? 'GREEN' : 'RED',
        timeLeft: Math.round(timeLeft),
        recommendedSpeedKmh: Math.round(speedMps * 3.6),
        targetLight: lightOnRoute
      };

    } catch (error) {
      return { error: 'Не вдалося прокласти дорогу' };
    }
  }
}