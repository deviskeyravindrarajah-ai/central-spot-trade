import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { referenceDataQuery } from "@/lib/queries";

const searchSchema = z.object({
  mode: z.enum(["signin", "register"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign In or Register — TradeSpot Central" },
      {
        name: "description",
        content:
          "Create a free TradeSpot Central account with your name, mobile number, NIC and Central Province address to start posting ads.",
      },
      { property: "og:title", content: "Join TradeSpot Central" },
      {
        property: "og:description",
        content: "Free registration for buyers and sellers in Kandy, Matale and Nuwara Eliya.",
      },
    ],
  }),
  component: AuthPage,
});

const registerSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  full_name: z.string().trim().min(2, "Full name is required").max(150),
  phone_number: z
    .string()
    .trim()
    .regex(/^0?\d{9,11}$/, "Enter a valid Sri Lankan mobile number"),
  nic_number: z
    .string()
    .trim()
    .regex(/^(\d{9}[VvXx]|\d{12})$/, "Enter a valid NIC (e.g. 199012345678 or 901234567V)"),
  district_id: z.number({ message: "Select your district" }).int().positive(),
  city_id: z.number({ message: "Select your city" }).int().positive(),
  address: z.string().trim().min(5, "Address is required").max(500),
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode } = useSearch({ from: "/auth" });
  const [tab, setTab] = useState<"signin" | "register">(mode ?? "signin");
  const [busy, setBusy] = useState(false);
  const { data: reference } = useQuery(referenceDataQuery);

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    nic_number: "",
    district_id: "",
    city_id: "",
    address: "",
  });

  const cities = useMemo(
    () =>
      (reference?.cities ?? []).filter(
        (c) => !form.district_id || c.district_id === Number(form.district_id),
      ),
    [reference, form.district_id],
  );

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const inputClass =
    "mt-1 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/" });
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    const parsed = registerSchema.safeParse({
      ...form,
      district_id: form.district_id ? Number(form.district_id) : undefined,
      city_id: form.city_id ? Number(form.city_id) : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error || !data.user) {
      setBusy(false);
      toast.error(error?.message ?? "Could not create your account.");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: parsed.data.full_name,
      phone_number: parsed.data.phone_number,
      nic_number: parsed.data.nic_number,
      district_id: parsed.data.district_id,
      city_id: parsed.data.city_id,
      address: parsed.data.address,
    });

    setBusy(false);

    if (profileError) {
      toast.error(
        data.session
          ? profileError.message
          : "Account created. Please confirm your email, then sign in to finish your profile.",
      );
      return;
    }

    toast.success("Account created — welcome to TradeSpot Central!");
    navigate({ to: "/" });
  }

  return (
    <div className="px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <ShieldCheck className="h-5 w-5 text-primary-foreground" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-lg font-bold">TradeSpot Central</h1>
          <p className="text-xs text-muted-foreground">Free classifieds for Central Province</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 rounded-xl bg-muted p-1">
        {(["signin", "register"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={
              tab === value
                ? "rounded-lg bg-card py-2 text-sm font-semibold text-primary shadow-sm"
                : "rounded-lg py-2 text-sm font-medium text-muted-foreground"
            }
          >
            {value === "signin" ? "Sign in" : "Register"}
          </button>
        ))}
      </div>

      {tab === "signin" ? (
        <form onSubmit={handleSignIn} className="surface-card space-y-4 p-4">
          <label className="block text-xs font-semibold">
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-semibold">
            Password
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => set("password")(e.target.value)}
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="surface-card space-y-4 p-4">
          <label className="block text-xs font-semibold">
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-semibold">
            Password
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => set("password")(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-semibold">
            Full name
            <input
              required
              maxLength={150}
              value={form.full_name}
              onChange={(e) => set("full_name")(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-semibold">
            Mobile number
            <input
              required
              inputMode="tel"
              placeholder="0771234567"
              value={form.phone_number}
              onChange={(e) => set("phone_number")(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-semibold">
            NIC number
            <input
              required
              placeholder="199012345678"
              value={form.nic_number}
              onChange={(e) => set("nic_number")(e.target.value)}
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold">
              District
              <select
                required
                value={form.district_id}
                onChange={(e) => {
                  set("district_id")(e.target.value);
                  set("city_id")("");
                }}
                className={inputClass}
              >
                <option value="">Select</option>
                {(reference?.districts ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold">
              City
              <select
                required
                value={form.city_id}
                onChange={(e) => set("city_id")(e.target.value)}
                className={inputClass}
              >
                <option value="">Select</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs font-semibold">
            Physical address
            <textarea
              required
              rows={3}
              maxLength={500}
              value={form.address}
              onChange={(e) => set("address")(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Your NIC and mobile number are stored for seller identification only. No verification
            code is required.
          </p>

          <button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link to="/about" className="font-semibold text-secondary">
          About TradeSpot & developers
        </Link>
      </p>
    </div>
  );
}
