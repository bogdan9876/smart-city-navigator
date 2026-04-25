import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class TrafficQueryDto {
  @ApiProperty({ example: 49.844, description: 'Широта користувача' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 24.025, description: 'Довгота користувача' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({ example: 49.816, description: 'Широта призначення' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  destLat: number;

  @ApiProperty({ example: 24.024, description: 'Довгота призначення' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  destLng: number;
}
