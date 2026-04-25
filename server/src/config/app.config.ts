export const appConfig = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  clerk: {
    secretKey: process.env.CLERK_SECRET_KEY ?? '',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
} as const;
