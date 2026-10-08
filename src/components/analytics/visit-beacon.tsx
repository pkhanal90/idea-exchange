"use client";

import { useEffect } from "react";

// Sends one anonymous visit ping per browsing session (plus one more if the
// session later arrives through a differently-tagged link). Skips entirely
// when the browser signals Do Not Track / Global Privacy Control. Renders
// nothing; failures are swallowed — analytics must never affect the page.
export function VisitBeacon() {
  useEffect(() => {
    try {
      const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
      if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;

      const { pathname, search } = window.location;
      const tagged = /[?&]utm_/.test(search);
      const sent = sessionStorage.getItem("ix_visit");
      if (sent && !(tagged && sent !== search)) return;
      sessionStorage.setItem("ix_visit", tagged ? search : "1");

      void fetch("/api/analytics/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, search, referrer: document.referrer }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // sessionStorage can throw in private/blocked-storage modes.
    }
  }, []);

  return null;
}
