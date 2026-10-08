"use client";

import { useState } from "react";
import { Input, Label, Select } from "@/components/ui/form";
import { HEARD_ABOUT_OPTIONS } from "@/lib/acquisition";

const NEEDS_DETAIL: Record<string, string> = {
  friend: "Who told you? (optional)",
  newsletter: "Which one? (optional)",
  other: "Where? (optional)",
};

// Optional question shown under the account-type cards. Lives inside the
// onboarding <form>, so its values travel with whichever card is clicked.
export function HeardAboutField() {
  const [choice, setChoice] = useState("");
  const detailPlaceholder = NEEDS_DETAIL[choice];

  return (
    <div className="mx-auto mt-8 max-w-sm text-left">
      <Label htmlFor="heardAbout">How did you hear about Idea Exchange? (optional)</Label>
      <Select
        id="heardAbout"
        name="heardAbout"
        value={choice}
        onChange={(e) => setChoice(e.target.value)}
      >
        <option value="">Select one</option>
        {HEARD_ABOUT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </Select>
      {detailPlaceholder && (
        <Input
          name="heardAboutDetail"
          className="mt-2"
          maxLength={200}
          placeholder={detailPlaceholder}
        />
      )}
    </div>
  );
}
