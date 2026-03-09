import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AufbautypDropdown } from "@/components/protocol/AufbautypDropdown";

describe("AufbautypDropdown", () => {
  const originalFetch = global.fetch;

  const setMockFetch = (mock: typeof fetch) => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: mock
    });
  };

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFetch == null) {
      delete (global as { fetch?: typeof fetch }).fetch;
    } else {
      setMockFetch(originalFetch);
    }
  });

  test("loads options and propagates selection", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(["FB", "FZB"])
      } as Response) as unknown as typeof fetch
    );

    const onChange = jest.fn();
    render(<AufbautypDropdown value="" onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "FB" })).not.toBeNull();
    });

    fireEvent.change(screen.getByLabelText("Aufbautyp"), { target: { value: "FZB" } });
    expect(onChange).toHaveBeenCalledWith("FZB");
  });
});
