import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TrafficController } from './traffic.controller';
import { TrafficService } from './traffic.service';
import { RoutingService } from './routing.service';
import { TrafficLightService } from './traffic-light.service';

@Module({
  imports: [HttpModule],
  controllers: [TrafficController],
  providers: [TrafficService, RoutingService, TrafficLightService],
  exports: [TrafficService],
})
export class TrafficModule {}
