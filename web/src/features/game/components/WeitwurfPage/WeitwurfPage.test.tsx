import { act, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/mswServer";
import { renderApp } from "@/test/renderApp";
import { gameCopy } from "../../copy";
import { BUCKETS, type Bucket, PIECE_KINDS, type PieceKind } from "../../scoring";
import type { GameLeaderboard } from "../../types";

// jsdom has no WebGL — the stage renders its children into a plain probe.
vi.mock("@/components/DoenerStage/internal/scene/DoenerScene", () => ({
  DoenerScene: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="doener-scene">{children}</div>
  ),
}));

// The physics is replaced by buttons that throw and report landings like the real pools.
vi.mock("./internal/scene/ThrowController", () => ({
  ThrowController: ({
    active,
    nextKind,
    onThrow,
    onLanded,
  }: {
    active: boolean;
    nextKind: PieceKind;
    onThrow: () => void;
    onLanded: (kind: PieceKind, bucket: Bucket | null) => void;
  }) => (
    <div data-testid="throw-controller" data-active={String(active)} data-next={nextKind}>
      <button
        type="button"
        onClick={() => {
          onThrow();
          onLanded(nextKind, BUCKETS[1] ?? null);
        }}
      >
        Stammkunde rein
      </button>
      <button
        type="button"
        onClick={() => {
          onThrow();
          onLanded(nextKind, null);
        }}
      >
        Daneben
      </button>
    </div>
  ),
}));

const authenticatedSession = {
  userId: "11111111-1111-1111-1111-111111111111",
  displayName: "Markus Wagner",
  firstName: "Markus",
  initials: "MW",
  avatarColorHex: "#00728E",
  role: "employee",
  payPalHandleSet: true,
  payPalHandle: "MarkusW",
  mustChangePassword: false,
};

const leaderboard: GameLeaderboard = {
  today: [
    {
      rank: 1,
      userId: "u-lukas",
      displayName: "Lukas Brandt",
      initials: "LB",
      avatarColorHex: "#00728E",
      score: 420,
      hits: 14,
      isMe: false,
    },
    {
      rank: 2,
      userId: authenticatedSession.userId,
      displayName: "Markus Wagner",
      initials: "MW",
      avatarColorHex: "#00728E",
      score: 80,
      hits: 2,
      isMe: true,
    },
  ],
  allTime: [
    {
      rank: 1,
      userId: "u-sara",
      displayName: "Sara Yılmaz",
      initials: "SY",
      avatarColorHex: "#ED701C",
      score: 990,
      hits: 25,
      isMe: false,
    },
  ],
};

const oneOf =
  (pool: readonly string[]) =>
  (text: string): boolean =>
    pool.includes(text);

const useGameHandlers = (submitted: unknown[]): void => {
  mswServer.use(
    http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
    http.get("*/api/game/leaderboard", () => HttpResponse.json(leaderboard)),
    http.post("*/api/game/scores", async ({ request }) => {
      submitted.push(await request.json());
      return HttpResponse.json({ id: "score-1", score: 75, isPersonalBest: true });
    }),
  );
};

afterEach(() => {
  vi.useRealTimers();
});

describe("WeitwurfPage", () => {
  it("spielt eine Runde: Treffer mit Kombo, Sauerei, Abpfiff, Bestenliste und Nochmal", async () => {
    const submitted: unknown[] = [];
    useGameHandlers(submitted);
    const user = userEvent.setup();
    const { findByRole, findByText, findByTestId, getByRole, getByText } = renderApp({
      initialPath: "/weitwurf",
    });

    expect(await findByRole("heading", { name: gameCopy.introTitle })).toBeInTheDocument();
    expect((await findByTestId("throw-controller")).dataset.active).toBe("false");

    // Only the round timer and clock are faked: msw and user-event keep real timeouts.
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    await user.click(getByRole("button", { name: gameCopy.start }));
    expect((await findByTestId("throw-controller")).dataset.active).toBe("true");

    // The piece in the hand is named under the stage.
    const held = (await findByTestId("throw-controller")).dataset.next as PieceKind;
    expect(PIECE_KINDS).toContain(held);
    expect(getByText(gameCopy.nextPiece(gameCopy.pieceNames[held]))).toBeInTheDocument();

    await user.click(getByRole("button", { name: "Stammkunde rein" }));
    await user.click(getByRole("button", { name: "Stammkunde rein" }));
    // 25 + 25 × 1.5 for the second hit in a row.
    expect(within(getByRole("group", { name: gameCopy.scoreLabel })).getByText("63")).toBeVisible();
    expect(getByText(gameCopy.comboBadge(1.5))).toBeInTheDocument();

    await user.click(getByRole("button", { name: "Daneben" }));
    expect(within(getByRole("group", { name: gameCopy.missesLabel })).getByText("1")).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(30_200);
    });
    expect(getByText(gameCopy.overtime)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2_200);
    });

    expect(await findByRole("dialog", { name: gameCopy.endTitle })).toBeInTheDocument();
    expect(getByText("63 Pkt.")).toBeInTheDocument();
    expect(await findByText("Sara Yılmaz")).toBeInTheDocument();
    expect(getByText("Lukas Brandt")).toBeInTheDocument();
    expect(await findByText(gameCopy.personalBest)).toBeInTheDocument();
    await waitFor(() => {
      expect(submitted).toEqual([{ score: 63, hits: 2, misses: 1 }]);
    });
    // The roast comes from the pool matching the round.
    expect(getByText(oneOf(gameCopy.roasts.solide))).toBeInTheDocument();

    await user.click(getByRole("button", { name: gameCopy.again }));
    await waitFor(() => {
      expect(
        within(getByRole("group", { name: gameCopy.scoreLabel })).getByText("0"),
      ).toBeVisible();
    });
    expect((await findByTestId("throw-controller")).dataset.active).toBe("true");
  }, 20_000);

  it("führt über den Zurück-Knopf zur Übersicht", async () => {
    useGameHandlers([]);
    mswServer.use(http.get("*/api/dashboard", () => HttpResponse.json({}, { status: 500 })));
    const user = userEvent.setup();
    const { findByRole, router } = renderApp({ initialPath: "/weitwurf" });

    await user.click(await findByRole("button", { name: gameCopy.back }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
  });
});
