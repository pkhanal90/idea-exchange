import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// The pitch deck itself lives in a private Blob store and is only ever
// fetched server-side (see pitchDeckKey on Listing) — this route is the one
// place a client can reach the bytes, and it re-checks NDA acceptance (or
// ownership/admin) on every request, so access can't be bypassed by a leaked
// link and is revoked the moment the underlying NdaAcceptance would be.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { sellerId: true, pitchDeckKey: true },
  });
  if (!listing?.pitchDeckKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = listing.sellerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const hasNda =
    isOwner ||
    isAdmin ||
    Boolean(
      await prisma.ndaAcceptance.findUnique({
        where: { listingId_userId: { listingId: id, userId: session.user.id } },
      }),
    );

  if (!hasNda) {
    return NextResponse.json({ error: "Accept this listing's NDA first" }, { status: 403 });
  }

  const blob = await get(listing.pitchDeckKey, { access: "private" });
  if (!blob) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="pitch-deck.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
