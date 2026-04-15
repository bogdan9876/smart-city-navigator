import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { FavoritesModule } from './favorites/favorites.module';
import { TrafficModule } from './traffic/traffic.module';

@Module({
  imports: [PrismaModule, FavoritesModule, TrafficModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
