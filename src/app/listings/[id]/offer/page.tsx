import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OfferTermsForm } from "@/components/offers/offer-terms-form";
import { createOfferAction } from "@/app/offers/actions";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface OfferPageProps {
  params: Promise<{ id: string }>;
}

export default async function MakeOfferPage({ params }: OfferPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/listings/${id}/offer`);

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) notFound();
  if (listing.sellerId === session.user.id) redirect(`/listings/${id}`);
  if (listing.listingType === "AUCTION") redirect(`/listings/${id}`);
  if (listing.status !== "PUBLISHED") redirect(`/listings/${id}`);

  const boundAction = createOfferAction.bind(null, listing.id);

  return (
    <Container className="max-w-lg py-10">
      <Link
        href={`/listings/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to listing
      </Link>

      <Card>
        <CardHeader>
          <h1 className="text-base font-semibold text-ink-900">Make an offer</h1>
          <p className="mt-1 text-sm text-ink-500">
            {listing.title}
            {listing.askingPrice && (
              <> · asking {formatCurrency(listing.askingPrice as never)}</>
            )}
          </p>
        </CardHeader>
        <CardContent>
          <OfferTermsForm action={boundAction} submitLabel="Send offer" />
        </CardContent>
      </Card>
    </Container>
  );
}
