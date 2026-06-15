import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddMediaModal } from "@/components/add-media-modal";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/components/media-picker", () => ({
  MediaPicker: ({
    onSelect,
    initialQuery,
  }: {
    onSelect: (m: { id: string; title: string }) => void;
    initialQuery?: string;
  }) => (
    <div>
      <span data-testid="initial-query">{initialQuery}</span>
      <button onClick={() => onSelect({ id: "media-99", title: "Fight Club" })}>select-result</button>
    </div>
  ),
}));

function renderModal(props: Partial<Parameters<typeof AddMediaModal>[0]> = {}) {
  return render(<AddMediaModal open={true} onOpenChange={vi.fn()} {...props} />);
}

describe("AddMediaModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes initialTitle to MediaPicker as the initial query", () => {
    renderModal({ initialTitle: "Fight Club" });
    expect(screen.getByTestId("initial-query")).toHaveTextContent("Fight Club");
  });

  it("closes the modal and navigates to the media page when no onCreated callback is given", () => {
    const onOpenChange = vi.fn();
    renderModal({ onOpenChange });

    fireEvent.click(screen.getByText("select-result"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockPush).toHaveBeenCalledWith("/media/media-99");
  });

  it("calls onCreated instead of navigating when provided", () => {
    const onCreated = vi.fn();
    const onOpenChange = vi.fn();
    renderModal({ onCreated, onOpenChange });

    fireEvent.click(screen.getByText("select-result"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onCreated).toHaveBeenCalledWith("media-99");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
