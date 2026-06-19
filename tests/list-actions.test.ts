import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/repositories", () => ({
  listRepository: {
    findOwnerLists: vi.fn(),
    findDefaultWishlist: vi.fn(),
    findListItem: vi.fn(),
    createListItem: vi.fn(),
    findListByIdForOwner: vi.fn(),
    findListForUpdate: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
    findListItemWithOwner: vi.fn(),
    deleteListItem: vi.fn(),
    upsertListItemScore: vi.fn(),
    deleteListItemScore: vi.fn(),
    createListAndAdd: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/labels", () => ({
  listDisplayName: (list: { name: string; isDefaultWishlist: boolean }) => {
    if (list.isDefaultWishlist) return "Watchlist";
    return list.name;
  },
}));

import { auth } from "@/auth";
import { listRepository } from "@/lib/repositories";
import {
  getUserLists,
  addToWishlist,
  addToList,
  createList,
  updateList,
  deleteList,
  removeListItem,
  setListItemScore,
  clearListItemScore,
  createListAndAdd,
} from "@/lib/actions/list";

const mockAuth = vi.mocked(auth);
const mockFindOwnerLists = vi.mocked(listRepository.findOwnerLists);
const mockFindDefaultWishlist = vi.mocked(listRepository.findDefaultWishlist);
const mockFindListItem = vi.mocked(listRepository.findListItem);
const mockCreateListItem = vi.mocked(listRepository.createListItem);
const mockFindListByIdForOwner = vi.mocked(listRepository.findListByIdForOwner);
const mockFindListForUpdate = vi.mocked(listRepository.findListForUpdate);
const mockCreateList = vi.mocked(listRepository.createList);
const mockUpdateList = vi.mocked(listRepository.updateList);
const mockDeleteList = vi.mocked(listRepository.deleteList);
const mockFindListItemWithOwner = vi.mocked(listRepository.findListItemWithOwner);
const mockDeleteListItem = vi.mocked(listRepository.deleteListItem);
const mockUpsertListItemScore = vi.mocked(listRepository.upsertListItemScore);
const mockDeleteListItemScore = vi.mocked(listRepository.deleteListItemScore);
const mockCreateListAndAdd = vi.mocked(listRepository.createListAndAdd);


function authed() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockAuth.mockResolvedValue({ user: { id: USER_ID } } as any);
}

function unauthed() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockAuth.mockResolvedValue(null as any);
}

const LIST_ID = "c1234567890";
const MEDIA_ID = "c0987654321";
const ITEM_ID = "c1122334455";
const USER_ID = "cuser12345678";

function listRow(overrides: Record<string, unknown> = {}) {
  return {
    id: LIST_ID,
    name: "My List",
    isDefaultWishlist: false,
    visibility: "private",
    ownerId: USER_ID,
    ...overrides,
  } as never;
}

describe("getUserLists", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns empty when not authenticated", async () => {
    unauthed();
    expect(await getUserLists(MEDIA_ID)).toEqual([]);
  });

  it("returns lists with item annotations", async () => {
    authed();
    mockFindOwnerLists.mockResolvedValue([
      { id: "l1", name: "Watchlist", isDefaultWishlist: true, _count: { items: 3 }, items: [] },
      { id: "l2", name: "Favorites", isDefaultWishlist: false, _count: { items: 1 }, items: [{ id: ITEM_ID }] },
    ] as never);

    const result = await getUserLists(MEDIA_ID);

    expect(result).toEqual([
      { id: "l1", name: "Watchlist", isDefaultWishlist: true, itemCount: 3, hasItem: false },
      { id: "l2", name: "Favorites", isDefaultWishlist: false, itemCount: 1, hasItem: true },
    ]);
  });

  it("returns empty when repository throws", async () => {
    authed();
    mockFindOwnerLists.mockRejectedValue(new Error("DB error"));
    expect(await getUserLists(MEDIA_ID)).toEqual([]);
  });
});

describe("addToWishlist", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns error when not authenticated", async () => {
    unauthed();
    expect(await addToWishlist(MEDIA_ID)).toEqual({ status: "error", message: "Not authenticated" });
  });

  it("returns error when watchlist not found", async () => {
    authed();
    mockFindDefaultWishlist.mockResolvedValue(null);
    expect(await addToWishlist(MEDIA_ID)).toEqual({ status: "error", message: "Watchlist not found" });
  });

  it("returns already_exists when item is already in watchlist", async () => {
    authed();
    mockFindDefaultWishlist.mockResolvedValueOnce(listRow({ name: "Watchlist", isDefaultWishlist: true }) as never);
    mockFindListItem.mockResolvedValueOnce({ id: ITEM_ID } as never);
    expect(await addToWishlist(MEDIA_ID)).toEqual({ status: "already_exists" });
  });

  it("adds item to watchlist and returns added", async () => {
    authed();
    mockFindDefaultWishlist.mockResolvedValueOnce(listRow({ name: "Watchlist", isDefaultWishlist: true }) as never);
    mockFindListItem.mockResolvedValueOnce(null);
    mockCreateListItem.mockResolvedValueOnce({} as never);

    expect(await addToWishlist(MEDIA_ID)).toEqual({ status: "added", listName: "Watchlist" });
  });

  it("returns error when repository create fails", async () => {
    authed();
    mockFindDefaultWishlist.mockResolvedValueOnce(listRow({ name: "Watchlist", isDefaultWishlist: true }) as never);
    mockFindListItem.mockResolvedValueOnce(null);
    mockCreateListItem.mockRejectedValueOnce(new Error("DB error"));

    expect(await addToWishlist(MEDIA_ID)).toEqual({ status: "error", message: "Failed to add to watchlist. Please try again." });
  });
});

describe("addToList", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns error when not authenticated", async () => {
    unauthed();
    expect(await addToList(LIST_ID, MEDIA_ID)).toEqual({ status: "error", message: "Not authenticated" });
  });

  it("returns error for invalid input", async () => {
    authed();
    expect(await addToList("bad-id", MEDIA_ID)).toEqual({ status: "error", message: "Invalid input" });
  });

  it("returns error when list not found", async () => {
    authed();
    mockFindListByIdForOwner.mockResolvedValue(null);
    expect(await addToList(LIST_ID, MEDIA_ID)).toEqual({ status: "error", message: "List not found" });
  });

  it("returns already_exists when item is already in list", async () => {
    authed();
    mockFindListByIdForOwner.mockResolvedValueOnce(listRow() as never);
    mockFindListItem.mockResolvedValueOnce({ id: ITEM_ID } as never);
    expect(await addToList(LIST_ID, MEDIA_ID)).toEqual({ status: "already_exists" });
  });

  it("adds item and returns added", async () => {
    authed();
    mockFindListByIdForOwner.mockResolvedValueOnce(listRow() as never);
    mockFindListItem.mockResolvedValueOnce(null);
    mockCreateListItem.mockResolvedValueOnce({} as never);

    expect(await addToList(LIST_ID, MEDIA_ID)).toEqual({ status: "added", listName: "My List" });
  });

  it("returns error when repository create fails", async () => {
    authed();
    mockFindListByIdForOwner.mockResolvedValueOnce(listRow() as never);
    mockFindListItem.mockResolvedValueOnce(null);
    mockCreateListItem.mockRejectedValueOnce(new Error("DB error"));

    expect(await addToList(LIST_ID, MEDIA_ID)).toEqual({ status: "error", message: "Failed to add to list. Please try again." });
  });
});

describe("createList", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns error when not authenticated", async () => {
    unauthed();
    expect(await createList("My List", "private")).toEqual({ status: "error", message: "Not authenticated" });
  });

  it("returns error for invalid input", async () => {
    authed();
    expect(await createList("", "private")).toEqual({ status: "error", message: expect.any(String) });
  });

  it("creates a list and returns created", async () => {
    authed();
    mockCreateList.mockResolvedValueOnce({ id: LIST_ID, name: "My List" } as never);

    expect(await createList("My List", "public")).toEqual({ status: "created", id: LIST_ID, name: "My List" });
  });

  it("returns error when repository create fails", async () => {
    authed();
    mockCreateList.mockRejectedValueOnce(new Error("DB error"));

    expect(await createList("My List", "private")).toEqual({ status: "error", message: "Failed to create list. Please try again." });
  });
});

describe("updateList", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns error when not authenticated", async () => {
    unauthed();
    expect(await updateList(LIST_ID, { name: "New Name" })).toEqual({ status: "error", message: "Not authenticated" });
  });

  it("returns error when list not found", async () => {
    authed();
    mockFindListForUpdate.mockResolvedValue(null);
    expect(await updateList(LIST_ID, { name: "New Name" })).toEqual({ status: "error", message: "List not found" });
  });

  it("updates and returns updated", async () => {
    authed();
    mockFindListForUpdate.mockResolvedValueOnce(listRow() as never);
    mockUpdateList.mockResolvedValueOnce({} as never);

    expect(await updateList(LIST_ID, { name: "New Name" })).toEqual({ status: "updated" });
  });

  it("returns error when repository update fails", async () => {
    authed();
    mockFindListForUpdate.mockResolvedValueOnce(listRow() as never);
    mockUpdateList.mockRejectedValueOnce(new Error("DB error"));

    expect(await updateList(LIST_ID, { name: "New Name" })).toEqual({ status: "error", message: "Failed to update list. Please try again." });
  });
});

describe("deleteList", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns error when not authenticated", async () => {
    unauthed();
    expect(await deleteList(LIST_ID)).toEqual({ status: "error", message: "Not authenticated" });
  });

  it("returns error when list not found", async () => {
    authed();
    mockFindListForUpdate.mockResolvedValue(null);
    expect(await deleteList(LIST_ID)).toEqual({ status: "error", message: "List not found" });
  });

  it("returns error when trying to delete default wishlist", async () => {
    authed();
    mockFindListForUpdate.mockResolvedValueOnce(listRow({ isDefaultWishlist: true }) as never);
    expect(await deleteList(LIST_ID)).toEqual({ status: "error", message: "Cannot delete default Watchlist" });
  });

  it("deletes and returns deleted", async () => {
    authed();
    mockFindListForUpdate.mockResolvedValueOnce(listRow() as never);
    mockDeleteList.mockResolvedValueOnce({} as never);

    expect(await deleteList(LIST_ID)).toEqual({ status: "deleted" });
  });

  it("returns error when repository delete fails", async () => {
    authed();
    mockFindListForUpdate.mockResolvedValueOnce(listRow() as never);
    mockDeleteList.mockRejectedValueOnce(new Error("DB error"));

    expect(await deleteList(LIST_ID)).toEqual({ status: "error", message: "Failed to delete list. Please try again." });
  });
});

describe("removeListItem", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns error when not authenticated", async () => {
    unauthed();
    expect(await removeListItem(ITEM_ID)).toEqual({ status: "error", message: "Not authenticated" });
  });

  it("returns error when item not found", async () => {
    authed();
    mockFindListItemWithOwner.mockResolvedValue(null);
    expect(await removeListItem(ITEM_ID)).toEqual({ status: "error", message: "Item not found" });
  });

  it("removes and returns removed", async () => {
    authed();
    mockFindListItemWithOwner.mockResolvedValueOnce({ id: ITEM_ID, listId: LIST_ID } as never);
    mockDeleteListItem.mockResolvedValueOnce({} as never);

    expect(await removeListItem(ITEM_ID)).toEqual({ status: "removed" });
  });

  it("returns error when repository delete fails", async () => {
    authed();
    mockFindListItemWithOwner.mockResolvedValueOnce({ id: ITEM_ID, listId: LIST_ID } as never);
    mockDeleteListItem.mockRejectedValueOnce(new Error("DB error"));

    expect(await removeListItem(ITEM_ID)).toEqual({ status: "error", message: "Failed to remove item. Please try again." });
  });
});

describe("setListItemScore", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns error when not authenticated", async () => {
    unauthed();
    expect(await setListItemScore(ITEM_ID, 3)).toEqual({ status: "error", message: "Not authenticated" });
  });

  it("returns error for invalid input", async () => {
    authed();
    expect(await setListItemScore("bad-id", 5)).toEqual({ status: "error", message: "Invalid input" });
  });

  it("returns error when item not found", async () => {
    authed();
    mockFindListItemWithOwner.mockResolvedValue(null);
    expect(await setListItemScore(ITEM_ID, 3)).toEqual({ status: "error", message: "Item not found" });
  });

  it("scores and returns scored", async () => {
    authed();
    mockFindListItemWithOwner.mockResolvedValueOnce({ id: ITEM_ID } as never);
    mockUpsertListItemScore.mockResolvedValueOnce({} as never);

    expect(await setListItemScore(ITEM_ID, 3)).toEqual({ status: "scored" });
  });

  it("returns error when repository upsert fails", async () => {
    authed();
    mockFindListItemWithOwner.mockResolvedValueOnce({ id: ITEM_ID } as never);
    mockUpsertListItemScore.mockRejectedValueOnce(new Error("DB error"));

    expect(await setListItemScore(ITEM_ID, 3)).toEqual({ status: "error", message: "Failed to save score. Please try again." });
  });
});

describe("clearListItemScore", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns error when not authenticated", async () => {
    unauthed();
    expect(await clearListItemScore(ITEM_ID)).toEqual({ status: "error", message: "Not authenticated" });
  });

  it("returns error when item not found", async () => {
    authed();
    mockFindListItemWithOwner.mockResolvedValue(null);
    expect(await clearListItemScore(ITEM_ID)).toEqual({ status: "error", message: "Item not found" });
  });

  it("clears and returns cleared", async () => {
    authed();
    mockFindListItemWithOwner.mockResolvedValueOnce({ id: ITEM_ID } as never);
    mockDeleteListItemScore.mockResolvedValueOnce({} as never);

    expect(await clearListItemScore(ITEM_ID)).toEqual({ status: "cleared" });
  });

  it("returns error when repository deleteMany fails", async () => {
    authed();
    mockFindListItemWithOwner.mockResolvedValueOnce({ id: ITEM_ID } as never);
    mockDeleteListItemScore.mockRejectedValueOnce(new Error("DB error"));

    expect(await clearListItemScore(ITEM_ID)).toEqual({ status: "error", message: "Failed to clear score. Please try again." });
  });
});

describe("createListAndAdd", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns error when not authenticated", async () => {
    unauthed();
    expect(await createListAndAdd("My List", MEDIA_ID)).toEqual({ status: "error", message: "Not authenticated" });
  });

  it("returns error for invalid input", async () => {
    authed();
    const result = await createListAndAdd("", MEDIA_ID);
    expect(result.status).toBe("error");
  });

  it("creates list with item and returns added", async () => {
    authed();
    mockCreateListAndAdd.mockResolvedValueOnce({ name: "My List" } as never);

    expect(await createListAndAdd("My List", MEDIA_ID)).toEqual({ status: "added", listName: "My List" });
  });

  it("returns error when repository create fails", async () => {
    authed();
    mockCreateListAndAdd.mockRejectedValueOnce(new Error("DB error"));

    expect(await createListAndAdd("My List", MEDIA_ID)).toEqual({ status: "error", message: "Failed to create list. Please try again." });
  });
});
