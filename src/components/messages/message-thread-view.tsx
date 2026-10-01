"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { sendMessageAction } from "@/app/messages/actions";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreadMessage {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  wasUnread?: boolean;
}

export function MessageThreadView({
  threadId,
  currentUserId,
  messages,
}: {
  threadId: string;
  currentUserId: string;
  messages: ThreadMessage[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = sendMessageAction.bind(null, threadId);
  const firstUnreadIndex = messages.findIndex((m) => m.wasUnread);

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-400">
            No messages yet — say hello to get the conversation started.
          </p>
        ) : (
          messages.map((m, i) => {
            const isMine = m.senderId === currentUserId;
            return (
              <div key={m.id}>
                {i === firstUnreadIndex && (
                  <div className="my-1 flex items-center gap-2">
                    <div className="h-px flex-1 bg-accent-200" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">
                      New
                    </span>
                    <div className="h-px flex-1 bg-accent-200" />
                  </div>
                )}
                <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-xl px-3.5 py-2.5 text-sm",
                      isMine
                        ? "bg-gradient-to-br from-accent-500 to-accent-700 text-white"
                        : m.wasUnread
                          ? "bg-accent-50 text-ink-800 ring-1 ring-accent-200"
                          : "bg-ink-100 text-ink-800",
                    )}
                  >
                    <p className="whitespace-pre-line">{m.body}</p>
                    <p
                      className={cn(
                        "mt-1 text-[11px]",
                        isMine ? "text-white/60" : "text-ink-400",
                      )}
                    >
                      {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        ref={formRef}
        action={async (formData) => {
          await boundAction(formData);
          formRef.current?.reset();
        }}
        className="flex items-end gap-2"
      >
        <textarea
          name="body"
          required
          rows={2}
          maxLength={5000}
          placeholder="Write a message…"
          className="w-full flex-1 resize-none rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
        <SendButton />
      </form>
    </div>
  );
}

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" disabled={pending}>
      <Send className="h-4 w-4" />
    </Button>
  );
}
