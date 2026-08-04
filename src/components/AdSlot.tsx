import { Megaphone } from "lucide-react";
import { resolveAdUnitId, type AdUnitKey } from "@/lib/ads";
import { useAdTestMode } from "@/hooks/useAdTestMode";
import { cn } from "@/lib/utils";

type AdSlotProps = {
  unit: AdUnitKey;
  format?: "native" | "banner";
  className?: string;
};

/**
 * Reserved AdMob placement. AdMob serves only inside a native shell, so on the
 * web build this renders a labelled sponsored slot with the resolved unit id
 * attached for the native wrapper to pick up.
 */
export function AdSlot({ unit, format = "banner", className }: AdSlotProps) {
  const { testMode } = useAdTestMode();

  return (
    <div
      role="complementary"
      aria-label="Sponsored"
      data-ad-unit={resolveAdUnitId(unit, testMode)}
      data-ad-format={format}
      data-ad-test-mode={testMode ? "true" : "false"}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/50 text-center",
        format === "native" ? "h-28 px-4" : "h-16 px-3",
        className,
      )}
    >
      <Megaphone className="h-4 w-4 text-muted-foreground" aria-hidden />
      <div className="text-left">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Sponsored{testMode ? " · Test" : ""}
        </p>
        <p className="text-[10px] text-muted-foreground">Ad slot reserved</p>
      </div>
    </div>
  );
}
