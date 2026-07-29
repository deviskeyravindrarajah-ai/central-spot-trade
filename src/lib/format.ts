/** Formats a numeric amount as Sri Lankan Rupees, e.g. 1500000 -> "Rs. 1,500,000". */
export function formatLkr(value: number | string | null | undefined): string {
  const amount = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(amount)) return "Rs. 0";
  const rounded = Math.round(amount * 100) / 100;
  const hasCents = rounded % 1 !== 0;
  return `Rs. ${rounded.toLocaleString("en-LK", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Keeps only digits from a raw price input string. */
export function digitsOnly(input: string): string {
  return input.replace(/[^\d]/g, "");
}

/** Converts a local Sri Lankan number to the international wa.me format (94XXXXXXXXX). */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("94")) return digits;
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  return `94${digits}`;
}

export function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function humanizeKey(key: string): string {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
