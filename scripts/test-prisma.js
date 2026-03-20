const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing Prisma Client...');
  try {
    const chain = await prisma.prayerChain.findFirst();
    console.log('First chain found:', !!chain);
    console.log('Available fields on PrayerChain:', Object.keys(chain || {}));
    
    // Check if we can use the new fields in a query
    await prisma.prayerChain.findMany({
      where: {
        isPublic: true,
        thumbnailUrl: { not: null }
      },
      take: 1
    });
    console.log('Successfully queried with new fields!');
  } catch (e) {
    console.error('Prisma Check Failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
