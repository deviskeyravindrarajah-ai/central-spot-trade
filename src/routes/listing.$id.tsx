import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MessageCircle,
  Phone,
  MessageSquare,
} from "lucide-react";
import { listingQuery, referenceDataQuery } from "@/lib/queries";
import { MediaImage } from "@/components/MediaImage";
import { AdSlot } from "@/components/AdSlot";
import { SAFETY_WARNING } from "@/lib/constants";
import { formatLkr, formatRelativeDate, humanizeKey, toWhatsAppNumber } from "@/lib/format";
import { resolveMediaUrls } from "@/lib/media";

export const Route = createFileRoute("/listing/$id")({
  head: () => ({
    meta: [
      { title: "Ad Details — TradeSpot Central" },
      {
        name: "description",
        content:
          "View full specifications, photos and seller contact options for this Central Province classified ad.",
      },
      { property: "og:title", content: "Ad Details — TradeSpot Central" },
      {
        property: "og:description",
        content: "Call, WhatsApp or SMS the seller directly. Always inspect items in person.",
      },
    ],
  }),
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const { data: listing, isLoading } = useQuery(listingQuery(id));
  const { data: reference } = useQuery(referenceDataQuery);
  const [index, setIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (listing?.video_url) {
      resolveMediaUrls([listing.video_url]).then((map) => {
        if (active) setVideoUrl(map[listing.video_url!] ?? null);
      });
    } else {
      setVideoUrl(null);
    }
    return () => {
      active = false;
    };
  }, [listing?.video_url]);

  const location = useMemo(() => {
    if (!listing || !reference) return "";
    const city = reference.cities.find((c) => c.id === listing.city_id)?.name;
    const district = reference.districts.find((d) => d.id === listing.district_id)?.name;
    return [city, district].filter(Boolean).join(", ");
  }, [listing, reference]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <div className="h-60 animate-pulse rounded-xl bg-muted" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="px-4 py-16 text-center">
        <h1 className="text-lg font-semibold">Ad not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This listing may have been removed or sold.
        </p>
        <Link to="/" className="mt-5 inline-block text-sm font-semibold text-secondary">
          Back to home feed
        </Link>
      </div>
    );
  }

  const images = listing.images ?? [];
  const phone = listing.profiles?.phone_number ?? "";
  const waNumber = toWhatsAppNumber(phone);
  const waText = encodeURIComponent(`Hi, I'm interested in your TradeSpot ad: ${listing.title}`);
  const specEntries = Object.entries(listing.attributes ?? {}).filter(
    ([, value]) => value !== "" && value !== null && value !== undefined,
  );

  return (
    <div className="pb-6">
      <div className="relative bg-muted">
        {images.length > 0 ? (
          <MediaImage path={images[index]} alt={listing.title} className="h-72 w-full object-cover" />
        ) : (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            No photos
          </div>
        )}

        <Link
          to="/"
          aria-label="Back"
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 shadow-sm"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Link>

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((image, i) => (
                <span
                  key={image}
                  className={
                    i === index
                      ? "h-1.5 w-5 rounded-full bg-primary"
                      : "h-1.5 w-1.5 rounded-full bg-card/80"
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="space-y-4 px-4 py-4">
        <div>
          <h1 className="font-display text-lg font-bold leading-snug">{listing.title}</h1>
          <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {location}
            </span>
            <span>{formatRelativeDate(listing.created_at)}</span>
          </p>
          <p className="price-tag mt-2 text-2xl">
            {formatLkr(listing.price_lkr)}
            {listing.is_negotiable && (
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 align-middle text-[11px] font-semibold text-accent-foreground">
                Negotiable
              </span>
            )}
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
          <p className="text-[11px] leading-relaxed text-foreground">{SAFETY_WARNING}</p>
        </div>

        {videoUrl && (
          <div>
            <h2 className="mb-2 text-sm font-semibold">Video</h2>
            <video src={videoUrl} controls playsInline className="w-full rounded-xl bg-black" />
          </div>
        )}

        {specEntries.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Specifications</h2>
            <dl className="grid grid-cols-2 gap-2">
              {specEntries.map(([key, value]) => (
                <div key={key} className="rounded-lg bg-muted px-3 py-2">
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {humanizeKey(key)}
                  </dt>
                  <dd className="text-xs font-semibold">
                    {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-semibold">Description</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {listing.description}
          </p>
        </section>

        <section className="surface-card p-3">
          <h2 className="text-sm font-semibold">Seller</h2>
          <p className="text-xs text-muted-foreground">
            {listing.profiles?.full_name ?? "TradeSpot member"}
          </p>
        </section>

        <AdSlot unit="detailBanner" />

        <div className="pb-16" />
      </div>

      {phone && (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full max-w-md grid-cols-3 gap-2 border-t border-border bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <a
            href={`tel:${phone}`}
            className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-primary text-xs font-semibold text-primary-foreground"
          >
            <Phone className="h-4 w-4" aria-hidden />
            Call
          </a>
          <a
            href={`https://wa.me/${waNumber}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-secondary text-xs font-semibold text-secondary-foreground"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            WhatsApp
          </a>
          <a
            href={`sms:${phone}`}
            className="flex h-11 items-center justify-center gap-1.5 rounded-lg border border-border text-xs font-semibold"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            SMS
          </a>
        </div>
      )}
    </div>
  );
}
