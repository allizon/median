"use client";

import * as React from "react";
import { searchCatalog, searchTmdb, createMedia } from "@/lib/actions/media";
import type {
  CatalogResult,
  TmdbResult,
  DuplicateCandidate,
  CreateMediaInput,
} from "@/lib/actions/media";
import type { MediaPickerSelection, MediaPickerModeProps } from "./types";
import { CatalogSearchMode } from "./catalog-search-mode";
import { TmdbSearchMode } from "./tmdb-search-mode";
import { ManualEntryMode } from "./manual-entry-mode";
import { DuplicateResolver } from "./duplicate-resolver";

interface MediaPickerProps {
  /** Pre-fill the search query (e.g. from the catalog search page). */
  initialQuery?: string;
  /** Media IDs to render as already-added (e.g. items already in the target list). */
  disabledIds?: Set<string>;
  /** Called once a catalog Media record (existing or newly created) has been resolved. */
  onSelect: (media: MediaPickerSelection) => void;
}

export function MediaPicker({ initialQuery = "", disabledIds, onSelect }: MediaPickerProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [catalogResults, setCatalogResults] = React.useState<CatalogResult[]>([]);
  const [catalogSearching, setCatalogSearching] = React.useState(false);
  const [tmdbResults, setTmdbResults] = React.useState<TmdbResult[]>([]);
  const [tmdbSearching, setTmdbSearching] = React.useState(false);
  const [tmdbError, setTmdbError] = React.useState<string | null>(null);
  const [addedKeys, setAddedKeys] = React.useState<Set<string>>(new Set());
  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [duplicates, setDuplicates] = React.useState<DuplicateCandidate[]>([]);
  const [pendingInput, setPendingInput] = React.useState<CreateMediaInput | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchGenRef = React.useRef(0);

  const [step, setStep] = React.useState<"search" | "manual">("search");
  const [manualTitle, setManualTitle] = React.useState("");

  const disabledKeys = React.useMemo(() => disabledIds ?? new Set<string>(), [disabledIds]);

  const isAdded = React.useCallback(
    (key: string) => addedKeys.has(key) || disabledKeys.has(key),
    [addedKeys, disabledKeys],
  );

  // ── Search: catalog first, TMDB fallback on zero catalog results ──────
  React.useEffect(() => {
    clearTimeout(debounceRef.current);
    setActionError(null);
    setDuplicates([]);
    setPendingInput(null);

    if (!query.trim()) {
      setCatalogResults([]);
      setCatalogSearching(false);
      setTmdbResults([]);
      setTmdbSearching(false);
      setTmdbError(null);
      return;
    }

    setCatalogSearching(true);
    setTmdbResults([]);
    setTmdbError(null);

    const gen = ++searchGenRef.current;

    debounceRef.current = setTimeout(async () => {
      const catalog = await searchCatalog(query);
      if (searchGenRef.current !== gen) return;
      setCatalogResults(catalog);
      setCatalogSearching(false);

      if (catalog.length === 0) {
        setTmdbSearching(true);
        const tmdb = await searchTmdb(query);
        if (searchGenRef.current !== gen) return;
        setTmdbSearching(false);
        if (tmdb.status === "ok") {
          setTmdbResults(tmdb.results);
        } else if (tmdb.status === "error") {
          setTmdbError(tmdb.message);
        }
      }
    }, 300);

    return () => clearTimeout(debounceRef.current!);
  }, [query]);

  // ── Selection ───────────────────────────────────────────────────────

  function handleCatalogSelect(media: MediaPickerSelection) {
    if (isAdded(media.id)) return;
    setAddedKeys((prev) => new Set(prev).add(media.id));
    onSelect(media);
  }

  async function resolveCreateMedia(input: CreateMediaInput, force: boolean, key: string, title: string) {
    setSavingKey(key);
    setActionError(null);
    const result = await createMedia(input, force);
    setSavingKey(null);

    if (result.status === "error") {
      setActionError(result.message);
      return;
    }

    if (result.status === "duplicates") {
      setDuplicates(result.candidates);
      setPendingInput(input);
      return;
    }

    // status === "created"
    setDuplicates([]);
    setPendingInput(null);
    // Add both the mode-specific key AND the Prisma mediaId so that an item
    // created from TMDB later appears as "Added" when found via catalog search.
    setAddedKeys((prev) => new Set(prev).add(key).add(result.mediaId));
    onSelect({ id: result.mediaId, title });

    if (step === "manual") {
      resetManualForm();
      setStep("search");
    }
  }

  async function handleAddToCatalog(intent: { input: CreateMediaInput; key: string; title: string }) {
    const force = duplicates.length > 0;
    await resolveCreateMedia(intent.input, force, intent.key, intent.title);
  }

  function selectDuplicate(candidate: DuplicateCandidate) {
    setDuplicates([]);
    setAddedKeys((prev) => {
      const next = new Set(prev).add(candidate.id);
      if (pendingInput?.externalId) next.add(pendingInput.externalId);
      return next;
    });
    setPendingInput(null);
    onSelect({ id: candidate.id, title: candidate.title });

    if (step === "manual") {
      resetManualForm();
      setStep("search");
    }
  }

  function createAnyway() {
    if (!pendingInput) return;
    const key = pendingInput.externalId ?? "manual";
    void resolveCreateMedia(pendingInput, true, key, pendingInput.title);
  }

  // ── Manual entry ────────────────────────────────────────────────────

  function openManualEntry() {
    setManualTitle(query.trim());
    setDuplicates([]);
    setPendingInput(null);
    setActionError(null);
    setStep("manual");
  }

  function resetManualForm() {
    setManualTitle("");
  }

  // ── Shared props passed to mode components ──────────────────────────

  const modeProps: MediaPickerModeProps = {
    addedKeys,
    disabledKeys,
    savingKey,
    onSelect: handleCatalogSelect,
    onAddToCatalog: handleAddToCatalog,
  };

  // ── Render ──────────────────────────────────────────────────────────

  if (step === "manual") {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setStep("search")}
          className="self-start text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to search
        </button>

        {duplicates.length > 0 && pendingInput && (
          <DuplicateResolver
            duplicates={duplicates}
            onSelectDuplicate={selectDuplicate}
            onForceCreate={createAnyway}
          />
        )}

        {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}

        <ManualEntryMode
          initialTitle={manualTitle}
          duplicatesCount={duplicates.length}
          onAddToCatalog={handleAddToCatalog}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <input
        autoFocus
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title…"
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 shrink-0"
      />

      {duplicates.length > 0 && pendingInput && (
        <div className="shrink-0">
          <DuplicateResolver
            duplicates={duplicates}
            onSelectDuplicate={selectDuplicate}
            onForceCreate={createAnyway}
          />
        </div>
      )}

      {actionError && (
        <p role="alert" className="text-sm text-destructive shrink-0">
          {actionError}
        </p>
      )}

      <div className="flex-1 overflow-y-auto -mx-4">
        <CatalogSearchMode
          {...modeProps}
          results={catalogResults}
          searching={catalogSearching}
        />

        {!catalogSearching && catalogResults.length === 0 && (
          <>
            <TmdbSearchMode
              {...modeProps}
              results={tmdbResults}
              searching={tmdbSearching}
              error={tmdbError}
            />

            {!tmdbSearching && !tmdbError && tmdbResults.length === 0 && query.trim() && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}
          </>
        )}

        {!query.trim() && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            Type to search movies and TV shows
          </p>
        )}
      </div>

      <div className="shrink-0 pt-2 border-t text-center">
        <button
          type="button"
          onClick={openManualEntry}
          className="text-sm text-primary hover:underline underline-offset-2"
        >
          Not finding it? Add manually →
        </button>
      </div>
    </div>
  );
}
