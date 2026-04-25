import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(private readonly db: DatabaseService) {}

  async create(userId: string, dto: CreateFavoriteDto) {
    const existing = await this.db.favoriteRoute.findFirst({
      where: { userId, originalAddress: dto.originalAddress },
    });

    if (existing) {
      throw new ConflictException('Цей маршрут вже збережено');
    }

    const route = await this.db.favoriteRoute.create({
      data: { ...dto, userId },
    });

    this.logger.log(`User ${userId} added favorite: ${dto.originalAddress}`);
    return route;
  }

  async findAllByUser(userId: string) {
    return this.db.favoriteRoute.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateName(id: string, userId: string, customName: string) {
    const route = await this.db.favoriteRoute.findUnique({ where: { id } });

    if (!route) throw new NotFoundException(`Маршрут з ID "${id}" не знайдено`);
    if (route.userId !== userId) throw new ForbiddenException('Немає доступу до цього маршруту');

    return this.db.favoriteRoute.update({
      where: { id },
      data: { customName },
    });
  }

  async remove(id: string, userId: string) {
    const route = await this.db.favoriteRoute.findUnique({ where: { id } });

    if (!route) throw new NotFoundException(`Маршрут з ID "${id}" не знайдено`);
    if (route.userId !== userId) throw new ForbiddenException('Немає доступу до цього маршруту');

    await this.db.favoriteRoute.delete({ where: { id } });
    this.logger.log(`User ${userId} removed favorite: ${id}`);
  }
}
