"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNewMessageEmail } from "@/lib/notifications/message-emails";

// The textarea also caps input at this length client-side — this is the
// server-side backstop for a direct POST that skips the form, since nothing
// here validated length at all before.
const MAX_MESSAGE_LENGTH = 5000;

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

  const thread = await prisma.messageThread.findUniqueOrThrow({
    where: { id: threadId },
    include: {
      listing: { select: { title: true } },
      seller: { select: { name: true, email: true } },
      buyer: { select: { name: true, email: true } },
    },
  });
  const isSeller = thread.sellerId === session.user.id;
  const isParty = isSeller || thread.buyerId === session.user.id;
  if (!isParty) throw new Error("Forbidden");

  const body = String(formData.get("body") ?? "").trim().slice(0, MAX_MESSAGE_LENGTH);
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

  const sender = isSeller ? thread.seller : thread.buyer;
  const recipient = isSeller ? thread.buyer : thread.seller;
  await sendNewMessageEmail(recipient, sender, thread.listing, threadId, body);

  revalidatePath(`/messages/${threadId}`);
  revalidatePath("/messages");
}
