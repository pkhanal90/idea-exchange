"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { initials } from "@/lib/utils";
import type { UserRole } from "@prisma/client";
import { ChevronDown, Handshake, LayoutDashboard, LogOut, ShieldCheck, Store } from "lucide-react";

export function UserMenu({
  name,
  email,
  image,
  role,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const dashboardHref =
    role === "ADMIN" ? "/admin" : role === "INVESTOR" ? "/dashboard/investor" : "/dashboard/seller";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-white py-1 pl-1 pr-2.5 text-sm hover:bg-ink-50"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-7 w-7 rounded-full" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
            {initials(name ?? email)}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate font-medium text-ink-800 sm:inline">
          {name ?? email}
        </span>
        <ChevronDown className="h-4 w-4 text-ink-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg">
          <div className="border-b border-border px-3.5 py-2.5">
            <p className="truncate text-sm font-medium text-ink-900">{name ?? "Account"}</p>
            <p className="truncate text-xs text-ink-400">{email}</p>
          </div>
          <Link
            href={dashboardHref}
            className="flex items-center gap-2 px-3.5 py-2 text-sm text-ink-700 hover:bg-ink-50"
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          {role === "ADMIN" && (
            <>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3.5 py-2 text-sm text-ink-700 hover:bg-ink-50"
                onClick={() => setOpen(false)}
              >
                <ShieldCheck className="h-4 w-4" />
                Moderation queue
              </Link>
              <div className="my-1 border-t border-border" />
              <p className="px-3.5 pb-1 pt-1.5 text-xs font-medium uppercase tracking-wide text-ink-400">
                Your account
              </p>
              <Link
                href="/dashboard/seller"
                className="flex items-center gap-2 px-3.5 py-2 text-sm text-ink-700 hover:bg-ink-50"
                onClick={() => setOpen(false)}
              >
                <Store className="h-4 w-4" />
                Seller dashboard
              </Link>
              <Link
                href="/dashboard/investor"
                className="flex items-center gap-2 px-3.5 py-2 text-sm text-ink-700 hover:bg-ink-50"
                onClick={() => setOpen(false)}
              >
                <Handshake className="h-4 w-4" />
                Investor dashboard
              </Link>
            </>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-danger-500 hover:bg-danger-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
