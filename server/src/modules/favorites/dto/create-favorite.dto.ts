import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({ example: 'Робота', description: 'Назва улюбленого маршруту' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  customName: string;

  @ApiProperty({ example: 49.8397, description: 'Широта точки призначення' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 24.0297, description: 'Довгота точки призначення' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 'вул. Дорошенка 1, Львів', description: 'Оригінальна адреса' })
  @IsString()
  @IsNotEmpty()
  originalAddress: string;
}
