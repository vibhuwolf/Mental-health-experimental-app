/** @vitest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SessionBootButton } from "@/components/session-boot-button";

const prefetch = vi.fn();
const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    prefetch,
    push,
    refresh,
  }),
}));

describe("SessionBootButton", () => {
  beforeEach(() => {
    prefetch.mockReset();
    push.mockReset();
    refresh.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefetches the destination route to keep first navigation fast", () => {
    render(
      <SessionBootButton
        href="/spiral?direct=1"
        label="Open private spiral mode"
      />
    );

    expect(prefetch).toHaveBeenCalledWith("/spiral?direct=1");
  });

  it("boots a guest session before pushing the destination route", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ session: { id: "sess_123" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <SessionBootButton
        href="/spiral?direct=1"
        label="Open private spiral mode"
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /open private spiral mode/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/session/guest", {
        method: "POST",
      });
      expect(push).toHaveBeenCalledWith("/spiral?direct=1");
      expect(refresh).not.toHaveBeenCalled();
    });
  });

  it("shows a warm inline error when session bootstrap fails", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    render(<SessionBootButton href="/check-in" label="Start a 60-second check-in" />);

    await userEvent.click(screen.getByRole("button", { name: /start a 60-second check-in/i }));

    expect(
      await screen.findByText(/could not open your private space yet/i)
    ).toBeInTheDocument();
  });
});
