import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Car, Home as HomeIcon, Smartphone, Wrench, Search, ShieldCheck } from "lucide-react";
import { listingsQuery, referenceDataQuery } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TradeSpot Central — Buy & Sell in Kandy, Matale, Nuwara Eliya" },
      {
        name: "description",
        content:
          "Browse the latest free classified ads across Sri Lanka's Central Province: vehicles, land, phones, laptops and auto spare parts.",
      },
      { property: "og:title", content: "TradeSpot Central — Central Province Classifieds" },
      {
        property: "og:description",
        content: "Latest vehicles, property, electronics and spare parts near you. Always free.",
      },
    ],
  }),
  component: HomeFeed,
});

const CATEGORY_ICONS: Record<string, typeof Car> = {
  car: Car,
  home: HomeIcon,
  smartphone: Smartphone,
  wrench: Wrench,
};

function HomeFeed() {
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const { data: reference } = useQuery(referenceDataQuery);
  const { data: listings, isLoading } = useQuery(
    listingsQuery({ districtId, search: search.trim() || undefined }),
  );

  const cityMap = useMemo(
    () => new Map((reference?.cities ?? []).map((c) => [c.id, c.name])),
    [reference],
  );
  const districtMap = useMemo(
    () => new Map((reference?.districts ?? []).map((d) => [d.id, d.name])),
    [reference],
  );

  const locationTabs = [
    { id: null, name: "All Central" },
    ...(reference?.districts ?? []).map((d) => ({ id: d.id as number | null, name: d.name })),
  ];

  return (
    <div>
      <header className="bg-primary px-4 pb-5 pt-6 text-primary-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" aria-hidden />
          <div>
            <h1 className="font-display text-lg font-bold leading-tight">TradeSpot Central</h1>
            <p className="text-xs opacity-90">Kandy · Matale · Nuwara Eliya</p>
          </div>
        </div>

        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vehicles, land, phones…"
            aria-label="Search listings"
            className="h-11 w-full rounded-xl border-0 bg-card pl-9 pr-3 text-sm text-foreground outline-none ring-offset-2 placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {locationTabs.map((tab) => (
            <button
              key={tab.name}
              type="button"
              onClick={() => setDistrictId(tab.id)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                districtId === tab.id
                  ? "bg-card text-primary"
                  : "bg-primary-foreground/15 text-primary-foreground",
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </header>

      <section className="px-4 py-5">
        <h2 className="text-sm font-semibold">Browse categories</h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {(reference?.categories ?? []).map((category) => {
            const Icon = CATEGORY_ICONS[category.icon_name] ?? Car;
            return (
              <Link
                key={category.id}
                to="/explore"
                search={{ category: category.id }}
                className="surface-card flex flex-col items-center gap-1.5 px-1 py-3 text-center"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
                  <Icon className="h-4.5 w-4.5 text-accent-foreground" aria-hidden />
                </span>
                <span className="text-[10px] font-medium leading-tight">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Latest ads</h2>
          <Link to="/explore" search={{}} className="text-xs font-semibold text-secondary">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="space-y-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                cityName={cityMap.get(listing.city_id)}
                districtName={districtMap.get(listing.district_id)}
              />
            ))}
          </div>
        ) : (
          <div className="surface-card px-4 py-10 text-center">
            <p className="text-sm font-semibold">No ads here yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Be the first to post an ad in the Central Province.
            </p>
            <Link
              to="/post"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Post an ad
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
