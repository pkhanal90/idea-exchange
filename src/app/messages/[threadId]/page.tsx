import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { MessageThreadView } from "@/components/messages/message-thread-view";
import { CategoryIcon } from "@/components/listings/category-icon";
import { ArrowLeft } from "lucide-react";

interface ThreadPageProps {
  params: Promise<{ threadId: string }>;
}

export default async function MessageThreadPage({ params }: ThreadPageProps) {
  const { threadId } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/messages/${threadId}`);

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: {
      listing: { select: { id: true, title: true, status: true, category: true } },
      seller: { select: { id: true, name: true, email: true } },
      buyer: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!thread) notFound();

  const userId = session.user.id;
  const isParty = thread.sellerId === userId || thread.buyerId === userId;
  if (!isParty) notFound();

  const otherParty = thread.sellerId === userId ? thread.buyer : thread.seller;

  const unreadIds = thread.messages
    .filter((m) => m.senderId !== userId && !m.readAt)
    .map((m) => m.id);
  if (unreadIds.length > 0) {
    await prisma.message.updateMany({
      where: { id: { in: unreadIds } },
      data: { readAt: new Date() },
    });
  }

  return (
    <Container className="max-w-3xl py-10">
      <Link
        href="/messages"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All conversations
      </Link>

      <div className="flex items-center gap-3">
        <CategoryIcon category={thread.listing.category} size="sm" />
        <div>
          <h1 className="text-lg font-semibold text-ink-900">
            {otherParty.name ?? otherParty.email}
          </h1>
          <Link
            href={`/listings/${thread.listing.id}`}
            className="text-sm text-accent-700 hover:text-accent-800"
          >
            Re: {thread.listing.title}
          </Link>
        </div>
      </div>

      <MessageThreadView
        threadId={thread.id}
        currentUserId={userId}
        messages={thread.messages.map((m) => ({
          id: m.id,
          body: m.body,
          senderId: m.senderId,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </Container>
  );
}
