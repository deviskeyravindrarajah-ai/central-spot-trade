import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { z } from "zod";
import { listingsQuery, referenceDataQuery } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { CONDITION_OPTIONS } from "@/lib/constants";
import { digitsOnly, formatLkr } from "@/lib/format";

const searchSchema = z.object({
  category: z.number().optional(),
});

export const Route = createFileRoute("/explore")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search & Filter Ads — TradeSpot Central" },
      {
        name: "description",
        content:
          "Filter Central Province classifieds by category, district, city, price range in LKR and item condition.",
      },
      { property: "og:title", content: "Search Central Province Ads — TradeSpot Central" },
      {
        property: "og:description",
        content: "Advanced filters for vehicles, land, electronics and spare parts in Sri Lanka.",
      },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const { category } = Route.useSearch();
  const { data: reference } = useQuery(referenceDataQuery);

  const [showFilters, setShowFilters] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(category ?? null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [condition, setCondition] = useState<string | null>(null);

  const filters = {
    search: search.trim() || undefined,
    categoryId,
    subcategoryId,
    districtId,
    cityId,
    minPrice: minPrice ? Number(minPrice) : null,
    maxPrice: maxPrice ? Number(maxPrice) : null,
    condition,
  };

  const { data: listings, isLoading } = useQuery(listingsQuery(filters));

  const subcategories = useMemo(
    () => (reference?.subcategories ?? []).filter((s) => !categoryId || s.category_id === categoryId),
    [reference, categoryId],
  );
  const cities = useMemo(
    () => (reference?.cities ?? []).filter((c) => !districtId || c.district_id === districtId),
    [reference, districtId],
  );
  const cityMap = useMemo(
    () => new Map((reference?.cities ?? []).map((c) => [c.id, c.name])),
    [reference],
  );
  const districtMap = useMemo(
    () => new Map((reference?.districts ?? []).map((d) => [d.id, d.name])),
    [reference],
  );

  const resetFilters = () => {
    setSearch("");
    setCategoryId(null);
    setSubcategoryId(null);
    setDistrictId(null);
    setCityId(null);
    setMinPrice("");
    setMaxPrice("");
    setCondition(null);
  };

  const selectClass =
    "h-10 w-full rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all ads…"
            aria-label="Search listings"
            className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-label="Toggle filters"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </header>

      {showFilters && (
        <section className="space-y-3 border-b border-border bg-card px-4 pb-4 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              Category
              <select
                className={selectClass}
                value={categoryId ?? ""}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  setCategoryId(value);
                  setSubcategoryId(null);
                }}
              >
                <option value="">All categories</option>
                {(reference?.categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-muted-foreground">
              Subcategory
              <select
                className={selectClass}
                value={subcategoryId ?? ""}
                onChange={(e) => setSubcategoryId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">All</option>
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-muted-foreground">
              District
              <select
                className={selectClass}
                value={districtId ?? ""}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  setDistrictId(value);
                  setCityId(null);
                }}
              >
                <option value="">All Central</option>
                {(reference?.districts ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-muted-foreground">
              City
              <select
                className={selectClass}
                value={cityId ?? ""}
                onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">All cities</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-muted-foreground">
              Min price (LKR)
              <input
                inputMode="numeric"
                value={minPrice}
                onChange={(e) => setMinPrice(digitsOnly(e.target.value))}
                placeholder="0"
                className={selectClass}
              />
            </label>

            <label className="text-xs font-medium text-muted-foreground">
              Max price (LKR)
              <input
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) => setMaxPrice(digitsOnly(e.target.value))}
                placeholder="Any"
                className={selectClass}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Condition:</span>
            {CONDITION_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCondition(condition === option ? null : option)}
                className={
                  condition === option
                    ? "rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                    : "rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                }
              >
                {option}
              </button>
            ))}
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-secondary"
            >
              <X className="h-3 w-3" aria-hidden />
              Reset
            </button>
          </div>

          {(minPrice || maxPrice) && (
            <p className="text-xs text-muted-foreground">
              Showing {minPrice ? formatLkr(Number(minPrice)) : "Rs. 0"} –{" "}
              {maxPrice ? formatLkr(Number(maxPrice)) : "any price"}
            </p>
          )}
        </section>
      )}

      <section className="space-y-3 px-4 py-4">
        <h1 className="text-sm font-semibold">
          {isLoading ? "Searching…" : `${listings?.length ?? 0} result${listings?.length === 1 ? "" : "s"}`}
        </h1>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))
        ) : listings && listings.length > 0 ? (
          listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              cityName={cityMap.get(listing.city_id)}
              districtName={districtMap.get(listing.district_id)}
            />
          ))
        ) : (
          <div className="surface-card px-4 py-10 text-center">
            <p className="text-sm font-semibold">Nothing matched those filters</p>
            <p className="mt-1 text-xs text-muted-foreground">Try widening your price or location.</p>
            <Link to="/" className="mt-4 inline-block text-sm font-semibold text-secondary">
              Back to home feed
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
