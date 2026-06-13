/**
 * UI label aliases.
 *
 * The default "Wishlist" list is presented to users as "Watchlist". The
 * codebase and database keep the original "Wishlist" terminology (column
 * `isDefaultWishlist`, list name, server actions, etc.) — this is a UI-only
 * rename. See CLAUDE.md ("Wishlist → Watchlist UI alias").
 */
export const WISHLIST_LABEL = "Watchlist";

/** Display name for a list, aliasing the default wishlist to "Watchlist". */
export function listDisplayName(list: {
  name: string;
  isDefaultWishlist: boolean;
}): string {
  return list.isDefaultWishlist ? WISHLIST_LABEL : list.name;
}
