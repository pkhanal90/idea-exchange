"use client";

import { deleteSpendAction } from "@/app/admin/acquisition/actions";
import { Trash2 } from "lucide-react";

export function SpendDeleteButton({ id }: { id: string }) {
  return (
    <form action={deleteSpendAction.bind(null, id)}>
      <button
        type="submit"
        aria-label="Delete this spend entry"
        title="Delete"
        onClick={(e) => {
          if (!window.confirm("Delete this spend entry?")) e.preventDefault();
        }}
        className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-50 hover:text-danger-500"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
