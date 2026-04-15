import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RoutingService {
  constructor(private readonly httpService: HttpService) {}

  async getRoute(
    userLat: number,
    userLng: number,
    destLat: number,
    destLng: number,
  ) {
    const url = `http://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const response = await firstValueFrom(this.httpService.get(url));
    const routeData = response.data.routes[0];
    const coords = routeData.geometry.coordinates;

    return {
      distanceMeters: routeData.distance,
      coords,
    };
  }
}
