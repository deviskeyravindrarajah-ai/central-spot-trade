import { Megaphone } from "lucide-react";
import { ADMOB_UNITS, type AdUnitKey } from "@/lib/ads";
import { cn } from "@/lib/utils";

type AdSlotProps = {
  unit: AdUnitKey;
  format?: "native" | "banner";
  className?: string;
};

/**
 * Reserved AdMob placement. AdMob serves only inside a native shell, so on the
 * web build this renders a labelled sponsored slot with the real unit id
 * attached for the native wrapper to pick up.
 */
export function AdSlot({ unit, format = "banner", className }: AdSlotProps) {
  return (
    <div
      role="complementary"
      aria-label="Sponsored"
      data-ad-unit={ADMOB_UNITS[unit]}
      data-ad-format={format}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/50 text-center",
        format === "native" ? "h-28 px-4" : "h-16 px-3",
        className,
      )}
    >
      <Megaphone className="h-4 w-4 text-muted-foreground" aria-hidden />
      <div className="text-left">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Sponsored
        </p>
        <p className="text-[10px] text-muted-foreground">Ad slot reserved</p>
      </div>
    </div>
  );
}
