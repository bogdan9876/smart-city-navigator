import 'dotenv/config';
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { TrafficModule } from './modules/traffic/traffic.module';

@Module({
  imports: [
    DatabaseModule,
    FavoritesModule,
    TrafficModule,
  ],
})
export class AppModule {}
