import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';

@ApiTags('Favorites')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @ApiOperation({ summary: 'Додати улюблений маршрут' })
  @ApiResponse({ status: 201, description: 'Маршрут успішно збережено' })
  @ApiResponse({ status: 409, description: 'Маршрут вже збережено' })
  create(@CurrentUserId() userId: string, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Отримати всі улюблені маршрути користувача' })
  @ApiResponse({ status: 200, description: 'Список маршрутів' })
  findAll(@CurrentUserId() userId: string) {
    return this.favoritesService.findAllByUser(userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Перейменувати улюблений маршрут' })
  @ApiParam({ name: 'id', description: 'ID маршруту' })
  @ApiResponse({ status: 200, description: 'Маршрут перейменовано' })
  @ApiResponse({ status: 404, description: 'Маршрут не знайдено' })
  @ApiResponse({ status: 403, description: 'Немає доступу до цього маршруту' })
  updateName(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFavoriteDto,
  ) {
    return this.favoritesService.updateName(id, userId, dto.customName);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Видалити улюблений маршрут' })
  @ApiParam({ name: 'id', description: 'ID маршруту' })
  @ApiResponse({ status: 204, description: 'Маршрут видалено' })
  @ApiResponse({ status: 404, description: 'Маршрут не знайдено' })
  @ApiResponse({ status: 403, description: 'Немає доступу до цього маршруту' })
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.favoritesService.remove(id, userId);
  }
}
