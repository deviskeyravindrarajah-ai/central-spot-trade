import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { APP_NAME, APP_VERSION, DEVELOPERS, DEVELOPER_EMAIL, SAFETY_WARNING } from "@/lib/constants";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About TradeSpot Central & Developers" },
      {
        name: "description",
        content:
          "TradeSpot Central is a 100% free peer-to-peer classifieds marketplace for Kandy, Matale and Nuwara Eliya. Meet the team behind it.",
      },
      { property: "og:title", content: "About TradeSpot Central" },
      {
        property: "og:description",
        content: "Our mission, safety guidance and the developers building Central Province's marketplace.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
          <ShieldCheck className="h-6 w-6 text-primary-foreground" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold">{APP_NAME}</h1>
          <p className="text-xs text-muted-foreground">Version {APP_VERSION}</p>
        </div>
      </div>

      <section className="surface-card mt-5 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-secondary" aria-hidden />
          Our mission
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {APP_NAME} is a 100% free, peer-to-peer classifieds marketplace built exclusively for Sri
          Lanka's Central Province. No listing fees, no commissions, no middlemen — buyers and
          sellers connect directly by call, WhatsApp or SMS.
        </p>
      </section>

      <section className="surface-card mt-3 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="h-4 w-4 text-secondary" aria-hidden />
          Where we operate
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Kandy, Matale and Nuwara Eliya districts. Every ad is tied to a real Central Province city
          so you only browse what is genuinely nearby.
        </p>
      </section>

      <section className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <h2 className="text-sm font-semibold text-destructive">Safety first</h2>
        <p className="mt-2 text-[13px] leading-relaxed">{SAFETY_WARNING}</p>
      </section>

      <section className="surface-card mt-3 p-4">
        <h2 className="text-sm font-semibold">Developers</h2>
        <ul className="mt-2 space-y-2">
          {DEVELOPERS.map((name) => (
            <li key={name} className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </span>
              <span className="text-sm font-medium">{name}</span>
            </li>
          ))}
        </ul>
        <a
          href={`mailto:${DEVELOPER_EMAIL}`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-secondary"
        >
          <Mail className="h-4 w-4" aria-hidden />
          {DEVELOPER_EMAIL}
        </a>
      </section>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link to="/" className="font-semibold text-secondary">
          Back to the home feed
        </Link>
      </p>
    </div>
  );
}
