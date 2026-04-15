import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: any) {
    const existing = await this.prisma.favoriteRoute.findFirst({
      where: { userId, originalAddress: data.originalAddress },
    });
    if (existing) {
      throw new ConflictException('Цей маршрут вже збережено');
    }

    return this.prisma.favoriteRoute.create({
      data: { ...data, userId },
    });
  }

  async findAllByUser(userId: string) {
    return await this.prisma.favoriteRoute.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateName(id: string, userId: string, customName: string) {
    const route = await this.prisma.favoriteRoute.findUnique({ where: { id } });
    if (!route) throw new NotFoundException('Route not found');
    if (route.userId !== userId) throw new ForbiddenException('Not your route');

    return this.prisma.favoriteRoute.update({
      where: { id },
      data: { customName },
    });
  }

  async remove(id: string, userId: string) {
    const route = await this.prisma.favoriteRoute.findUnique({ where: { id } });
    if (!route) throw new NotFoundException('Route not found');
    if (route.userId !== userId) throw new ForbiddenException('Not your route');

    return this.prisma.favoriteRoute.delete({ where: { id } });
  }
}
