// Draft language — a starting point modeled on standard idea-submission /
// public-disclosure consent forms used by invention-submission and pitch
// marketplace platforms. Flagged to the user as needing attorney review
// before being treated as final; wording can be updated here without
// touching any of the places that render this component.
export function ConsentDocument({
  listingTitle,
  listingId,
  submitterName,
  date,
}: {
  listingTitle: string;
  listingId?: string;
  submitterName: string;
  date: string;
}) {
  return (
    <article className="text-left text-sm leading-relaxed text-ink-700">
      <h3 className="text-center text-base font-semibold text-ink-900">
        Idea Submission &amp; Public Disclosure Consent
      </h3>
      <p className="mt-1 text-center text-xs text-ink-400">
        Regarding &ldquo;{listingTitle || "this listing"}&rdquo;
        {listingId && ` · Reference ${listingId}`}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="font-semibold uppercase tracking-wide text-ink-400">Submitter</p>
          <p className="mt-1 text-ink-800">{submitterName}</p>
        </div>
        <div>
          <p className="font-semibold uppercase tracking-wide text-ink-400">Platform</p>
          <p className="mt-1 text-ink-800">Idea Exchange</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-400">Date: {date}</p>

      <div className="mt-5 space-y-3">
        <p>
          This Consent is given by the undersigned (&ldquo;Submitter&rdquo;) in connection with
          Submitter&apos;s voluntary submission of the idea referenced above (&ldquo;the
          Idea&rdquo;) to Idea Exchange (&ldquo;the Platform&rdquo;) for potential public
          listing.
        </p>
        <p>
          <span className="font-semibold text-ink-900">1. Representations and Warranties.</span>{" "}
          Submitter represents and warrants that: (a) Submitter is the sole owner of the Idea, or
          holds all rights necessary to disclose and offer it for sale or investment; (b) the
          Idea does not, to Submitter&apos;s knowledge, infringe any third party&apos;s
          intellectual property rights; (c) disclosure of the Idea does not breach any
          confidentiality obligation Submitter owes to a current or former employer or any other
          party; and (d) all information provided about the Idea is accurate to the best of
          Submitter&apos;s knowledge.
        </p>
        <p>
          <span className="font-semibold text-ink-900">2. Consent to Public Disclosure.</span>{" "}
          Submitter understands and agrees that summary information about the Idea (including its
          title, category, and general description) will be visible to the public on the
          Platform, and that more detailed materials may be shown to prospective buyers or
          investors who separately accept a confidentiality agreement with respect to those
          materials. Submitter acknowledges that the Platform cannot guarantee the confidentiality
          of any information submitted and recommends Submitter take any protective steps (e.g.,
          provisional patent filing, copyright registration) deemed necessary before submission.
        </p>
        <p>
          <span className="font-semibold text-ink-900">3. No Guarantee of Outcome.</span>{" "}
          Submitter understands that listing the Idea does not guarantee a sale, investment, or
          any transaction, and that the Platform does not vet the intentions or credibility of any
          buyer or investor beyond the measures described in its Terms of Service.
        </p>
        <p>
          <span className="font-semibold text-ink-900">4. Release.</span> Submitter releases the
          Platform, its operators, and affiliates from any claim arising out of Submitter&apos;s
          decision to publicly disclose the Idea, except for claims arising from the
          Platform&apos;s own breach of its stated confidentiality commitments to buyers or
          investors under a separate NDA.
        </p>
        <p>
          <span className="font-semibold text-ink-900">5. Electronic Signature.</span> By checking
          the box and typing their full legal name, Submitter agrees this constitutes a legally
          binding electronic signature of this Consent.
        </p>
      </div>
    </article>
  );
}
