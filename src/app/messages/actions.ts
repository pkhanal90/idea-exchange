"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function contactSellerAction(listingId: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=/listings/${listingId}`);
  }

  const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
  if (listing.sellerId === session.user.id) {
    redirect(`/listings/${listingId}`);
  }

  const thread = await prisma.messageThread.upsert({
    where: { listingId_buyerId: { listingId, buyerId: session.user.id } },
    update: {},
    create: {
      listingId,
      sellerId: listing.sellerId,
      buyerId: session.user.id,
    },
  });

  redirect(`/messages/${thread.id}`);
}

export async function sendMessageAction(threadId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/messages/${threadId}`);

  const thread = await prisma.messageThread.findUniqueOrThrow({ where: { id: threadId } });
  const isParty = thread.sellerId === session.user.id || thread.buyerId === session.user.id;
  if (!isParty) throw new Error("Forbidden");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await prisma.$transaction([
    prisma.message.create({
      data: { threadId, senderId: session.user.id, body },
    }),
    prisma.messageThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    }),
  ]);

  revalidatePath(`/messages/${threadId}`);
  revalidatePath("/messages");
}
