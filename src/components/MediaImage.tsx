import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { resolveMediaUrls } from "@/lib/media";
import { cn } from "@/lib/utils";

type MediaImageProps = {
  path: string | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

export function MediaImage({ path, alt, className, loading = "lazy" }: MediaImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    if (!path) return;
    resolveMediaUrls([path])
      .then((map) => {
        if (active) setUrl(map[path] ?? null);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [path]);

  if (!path || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <ImageOff className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (!url) {
    return <div className={cn("animate-pulse bg-muted", className)} aria-hidden />;
  }

  return (
    <img
      src={url}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
