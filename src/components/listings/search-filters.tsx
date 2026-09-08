import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, PRICE_RANGES, STAGE_LABELS } from "@/lib/constants";
import { Search } from "lucide-react";

export function SearchFilters({
  q,
  category,
  stage,
  price,
  sort,
}: {
  q?: string;
  category?: string;
  stage?: string;
  price?: string;
  sort?: string;
}) {
  return (
    <form className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] sm:items-end">
      <div>
        <label htmlFor="q" className="mb-1.5 block text-xs font-medium text-ink-500">
          Keyword
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Search titles and problem statements"
            className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
          />
        </div>
      </div>

      <div>
        <label htmlFor="category" className="mb-1.5 block text-xs font-medium text-ink-500">
          Industry
        </label>
        <Select id="category" name="category" defaultValue={category ?? ""} className="min-w-40">
          <option value="">All industries</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label htmlFor="stage" className="mb-1.5 block text-xs font-medium text-ink-500">
          Stage
        </label>
        <Select id="stage" name="stage" defaultValue={stage ?? ""} className="min-w-36">
          <option value="">Any stage</option>
          {Object.entries(STAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label htmlFor="price" className="mb-1.5 block text-xs font-medium text-ink-500">
          Price
        </label>
        <Select id="price" name="price" defaultValue={price ?? ""} className="min-w-36">
          {PRICE_RANGES.map((range) => (
            <option key={range.label} value={range.label}>
              {range.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label htmlFor="sort" className="mb-1.5 block text-xs font-medium text-ink-500">
          Sort by
        </label>
        <Select id="sort" name="sort" defaultValue={sort ?? "trending"} className="min-w-36">
          <option value="trending">Trending</option>
          <option value="newest">Newest</option>
        </Select>
      </div>

      <Button type="submit" variant="primary" size="md">
        Apply
      </Button>
    </form>
  );
}
