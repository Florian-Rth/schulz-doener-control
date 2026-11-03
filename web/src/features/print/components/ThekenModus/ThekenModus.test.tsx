import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PrintLine } from "@/features/home";
import { renderWithTheme } from "@/test/renderWithTheme";
import { thekenCopy } from "../../copy";
import { ThekenModus } from "./ThekenModus";

// jsdom has no WebGL — replace the three.js stage with a probe that exposes
// what would be in the bread.
vi.mock("@/components/DoenerStage/internal/scene/DoenerScene", () => ({
  DoenerScene: ({
    build,
    presenting,
  }: {
    build: { meat: string | null; veggies: string[]; sauces: string[] };
    presenting: boolean;
  }) => (
    <div data-testid="doener-scene" data-presenting={String(presenting)}>
      {[build.meat ?? "", ...build.veggies, ...build.sauces].join("|")}
    </div>
  ),
}));

// Every playful line is drawn at random from a pool — match any of them.
const oneOf =
  (pool: readonly string[]) =>
  (text: string): boolean =>
    pool.includes(text);

const line = (overrides: Partial<PrintLine>): PrintLine => ({
  number: 1,
  section: "Döner",
  personName: "Tobias Klein",
  productLabel: "Döner",
  description: "Kalb · Scharf · Knoblauch · ohne Zwiebeln",
  quantity: 1,
  lineTotalCents: 750,
  isPickup: false,
  productIcon: "kebab_dining",
  meatKey: "kalb",
  sauceKeys: ["scharf", "knoblauch"],
  extraText: "ohne Zwiebeln",
  isBreadDoener: true,
  ...overrides,
});

const LINES: PrintLine[] = [
  line({}),
  line({
    number: 2,
    section: "Pizza",
    personName: "Sara Yılmaz",
    productLabel: "Pizza",
    description: "Salami",
    quantity: 2,
    lineTotalCents: 1800,
    productIcon: "local_pizza",
    meatKey: null,
    sauceKeys: [],
    extraText: "",
    isBreadDoener: false,
  }),
  line({
    number: 3,
    personName: "Lukas Brandt",
    description: "Hähnchen",
    meatKey: "haehnchen",
    sauceKeys: [],
    extraText: "",
    isPickup: true,
  }),
];

afterEach(() => {
  vi.useRealTimers();
});

describe("ThekenModus", () => {
  it("steps through every order and ends on the final screen", async () => {
    const onClose = vi.fn();
    renderWithTheme(<ThekenModus lines={LINES} open onClose={onClose} />);
    const user = userEvent.setup();
    const dialog = screen.getByRole("dialog", { name: thekenCopy.title });

    // Order 1: big number, product, person and every description part.
    expect(within(dialog).getByText("1 / 3")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Nr. 1")).toHaveTextContent("1");
    expect(within(dialog).getByText("Tobias Klein")).toBeInTheDocument();
    expect(within(dialog).getByText("ohne Zwiebeln")).toBeInTheDocument();
    expect(within(dialog).getByText(oneOf(thekenCopy.readOut))).toBeInTheDocument();
    expect(await within(dialog).findByTestId("doener-scene")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: thekenCopy.back })).toBeDisabled();

    // Order 2: a pizza gets the product card instead of the 3D stage.
    await user.click(within(dialog).getByRole("button", { name: thekenCopy.next }));
    expect(within(dialog).getByText("2 / 3")).toBeInTheDocument();
    expect(within(dialog).getByText("2× Pizza")).toBeInTheDocument();
    expect(within(dialog).getByTestId("theken-product-card")).toBeInTheDocument();
    expect(within(dialog).queryByTestId("doener-scene")).not.toBeInTheDocument();

    // Order 3: the last one — the Abholer's own, the button finishes.
    await user.click(within(dialog).getByRole("button", { name: thekenCopy.next }));
    expect(within(dialog).getByText("3 / 3")).toBeInTheDocument();
    expect(within(dialog).getByText(thekenCopy.pickupBadge)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: thekenCopy.finish }));

    expect(within(dialog).getByText(thekenCopy.finishTitle)).toBeInTheDocument();
    expect(within(dialog).getByText(oneOf(thekenCopy.finishLines))).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: thekenCopy.finishRestart }));
    expect(within(dialog).getByText("1 / 3")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: thekenCopy.close }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("navigates by swipe and arrow keys", () => {
    renderWithTheme(<ThekenModus lines={LINES} open onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: thekenCopy.title });
    const surface = within(dialog).getByText("Tobias Klein");

    fireEvent.touchStart(surface, { touches: [{ clientX: 300, clientY: 200 }] });
    fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 120, clientY: 210 }] });
    expect(within(dialog).getByText("2 / 3")).toBeInTheDocument();

    // A mostly vertical drag (scrolling) does not page.
    fireEvent.touchStart(surface, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 170, clientY: 300 }] });
    expect(within(dialog).getByText("2 / 3")).toBeInTheDocument();

    fireEvent.touchStart(surface, { touches: [{ clientX: 100, clientY: 200 }] });
    fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 260, clientY: 200 }] });
    expect(within(dialog).getByText("1 / 3")).toBeInTheDocument();

    fireEvent.keyDown(within(dialog).getByText("Tobias Klein"), { key: "ArrowRight" });
    expect(within(dialog).getByText("2 / 3")).toBeInTheDocument();
  });

  it("assembles the ordered Döner from its answers, then presents it", async () => {
    vi.useFakeTimers();
    renderWithTheme(<ThekenModus lines={LINES} open onClose={vi.fn()} />);

    // Let the lazily imported scene resolve.
    await act(async () => {
      await vi.dynamicImportSettled();
    });
    const scene = screen.getByTestId("doener-scene");
    expect(scene).toHaveAttribute("data-presenting", "false");

    // One ingredient per beat — each beat is scheduled after the previous render.
    for (let beat = 0; beat < 10; beat += 1) {
      act(() => {
        vi.advanceTimersByTime(700);
      });
    }
    // Mit allem except Zwiebeln, then the sauces in the order chosen.
    expect(scene).toHaveTextContent("kalb|salat|tomate|gurke|rotkohl|scharf|knoblauch");
    expect(scene).toHaveAttribute("data-presenting", "true");
  });

  it("keeps the screen awake while open, when the browser supports it", async () => {
    const release = vi.fn(() => Promise.resolve());
    const request = vi.fn(() => Promise.resolve({ release }));
    Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request } });

    const { unmount } = renderWithTheme(<ThekenModus lines={LINES} open onClose={vi.fn()} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(request).toHaveBeenCalledWith("screen");

    unmount();
    expect(release).toHaveBeenCalled();
    Reflect.deleteProperty(navigator, "wakeLock");
  });
});
