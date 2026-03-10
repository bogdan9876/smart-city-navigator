import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { trafficLights } from './lights';

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) { }

  async calculateSpeed(userLat: number, userLng: number, lightId: number) {
    try {
      const targetLight = trafficLights.find(l => l.id === lightId);

      if (!targetLight) {
        return { error: 'Місце не знайдено' };
      }

      const url = `http://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${targetLight.lng},${targetLight.lat}?overview=false`;
      const response = await firstValueFrom(this.httpService.get(url));
      const finalDistance = response.data.routes[0].distance;

      const now = Date.now();
      const cycle = (targetLight.green + targetLight.red) * 1000;
      const elapsed = (now - targetLight.start) % cycle;
      const isGreen = elapsed < targetLight.green * 1000;

      const timeLeft = isGreen
        ? (targetLight.green * 1000 - elapsed) / 1000
        : (cycle - elapsed) / 1000;

      const speedMps = finalDistance / timeLeft;

      return {
        distanceMeters: Math.round(finalDistance),
        phase: isGreen ? 'GREEN' : 'RED',
        timeLeft: Math.round(timeLeft),
        recommendedSpeedKmh: Math.round(speedMps * 3.6),
        targetLight: { lat: targetLight.lat, lng: targetLight.lng }
      };

    } catch (error) {
      return { error: 'Не вдалося прокласти дорогу' };
    }
  }
}