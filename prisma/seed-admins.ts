import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create a default tenant for system admins
  const systemTenant = await prisma.tenant.upsert({
    where: { id: 'system-tenant' },
    update: {},
    create: {
      id: 'system-tenant',
      name: 'SRM System Administration',
    },
  });

  const admins = [
    {
      email: 'admin@futuracareers.tech',
      password: 'Futura@2024!',
      name: 'Futura Admin',
    },
    {
      email: 'admin@amtrcies.com',
      password: 'Amtrcies@2024!',
      name: 'Amtrcies Admin',
    },
  ];

  for (const admin of admins) {
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
      },
      create: {
        email: admin.email,
        password: hashedPassword,
        fullName: admin.name,
        role: 'ADMIN',
        tenantId: systemTenant.id,
      },
    });
    console.log(`Admin created: ${admin.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
