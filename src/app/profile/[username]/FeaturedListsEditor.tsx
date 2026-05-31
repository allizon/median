"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { updateFeaturedListsAction } from "./actions";

type List = {
  id: string;
  name: string;
  visibility: string;
  featuredOnProfile: boolean;
  profilePosition: number | null;
  _count: { items: number };
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Featured Lists</h2>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
    );
  }

  const pinnableLists = available.filter(
    (l) => l.visibility === "public" || l.visibility === "friends"
  );

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
        Pin lists to your profile. Only public or friends-only lists can be featured. Drag to reorder.
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
            <span className="text-sm font-medium flex-1">{list.name}</span>
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
              <span className="text-sm">{list.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
