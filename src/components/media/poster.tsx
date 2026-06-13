"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { backfillPosterPath } from "@/lib/actions/media";

interface MediaPosterProps {
  mediaId: string;
  title: string;
  posterPath: string | null;
  externalId: string | null;
}

export function MediaPoster({ mediaId, title, posterPath, externalId }: MediaPosterProps) {
  const [path, setPath] = useState<string | null>(posterPath);
  const [loading, setLoading] = useState(!posterPath && !!externalId);

  useEffect(() => {
    if (posterPath || !externalId) return;

    let cancelled = false;
    backfillPosterPath(mediaId).then((result) => {
      if (cancelled) return;
      if (result.status === "ok") setPath(result.posterPath);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [mediaId, posterPath, externalId]);

  if (!path) {
    if (!loading) return null;
    return (
      <div className="aspect-[2/3] w-full max-w-[400px] rounded-xl bg-muted animate-pulse" />
    );
  }

  return (
    <div className="relative aspect-[2/3] w-full max-w-[400px] rounded-xl overflow-hidden bg-muted">
      <Image
        src={`https://image.tmdb.org/t/p/w500${path}`}
        alt={`${title} poster`}
        fill
        className="object-cover"
      />
    </div>
  );
}
