import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { ChevronRight, Info, LogOut, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { myListingsQuery, profileQuery, referenceDataQuery } from "@/lib/queries";
import { MediaImage } from "@/components/MediaImage";
import { formatLkr, formatRelativeDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My Account & Ads — TradeSpot Central" },
      {
        name: "description",
        content:
          "Manage your TradeSpot Central profile, review your published ads and mark items as sold.",
      },
      { property: "og:title", content: "My Account — TradeSpot Central" },
      {
        property: "og:description",
        content: "Your profile, contact details and Central Province listings in one place.",
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId, user } = useAuth();
  const { data: profile } = useQuery(profileQuery(userId));
  const { data: reference } = useQuery(referenceDataQuery);
  const { data: listings, isLoading } = useQuery(myListingsQuery(userId));

  const location = useMemo(() => {
    if (!profile || !reference) return "";
    const city = reference.cities.find((c) => c.id === profile.city_id)?.name;
    const district = reference.districts.find((d) => d.id === profile.district_id)?.name;
    return [city, district].filter(Boolean).join(", ");
  }, [profile, reference]);

  async function markSold(id: string, status: string) {
    const next = status === "sold" ? "active" : "sold";
    const { error } = await supabase.from("listings").update({ status: next }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next === "sold" ? "Marked as sold." : "Ad is live again.");
    queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (profile?.full_name ?? "TS")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="px-4 py-5">
      <h1 className="font-display text-lg font-bold">Account</h1>

      <section className="surface-card mt-4 flex items-center gap-3 p-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-base font-bold text-accent-foreground">
          {profile?.avatar_url ? (
            <MediaImage
              path={profile.avatar_url}
              alt={profile.full_name}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{profile?.full_name ?? "Complete your profile"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <p className="truncate text-xs text-muted-foreground">
            {profile?.phone_number} {location && `· ${location}`}
          </p>
        </div>
      </section>

      {profile && (
        <section className="surface-card mt-3 space-y-2 p-4 text-xs">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">NIC</span>
            <span className="font-semibold">{profile.nic_number}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Address</span>
            <span className="max-w-[60%] text-right font-semibold">{profile.address}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-semibold">{formatRelativeDate(profile.created_at)}</span>
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">My ads</h2>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        ) : listings && listings.length > 0 ? (
          <ul className="space-y-2">
            {listings.map((listing) => (
              <li key={listing.id} className="surface-card flex items-center gap-3 p-2.5">
                <MediaImage
                  path={listing.images?.[0] ?? ""}
                  alt={listing.title}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/listing/$id"
                    params={{ id: listing.id }}
                    className="block truncate text-xs font-semibold"
                  >
                    {listing.title}
                  </Link>
                  <p className="price-tag text-sm">{formatLkr(listing.price_lkr)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {listing.status === "sold" ? "Sold" : "Active"} ·{" "}
                    {formatRelativeDate(listing.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => markSold(listing.id, listing.status)}
                  className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold"
                >
                  {listing.status === "sold" ? "Relist" : "Mark sold"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="surface-card px-4 py-8 text-center">
            <p className="text-sm font-semibold">No ads yet</p>
            <Link to="/post" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-secondary">
              <Pencil className="h-4 w-4" aria-hidden />
              Post your first ad
            </Link>
          </div>
        )}
      </section>

      <section className="mt-6 space-y-2">
        <Link
          to="/about"
          className="surface-card flex items-center justify-between px-4 py-3 text-sm font-semibold"
        >
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4 text-secondary" aria-hidden />
            About & Developers
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
        </Link>

        <button
          type="button"
          onClick={signOut}
          className="surface-card flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-destructive"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </section>
    </div>
  );
}
