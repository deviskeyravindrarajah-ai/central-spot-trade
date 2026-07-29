import { Link } from "@tanstack/react-router";
import { MapPin, Tag } from "lucide-react";
import { MediaImage } from "./MediaImage";
import { formatLkr, formatRelativeDate } from "@/lib/format";
import type { ListingWithSeller } from "@/lib/types";

type ListingCardProps = {
  listing: ListingWithSeller;
  cityName?: string;
  districtName?: string;
};

export function ListingCard({ listing, cityName, districtName }: ListingCardProps) {
  return (
    <Link
      to="/listing/$id"
      params={{ id: listing.id }}
      className="surface-card flex gap-3 overflow-hidden p-2 transition-transform active:scale-[0.99]"
    >
      <MediaImage
        path={listing.images?.[0]}
        alt={listing.title}
        className="h-24 w-24 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1 py-0.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{listing.title}</h3>
        <p className="price-tag mt-1 text-base">{formatLkr(listing.price_lkr)}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {(cityName || districtName) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden />
              {[cityName, districtName].filter(Boolean).join(", ")}
            </span>
          )}
          {listing.is_negotiable && (
            <span className="inline-flex items-center gap-1 text-primary">
              <Tag className="h-3 w-3" aria-hidden />
              Negotiable
            </span>
          )}
          <span>{formatRelativeDate(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
