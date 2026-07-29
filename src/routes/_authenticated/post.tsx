import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Film, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { profileQuery, referenceDataQuery } from "@/lib/queries";
import { CATEGORY_ATTRIBUTES, MAX_IMAGES, MAX_VIDEO_SECONDS } from "@/lib/constants";
import { digitsOnly, formatLkr } from "@/lib/format";
import { compressImage, getVideoDuration, isVideoTooLong, uploadMedia } from "@/lib/media";
import type { ListingAttributes } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/post")({
  head: () => ({
    meta: [
      { title: "Post a Free Ad — TradeSpot Central" },
      {
        name: "description",
        content:
          "Publish a free classified ad in Kandy, Matale or Nuwara Eliya. Up to 5 photos, one 60-second video and LKR pricing.",
      },
      { property: "og:title", content: "Post a Free Ad — TradeSpot Central" },
      {
        property: "og:description",
        content: "List vehicles, land, electronics or spare parts across the Central Province.",
      },
    ],
  }),
  component: PostAdWizard,
});

const detailsSchema = z.object({
  title: z.string().trim().min(6, "Title must be at least 6 characters").max(255),
  description: z.string().trim().min(20, "Add at least 20 characters of description").max(5000),
  price: z.number().positive("Enter a price above zero"),
  district_id: z.number().int().positive("Select a district"),
  city_id: z.number().int().positive("Select a city"),
});

type ImageItem = { id: string; file: File; preview: string };

function PostAdWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { data: reference } = useQuery(referenceDataQuery);
  const { data: profile } = useQuery(profileQuery(userId));

  const [step, setStep] = useState(1);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [video, setVideo] = useState<{ file: File; duration: number } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [attributes, setAttributes] = useState<ListingAttributes>({});
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);

  useEffect(() => {
    if (profile) {
      setDistrictId((prev) => prev ?? profile.district_id);
      setCityId((prev) => prev ?? profile.city_id);
    }
  }, [profile]);

  useEffect(() => () => images.forEach((img) => URL.revokeObjectURL(img.preview)), [images]);

  const subcategories = useMemo(
    () => (reference?.subcategories ?? []).filter((s) => s.category_id === categoryId),
    [reference, categoryId],
  );
  const cities = useMemo(
    () => (reference?.cities ?? []).filter((c) => c.district_id === districtId),
    [reference, districtId],
  );
  const attributeFields = categoryId ? (CATEGORY_ATTRIBUTES[categoryId] ?? []) : [];

  const inputClass =
    "mt-1 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

  async function handleImagePick(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`You can upload a maximum of ${MAX_IMAGES} photos.`);
      return;
    }
    const accepted = files.slice(0, room);
    if (files.length > room) {
      toast.error(`Only ${room} more photo${room === 1 ? "" : "s"} allowed (max ${MAX_IMAGES}).`);
    }
    setImages((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  }

  async function handleVideoPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const duration = await getVideoDuration(file);
      if (isVideoTooLong(duration)) {
        toast.error(
          `Video is ${Math.round(duration)}s long. Maximum allowed is ${MAX_VIDEO_SECONDS} seconds.`,
        );
        return;
      }
      setVideo({ file, duration });
      toast.success(`Video added (${Math.round(duration)}s).`);
    } catch {
      toast.error("Could not read this video file.");
    }
  }

  const publish = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("You must be signed in to post an ad.");
      const parsed = detailsSchema.safeParse({
        title,
        description,
        price: Number(price),
        district_id: districtId ?? 0,
        city_id: cityId ?? 0,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (!categoryId || !subcategoryId) throw new Error("Select a category and subcategory.");
      if (images.length < 1) throw new Error("Add at least 1 photo.");

      const imagePaths: string[] = [];
      for (const item of images) {
        const compressed = await compressImage(item.file);
        imagePaths.push(await uploadMedia(userId, compressed, "jpg"));
      }

      let videoPath: string | null = null;
      if (video) {
        const extension = video.file.name.split(".").pop()?.toLowerCase() || "mp4";
        videoPath = await uploadMedia(userId, video.file, extension);
      }

      const { data, error } = await supabase
        .from("listings")
        .insert({
          seller_id: userId,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          district_id: parsed.data.district_id,
          city_id: parsed.data.city_id,
          title: parsed.data.title,
          description: parsed.data.description,
          price_lkr: parsed.data.price,
          is_negotiable: negotiable,
          images: imagePaths,
          video_url: videoPath,
          attributes,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Your ad is live!");
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      navigate({ to: "/listing/$id", params: { id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const steps = ["Category", "Media", "Details", "Publish"];

  return (
    <div className="px-4 py-5">
      <h1 className="font-display text-lg font-bold">Post an Ad</h1>
      <p className="text-xs text-muted-foreground">Free forever — no listing fees, no commissions.</p>

      <ol className="mt-4 flex items-center gap-1">
        {steps.map((label, index) => {
          const value = index + 1;
          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={
                  step >= value
                    ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                    : "flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
                }
              >
                {step > value ? <Check className="h-3.5 w-3.5" aria-hidden /> : value}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
            </li>
          );
        })}
      </ol>

      <div className="surface-card mt-5 space-y-4 p-4">
        {step === 1 && (
          <>
            <h2 className="text-sm font-semibold">Step 1 · Choose a category</h2>
            <div className="grid grid-cols-2 gap-2">
              {(reference?.categories ?? []).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(category.id);
                    setSubcategoryId(null);
                    setAttributes({});
                  }}
                  className={
                    categoryId === category.id
                      ? "rounded-lg border-2 border-primary bg-accent px-3 py-3 text-left text-xs font-semibold"
                      : "rounded-lg border border-border px-3 py-3 text-left text-xs font-medium"
                  }
                >
                  {category.name}
                </button>
              ))}
            </div>

            {categoryId && (
              <label className="block text-xs font-semibold">
                Subcategory
                <select
                  value={subcategoryId ?? ""}
                  onChange={(e) => setSubcategoryId(e.target.value ? Number(e.target.value) : null)}
                  className={inputClass}
                >
                  <option value="">Select a subcategory</option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-sm font-semibold">Step 2 · Photos & video</h2>
            <p className="text-xs text-muted-foreground">
              1–{MAX_IMAGES} photos (auto-compressed) and 1 optional video under {MAX_VIDEO_SECONDS}{" "}
              seconds.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {images.map((image) => (
                <div key={image.id} className="relative">
                  <img
                    src={image.preview}
                    alt="Selected upload preview"
                    className="h-24 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setImages((prev) => prev.filter((i) => i.id !== image.id))}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground">
                  <ImagePlus className="h-5 w-5" aria-hidden />
                  <span className="text-[10px] font-medium">Add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImagePick}
                  />
                </label>
              )}
            </div>

            {video ? (
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
                <span className="flex items-center gap-2 text-xs font-medium">
                  <Film className="h-4 w-4" aria-hidden />
                  {video.file.name} · {Math.round(video.duration)}s
                </span>
                <button
                  type="button"
                  onClick={() => setVideo(null)}
                  className="text-xs font-semibold text-destructive"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-3 text-xs font-medium text-muted-foreground">
                <Film className="h-4 w-4" aria-hidden />
                Add a video (max {MAX_VIDEO_SECONDS}s)
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoPick} />
              </label>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-sm font-semibold">Step 3 · Details & price</h2>

            <label className="block text-xs font-semibold">
              Ad title
              <input
                value={title}
                maxLength={255}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Toyota Vitz 2018 — Kandy"
                className={inputClass}
              />
            </label>

            <label className="block text-xs font-semibold">
              Description
              <textarea
                rows={4}
                maxLength={5000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <label className="block text-xs font-semibold">
              Price (LKR)
              <input
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(digitsOnly(e.target.value))}
                placeholder="1500000"
                className={inputClass}
              />
            </label>
            <p className="price-tag -mt-2 text-base">{formatLkr(Number(price || 0))}</p>

            <label className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-xs font-semibold">
              Price is negotiable
              <input
                type="checkbox"
                checked={negotiable}
                onChange={(e) => setNegotiable(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
            </label>

            {attributeFields.length > 0 && (
              <div className="space-y-3 border-t border-border pt-3">
                <h3 className="text-xs font-semibold">Specifications</h3>
                {attributeFields.map((field) => (
                  <label key={field.key} className="block text-xs font-semibold">
                    {field.label}
                    {field.suffix ? ` (${field.suffix})` : ""}
                    {field.type === "select" ? (
                      <select
                        value={String(attributes[field.key] ?? "")}
                        onChange={(e) =>
                          setAttributes((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className={inputClass}
                      >
                        <option value="">Select</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "boolean" ? (
                      <span className="mt-1 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(attributes[field.key])}
                          onChange={(e) =>
                            setAttributes((prev) => ({ ...prev, [field.key]: e.target.checked }))
                          }
                          className="h-4 w-4 accent-[var(--color-primary)]"
                        />
                        <span className="text-xs font-normal text-muted-foreground">Yes</span>
                      </span>
                    ) : (
                      <input
                        inputMode={field.type === "number" ? "numeric" : "text"}
                        value={String(attributes[field.key] ?? "")}
                        onChange={(e) =>
                          setAttributes((prev) => ({
                            ...prev,
                            [field.key]:
                              field.type === "number"
                                ? Number(digitsOnly(e.target.value) || 0)
                                : e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    )}
                  </label>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
              <label className="block text-xs font-semibold">
                District
                <select
                  value={districtId ?? ""}
                  onChange={(e) => {
                    setDistrictId(e.target.value ? Number(e.target.value) : null);
                    setCityId(null);
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
                  value={cityId ?? ""}
                  onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : null)}
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
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-sm font-semibold">Step 4 · Review & publish</h2>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Title</dt>
                <dd className="text-right font-semibold">{title || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Price</dt>
                <dd className="price-tag">{formatLkr(Number(price || 0))}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Photos</dt>
                <dd className="font-semibold">{images.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Video</dt>
                <dd className="font-semibold">{video ? `${Math.round(video.duration)}s` : "None"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Location</dt>
                <dd className="font-semibold">
                  {(reference?.cities ?? []).find((c) => c.id === cityId)?.name ?? "—"},{" "}
                  {(reference?.districts ?? []).find((d) => d.id === districtId)?.name ?? "—"}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              disabled={publish.isPending}
              onClick={() => publish.mutate()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {publish.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {publish.isPending ? "Publishing…" : "Publish my ad"}
            </button>
          </>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="h-11 flex-1 rounded-lg border border-border text-sm font-semibold disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          disabled={step === 4}
          onClick={() => {
            if (step === 1 && (!categoryId || !subcategoryId)) {
              toast.error("Select a category and subcategory to continue.");
              return;
            }
            if (step === 2 && images.length < 1) {
              toast.error("Add at least 1 photo to continue.");
              return;
            }
            setStep((s) => Math.min(4, s + 1));
          }}
          className="h-11 flex-1 rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
