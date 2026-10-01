import { prisma } from "@/lib/prisma";

export async function getUnreadMessageCount(userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      senderId: { not: userId },
      readAt: null,
      thread: { OR: [{ sellerId: userId }, { buyerId: userId }] },
    },
  });
}
