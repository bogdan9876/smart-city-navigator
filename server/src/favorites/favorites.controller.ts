import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUserId } from '../auth/user.decorator';

@UseGuards(ClerkAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  create(@CurrentUserId() userId: string, @Body() data: any) {
    return this.favoritesService.create(userId, data);
  }

  @Get()
  findAll(@CurrentUserId() userId: string) {
    return this.favoritesService.findAllByUser(userId);
  }

  @Patch(':id')
  updateName(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body('customName') customName: string,
  ) {
    return this.favoritesService.updateName(id, userId, customName);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.favoritesService.remove(id, userId);
  }
}
