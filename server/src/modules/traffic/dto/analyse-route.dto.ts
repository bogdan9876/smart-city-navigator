import { IsArray, IsNumber, IsOptional, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AnalyseRouteDto {
  /**
   * Route coordinates in GeoJSON order: [[lng, lat], [lng, lat], ...]
   * As returned by Mapbox Directions API geometry.coordinates.
   */
  @ApiProperty({
    description: 'Масив координат маршруту у форматі GeoJSON [[lng, lat], ...]',
    example: [[24.0135, 49.8343], [24.0324, 49.8416]],
    type: 'array',
    items: { type: 'array', items: { type: 'number' } },
  })
  @IsArray()
  @ArrayMinSize(2)
  coords: [number, number][];

  /**
   * Total route distance in metres — taken from Mapbox route.distance.
   * If omitted, the server computes it from coords using Haversine.
   */
  @ApiPropertyOptional({
    description: 'Загальна довжина маршруту в метрах (з Mapbox)',
    example: 2340,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalDistanceMeters?: number;
}
