import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CatalogSearch } from "@/components/catalog-search";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/search",
}));

vi.mock("@/components/add-media-modal", () => ({
  AddMediaModal: () => <div data-testid="add-media-modal" />,
}));

vi.mock("@/components/add-to-list-buttons", () => ({
  AddToListButtons: () => <div data-testid="add-to-list-buttons" />,
}));

function makeResults(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `media-${i}`,
    title: `Media ${i}`,
    year: 2000 + i,
    creator: `Creator ${i}`,
    type: "movie" as const,
  }));
}

function renderCatalogSearch(props: Record<string, unknown> = {}) {
  return render(
    <CatalogSearch
      query=""
      typeFilter={undefined}
      results={[]}
      isAuthenticated={false}
      wishlistMediaIds={[]}
      currentPage={1}
      totalPages={1}
      perPage="50"
      {...props}
    />,
  );
}

describe("CatalogSearch pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("control visibility", () => {
    it("renders pagination controls at top and bottom when there are multiple pages", () => {
      renderCatalogSearch({ results: makeResults(50), totalPages: 3, currentPage: 1 });
      const navs = screen.getAllByRole("navigation", { name: /pagination/i });
      expect(navs).toHaveLength(2);
      expect(screen.getAllByText("Page 1 of 3")).toHaveLength(2);
    });

    it("hides pagination controls when there is only one page", () => {
      renderCatalogSearch({ totalPages: 1 });
      expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
    });

    it("hides pagination controls when there are no results (totalPages=1)", () => {
      renderCatalogSearch({ totalPages: 1, results: [] });
      expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
    });
  });

  describe("Previous and Next buttons", () => {
    it("disables Previous on page 1", () => {
      renderCatalogSearch({ results: makeResults(50), totalPages: 3, currentPage: 1 });
      screen.getAllByRole("button", { name: /previous/i }).forEach((b) => expect(b).toBeDisabled());
      screen.getAllByRole("button", { name: /next/i }).forEach((b) => expect(b).toBeEnabled());
    });

    it("disables Next on the last page", () => {
      renderCatalogSearch({ results: makeResults(50), totalPages: 3, currentPage: 3 });
      screen.getAllByRole("button", { name: /next/i }).forEach((b) => expect(b).toBeDisabled());
      screen.getAllByRole("button", { name: /previous/i }).forEach((b) => expect(b).toBeEnabled());
    });

    it("enables both Previous and Next on a middle page", () => {
      renderCatalogSearch({ results: makeResults(50), totalPages: 3, currentPage: 2 });
      screen.getAllByRole("button", { name: /previous/i }).forEach((b) => expect(b).toBeEnabled());
      screen.getAllByRole("button", { name: /next/i }).forEach((b) => expect(b).toBeEnabled());
    });
  });

  describe("navigation", () => {
    it("pushes page=2 when Next is clicked", () => {
      renderCatalogSearch({
        query: "batman",
        typeFilter: "movie",
        results: makeResults(50),
        totalPages: 3,
        currentPage: 1,
      });
      fireEvent.click(screen.getAllByRole("button", { name: /next/i })[0]);
      expect(mockPush).toHaveBeenCalledWith("/search?q=batman&type=movie&page=2");
    });

    it("pushes page=1 when Previous is clicked from page 2", () => {
      renderCatalogSearch({
        query: "batman",
        typeFilter: "movie",
        results: makeResults(50),
        totalPages: 3,
        currentPage: 2,
      });
      fireEvent.click(screen.getAllByRole("button", { name: /previous/i })[0]);
      expect(mockPush).toHaveBeenCalledWith("/search?q=batman&type=movie");
    });

    it("omits page param when going to page 1", () => {
      renderCatalogSearch({
        query: "batman",
        results: makeResults(50),
        totalPages: 3,
        currentPage: 2,
      });
      fireEvent.click(screen.getAllByRole("button", { name: /previous/i })[0]);
      expect(mockPush).toHaveBeenCalledWith("/search?q=batman");
    });

    it("uses initialQuery for pagination, not uncommitted input value", () => {
      renderCatalogSearch({
        query: "batman",
        results: makeResults(50),
        totalPages: 3,
        currentPage: 1,
      });
      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "superman" } });
      fireEvent.click(screen.getAllByRole("button", { name: /next/i })[0]);
      expect(mockPush).toHaveBeenCalledWith("/search?q=batman&page=2");
    });
  });

  describe("page reset on search/filter change", () => {
    it("resets to page 1 (omits page) when form is submitted", () => {
      renderCatalogSearch({
        query: "batman",
        results: makeResults(50),
        totalPages: 3,
        currentPage: 2,
      });
      fireEvent.submit(screen.getByRole("search"));
      expect(mockPush).toHaveBeenCalledWith("/search?q=batman");
    });

    it("resets to page 1 (omits page) when type filter changes", () => {
      renderCatalogSearch({
        query: "batman",
        results: makeResults(50),
        totalPages: 3,
        currentPage: 2,
      });
      fireEvent.click(screen.getByRole("button", { name: /movies/i }));
      expect(mockPush).toHaveBeenCalledWith("/search?q=batman&type=movie");
    });

    it("resets to page 1 when clicking All type filter", () => {
      renderCatalogSearch({
        query: "batman",
        typeFilter: "movie",
        results: makeResults(50),
        totalPages: 3,
        currentPage: 2,
      });
      fireEvent.click(screen.getByRole("button", { name: /^all$/i }));
      expect(mockPush).toHaveBeenCalledWith("/search?q=batman");
    });
  });

  describe("per-page selector", () => {
    function firstSelect() {
      return screen.getAllByLabelText("Results per page")[0];
    }

    it("renders a per-page dropdown in both pagination navs", () => {
      renderCatalogSearch({ results: makeResults(50), totalPages: 3, currentPage: 1 });
      expect(screen.getAllByLabelText("Results per page")).toHaveLength(2);
    });

    it("includes perPage param when non-default value is selected", () => {
      renderCatalogSearch({
        query: "batman",
        results: makeResults(50),
        totalPages: 3,
        currentPage: 1,
        perPage: "50",
      });
      fireEvent.change(firstSelect(), { target: { value: "25" } });
      expect(mockPush).toHaveBeenCalledWith("/search?q=batman&perPage=25");
    });

    it("omits perPage param when default (50) is selected", () => {
      renderCatalogSearch({
        query: "batman",
        typeFilter: "movie",
        results: makeResults(50),
        totalPages: 3,
        currentPage: 2,
        perPage: "25",
      });
      fireEvent.change(firstSelect(), { target: { value: "50" } });
      expect(mockPush).toHaveBeenCalledWith("/search?q=batman&type=movie");
    });

    it("resets to page 1 on per-page change", () => {
      renderCatalogSearch({
        query: "batman",
        results: makeResults(50),
        totalPages: 5,
        currentPage: 3,
        perPage: "50",
      });
      fireEvent.change(firstSelect(), { target: { value: "10" } });
      expect(mockPush).toHaveBeenCalledWith("/search?q=batman&perPage=10");
      expect(mockPush.mock.calls[0][0]).not.toContain("page=");
    });

    it("preserves type filter on per-page change", () => {
      renderCatalogSearch({
        query: "batman",
        typeFilter: "movie",
        results: makeResults(50),
        totalPages: 3,
        currentPage: 1,
        perPage: "50",
      });
      fireEvent.change(firstSelect(), { target: { value: "all" } });
      expect(mockPush).toHaveBeenCalledWith("/search?q=batman&type=movie&perPage=all");
    });

    it("hides per-page dropdown when pagination is hidden", () => {
      renderCatalogSearch({ totalPages: 1 });
      expect(screen.queryByLabelText("Results per page")).not.toBeInTheDocument();
    });
  });
});
