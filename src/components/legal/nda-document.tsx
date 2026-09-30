// The single source of truth for NDA wording — rendered identically for a
// seller previewing the agreement before submitting their listing, and for
// a buyer accepting it before viewing full details. Only the header fields
// (listing title/reference, party labels, date) vary per listing; the body
// text never changes. Keeping one component means there's no way for the
// seller-facing and buyer-facing copies to drift apart.
export function NdaDocument({
  listingTitle,
  listingId,
  disclosingParty,
  receivingParty,
  date,
}: {
  listingTitle: string;
  listingId?: string;
  disclosingParty: string;
  receivingParty: string;
  date: string;
}) {
  return (
    <article className="text-left text-sm leading-relaxed text-ink-700">
      <h3 className="text-center text-base font-semibold text-ink-900">
        Confidentiality and Non-Disclosure Agreement
      </h3>
      <p className="mt-1 text-center text-xs text-ink-400">
        Regarding &ldquo;{listingTitle || "this listing"}&rdquo;
        {listingId && ` · Reference ${listingId}`}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="font-semibold uppercase tracking-wide text-ink-400">Disclosing Party</p>
          <p className="mt-1 text-ink-800">{disclosingParty}</p>
        </div>
        <div>
          <p className="font-semibold uppercase tracking-wide text-ink-400">Receiving Party</p>
          <p className="mt-1 text-ink-800">{receivingParty}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-400">Date: {date}</p>

      <div className="mt-5 space-y-3">
        <p>
          This Agreement is entered into between the Disclosing Party (the seller of the
          above-referenced listing) and the Receiving Party (a prospective buyer or investor
          granted access to confidential materials related to the listing) on Idea Exchange.
        </p>
        <p>
          By accepting this Agreement, the Receiving Party acknowledges that any confidential
          information disclosed in connection with the listing referenced above — including but
          not limited to the proposed solution, technical approach, financial projections, and
          go-to-market strategy — will be used solely to evaluate a potential acquisition or
          investment in the listed idea, will not be disclosed to any third party, and will not
          be used to develop a competing product or service.
        </p>
        <p className="text-ink-500">
          This is a simulated agreement generated for prototype purposes on Idea Exchange and
          does not constitute a binding legal contract.
        </p>
      </div>
    </article>
  );
}
