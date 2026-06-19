"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { updateFeaturedListsAction } from "./actions";
import { listDisplayName } from "@/lib/labels";

const POSTER_BASE = "https://image.tmdb.org/t/p/w92";

type ListItem = {
  media: { id: string; title: string; type: string; posterPath: string | null };
};

type List = {
  id: string;
  name: string;
  isDefaultWishlist: boolean;
  visibility: string;
  featuredOnProfile: boolean;
  profilePosition: number | null;
  _count: { items: number };
  items: ListItem[];
};

export function FeaturedListsEditor({ lists, ownerId, username }: { lists: List[]; ownerId: string; username: string }) {
  const [editing, setEditing] = useState(false);
  const [featured, setFeatured] = useState<List[]>(() =>
    lists
      .filter((l) => l.featuredOnProfile)
      .sort((a, b) => (a.profilePosition ?? 999) - (b.profilePosition ?? 999))
  );
  const [available] = useState<List[]>(lists);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const toggle = (list: List) => {
    setFeatured((prev) =>
      prev.find((l) => l.id === list.id)
        ? prev.filter((l) => l.id !== list.id)
        : [...prev, list]
    );
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDragOver = useCallback(
    (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === idx) return;
      setFeatured((prev) => {
        const next = [...prev];
        const [item] = next.splice(dragIdx, 1);
        next.splice(idx, 0, item);
        return next;
      });
      setDragIdx(idx);
    },
    [dragIdx]
  );

  const save = async () => {
    setSaving(true);
    const updates = available.map((list) => {
      const featIdx = featured.findIndex((f) => f.id === list.id);
      return {
        id: list.id,
        featuredOnProfile: featIdx !== -1,
        profilePosition: featIdx !== -1 ? featIdx : null,
      };
    });
    await updateFeaturedListsAction(ownerId, updates);
    setSaving(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Featured Lists</h2>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
        {featured.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {featured.map((list) => (
              <a
                key={list.id}
                href={`/lists/${list.id}`}
                className="rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{listDisplayName(list)}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{list._count.items} items</span>
                </div>
                {list.items.length > 0 && (
                  <div className="flex gap-1.5">
                    {list.items.map((item) =>
                      item.media.posterPath ? (
                        <div
                          key={item.media.id}
                          className="relative aspect-[2/3] w-[38px] shrink-0 overflow-hidden rounded-md bg-muted"
                        >
                          <Image
                            src={`${POSTER_BASE}${item.media.posterPath}`}
                            alt={`${item.media.title} poster`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          key={item.media.id}
                          className="flex aspect-[2/3] w-[38px] shrink-0 items-center justify-center rounded-md bg-muted px-0.5"
                        >
                          <span className="text-[10px] leading-tight text-muted-foreground text-center line-clamp-3">
                            {item.media.title}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No featured lists yet. Click Edit to pin lists to your profile.
          </p>
        )}
      </div>
    );
  }

  const pinnableLists = available;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Featured Lists</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Pin lists to your profile. Drag to reorder.
      </p>

      <div className="space-y-2">
        {pinnableLists.map((list) => (
          <label key={list.id} className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50">
            <input
              type="checkbox"
              checked={!!featured.find((f) => f.id === list.id)}
              onChange={() => toggle(list)}
              className="rounded"
            />
            <span className="text-sm font-medium flex-1">{listDisplayName(list)}</span>
            <span className="text-xs text-muted-foreground">{list.visibility} · {list._count.items} items</span>
          </label>
        ))}
      </div>

      {featured.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Order</p>
          {featured.map((list, idx) => (
            <div
              key={list.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 cursor-grab select-none"
            >
              <span className="text-muted-foreground">⠿</span>
              <span className="text-sm">{listDisplayName(list)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
