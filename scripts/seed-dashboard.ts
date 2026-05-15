import { PrismaClient, RepairStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const userEmail = 'suresh.20232859@iit.ac.lk';
  console.log(`[Seed] Finding user: ${userEmail}...`);

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user || !user.tenantId || !user.shopId) {
    console.error(`[Seed] User not found or missing tenantId/shopId. Please login first.`);
    return;
  }

  const tenantId = user.tenantId;
  const shopId = user.shopId;

  console.log(`[Seed] Found Tenant: ${tenantId}, Shop: ${shopId}`);
  console.log(`[Seed] Generating 1 month of dashboard data...`);

  // Clear existing dummy data for this tenant (optional, but safe for repairs/customers)
  await prisma.repair.deleteMany({ where: { tenantId } });
  await prisma.customer.deleteMany({ where: { tenantId } });
  // We'll leave technicians if they exist, or create some.
  await prisma.user.deleteMany({ where: { tenantId, role: 'TECHNICIAN' } });

  // 1. Create Technicians
  const techs = [];
  for (let i = 1; i <= 3; i++) {
    const tech = await prisma.user.create({
      data: {
        tenantId,
        shopId,
        email: `tech${i}@srm.com`,
        password: await bcrypt.hash('password123', 10),
        fullName: `Technician ${i}`,
        role: 'TECHNICIAN',
        isActive: true,
      },
    });
    techs.push(tech);
  }
  console.log(`[Seed] Created ${techs.length} Technicians.`);

  // 2. Create Customers
  const customers = [];
  for (let i = 1; i <= 10; i++) {
    const cust = await prisma.customer.create({
      data: {
        tenantId,
        shopId,
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        phone: `+9470123456${i}`,
      },
    });
    customers.push(cust);
  }
  console.log(`[Seed] Created ${customers.length} Customers.`);

  // 3. Create Repairs (Spread over last 30 days)
  const statuses: RepairStatus[] = [
    RepairStatus.NOT_STARTED,
    RepairStatus.IN_PROGRESS,
    RepairStatus.READY_TO_TAKE,
    RepairStatus.DELIVERED,
    RepairStatus.PAID,
  ];
  let totalRevenue = 0;

  const brands = ['Apple', 'Samsung', 'Dell', 'Sony'];
  const types = ['Mobile', 'Laptop', 'Tablet', 'Console'];

  for (let i = 1; i <= 50; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const price = Math.floor(Math.random() * 15000) + 1000;

    if (status === RepairStatus.DELIVERED || status === RepairStatus.PAID) {
      totalRevenue += price;
    }

    const customerId = customers[Math.floor(Math.random() * customers.length)].id;

    const device = await prisma.device.create({
      data: {
        tenantId,
        shopId,
        customerId,
        brand: brands[Math.floor(Math.random() * brands.length)],
        model: `Model X-${Math.floor(Math.random() * 100)}`,
        type: types[Math.floor(Math.random() * types.length)],
      },
    });

    await prisma.repair.create({
      data: {
        tenantId,
        shopId,
        customerId,
        deviceId: device.id,
        reference: `SEED-${tenantId.slice(0, 8)}-${i}-${Date.now()}`,
        technicianId: techs[Math.floor(Math.random() * techs.length)].id,
        issue: `Screen cracked or battery issue #${i}`,
        status,
        estimatedCost: price,
        createdAt: date,
        updatedAt: date,
      },
    });
  }

  console.log(`[Seed] Created 50 Repairs (Total Revenue: LKR ${totalRevenue}).`);
  console.log(`[Seed] ✅ Dashboard Data Seeding Complete!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
