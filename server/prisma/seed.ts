import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { trafficLights } from '../src/modules/traffic/data/lights.data';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Seeding ${trafficLights.length} traffic lights…`);

  for (const light of trafficLights) {
    await prisma.trafficLight.upsert({
      where: { id: light.id },
      update: {
        name: light.name,
        lat: light.lat,
        lng: light.lng,
        green: light.green,
        red: light.red,
        start: new Date(light.start),
      },
      create: {
        id: light.id,
        name: light.name,
        lat: light.lat,
        lng: light.lng,
        green: light.green,
        red: light.red,
        start: new Date(light.start),
      },
    });
  }

  console.log('Done ✓');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
