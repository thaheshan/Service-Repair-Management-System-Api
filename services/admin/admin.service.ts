import { prisma } from "@/db/prisma";

export const getSuperAdminStats = async () => {
  const [totalShops, totalUsers, pendingRequests] = await Promise.all([
    prisma.shop.count(),
    prisma.user.count(),
    prisma.registrationRequest.count({ where: { status: 'PENDING' } }),
  ]);

  // For "Today's Inquiries", we can count registration requests created today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayInquiries = await prisma.registrationRequest.count({
    where: {
      createdAt: {
        gte: today,
      },
    },
  });

  return {
    totalShops,
    totalUsers,
    pendingRequests,
    todayInquiries,
  };
};

export const getAllShops = async () => {
  return await prisma.shop.findMany({
    include: {
      tenant: true,
      _count: {
        select: { users: true, repairs: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
};
