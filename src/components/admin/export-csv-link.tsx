import { Download } from "lucide-react";

// A plain <a>, not next/link's <Link> — Link's client-side navigation
// intercepts the click and expects an RSC response, which breaks a Route
// Handler that returns a CSV file with a Content-Disposition header. A
// normal anchor lets the browser handle the download as usual.
export function ExportCsvLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-white px-3 text-sm font-medium text-ink-800 transition-colors hover:bg-ink-50"
    >
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </a>
  );
}
