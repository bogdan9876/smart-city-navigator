import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface RouteResult {
  distanceMeters: number;
  coords: [number, number][];
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  constructor(private readonly httpService: HttpService) {}

  async getRoute(
    userLat: number,
    userLng: number,
    destLat: number,
    destLng: number,
  ): Promise<RouteResult> {
    const url =
      `http://router.project-osrm.org/route/v1/driving/` +
      `${userLng},${userLat};${destLng},${destLat}` +
      `?overview=full&geometries=geojson`;

    this.logger.debug(`Fetching route: ${userLat},${userLng} → ${destLat},${destLng}`);

    const response = await firstValueFrom(this.httpService.get<{ routes: any[] }>(url));
    const routeData = response.data.routes[0];

    return {
      distanceMeters: routeData.distance as number,
      coords: routeData.geometry.coordinates as [number, number][],
    };
  }
}
