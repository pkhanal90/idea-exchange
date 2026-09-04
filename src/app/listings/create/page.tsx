import { Container } from "@/components/ui/container";
import { CreateListingForm } from "@/components/listings/create-listing-form";

export default function CreateListingPage() {
  return (
    <Container className="max-w-3xl py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900 sm:text-3xl">List an idea</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Submit a structured brief for review. Approved listings go live in the public
          marketplace with a teaser view; full details stay behind an NDA.
        </p>
      </div>
      <CreateListingForm />
    </Container>
  );
}
