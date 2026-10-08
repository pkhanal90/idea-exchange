"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Input, Label, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { LINK_BUILDER_SOURCES, slugCampaign as slug } from "@/lib/acquisition";

// Builds a tagged link for one post or message, so every channel (and every
// individual video) shows up as its own row in the Acquisition report.
export function UtmLinkBuilder({ baseUrl }: { baseUrl: string }) {
  const [source, setSource] = useState<string>(LINK_BUILDER_SOURCES[0].source);
  const [campaign, setCampaign] = useState("launch-day-1");
  const [path, setPath] = useState("/");
  const [copied, setCopied] = useState(false);

  const entry = LINK_BUILDER_SOURCES.find((s) => s.source === source) ?? LINK_BUILDER_SOURCES[0];
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const params = new URLSearchParams({ utm_source: entry.source, utm_medium: entry.medium });
  if (slug(campaign)) params.set("utm_campaign", slug(campaign));
  const link = `${baseUrl}${cleanPath.replace(/[?#].*$/, "")}?${params.toString()}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; the link is still selectable below.
    }
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="utm-source">Where will you post it?</Label>
          <Select id="utm-source" value={source} onChange={(e) => setSource(e.target.value)}>
            {LINK_BUILDER_SOURCES.map((s) => (
              <option key={s.source} value={s.source}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="utm-campaign">Campaign or post name</Label>
          <Input
            id="utm-campaign"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="e.g. launch-day-1"
          />
        </div>
        <div>
          <Label htmlFor="utm-path">Send people to</Label>
          <Input id="utm-path" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg border border-border bg-ink-50 px-3 py-2 font-mono text-xs text-ink-700"
          aria-label="Tagged link"
        />
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
