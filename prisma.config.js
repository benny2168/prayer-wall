// Prisma 7 configuration (Zero-dependency version for production)
export default {
  datasource: {
    url: process.env.DATABASE_URL
  }
};
