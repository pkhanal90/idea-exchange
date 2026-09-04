import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo, initials } from "@/lib/utils";
import { ArrowLeft, Inbox, MessageSquare } from "lucide-react";

export default async function MessagesInboxPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/messages");

  const userId = session.user.id;

  const threads = await prisma.messageThread.findMany({
    where: { OR: [{ sellerId: userId }, { buyerId: userId }] },
    include: {
      listing: { select: { id: true, title: true } },
      seller: { select: { id: true, name: true, email: true } },
      buyer: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const unreadCounts = await prisma.message.groupBy({
    by: ["threadId"],
    where: {
      threadId: { in: threads.map((t) => t.id) },
      senderId: { not: userId },
      readAt: null,
    },
    _count: { _all: true },
  });
  const unreadByThread = new Map(unreadCounts.map((u) => [u.threadId, u._count._all]));

  return (
    <Container className="max-w-3xl py-10">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>

      <div className="mb-6 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-ink-400" />
        <h1 className="text-2xl font-semibold text-ink-900">Messages</h1>
      </div>

      {threads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Inbox className="h-8 w-8 text-ink-300" />
            <p className="mt-3 text-sm font-medium text-ink-700">No conversations yet</p>
            <p className="mt-1 max-w-sm text-sm text-ink-400">
              Message a seller from any listing page, or a buyer will reach out once they&apos;re
              interested in one of yours.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => {
            const otherParty = thread.sellerId === userId ? thread.buyer : thread.seller;
            const lastMessage = thread.messages[0];
            const unread = unreadByThread.get(thread.id) ?? 0;
            return (
              <Link key={thread.id} href={`/messages/${thread.id}`}>
                <Card className="transition-colors hover:bg-ink-50">
                  <CardContent className="flex items-center gap-3 py-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
                      {initials(otherParty.name ?? otherParty.email)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-ink-900">
                          {otherParty.name ?? otherParty.email}
                        </p>
                        {lastMessage && (
                          <span className="shrink-0 text-xs text-ink-400">
                            {timeAgo(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-ink-400">Re: {thread.listing.title}</p>
                      {lastMessage && (
                        <p className="mt-0.5 truncate text-sm text-ink-500">{lastMessage.body}</p>
                      )}
                    </div>
                    {unread > 0 && <Badge tone="accent">{unread} new</Badge>}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
