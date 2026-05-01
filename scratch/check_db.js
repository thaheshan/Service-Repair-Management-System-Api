const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const requests = await prisma.registrationRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('--- Registration Requests ---');
  console.log(JSON.stringify(requests, null, 2));

  const users = await prisma.user.findMany({
    where: { email: 'suresh.20232859@iit.ac.lk' }
  });
  console.log('\n--- User Check ---');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
