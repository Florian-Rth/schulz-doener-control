import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { pickLine, rollSeed } from "@/lib/funny-lines";
import { useGameLeaderboard, useSubmitGameScore } from "../api";
import { gameCopy } from "../copy";
import {
  applyHit,
  applyMiss,
  type Bucket,
  type GameTally,
  INITIAL_TALLY,
  OVERTIME_SECONDS,
  type PieceKind,
  pickPieceKind,
  ROUND_SECONDS,
  roastTierFor,
} from "../scoring";
import type { GameLeaderboard } from "../types";

export type RoundPhase = "ready" | "playing" | "overtime" | "over";

export interface WeitwurfRound {
  phase: RoundPhase;
  /** Remount key of the 3D pieces: every round starts with an empty Döner. */
  round: number;
  tally: GameTally;
  secondsLeft: number;
  /** The piece in the hand: what the next swipe throws. */
  nextKind: PieceKind;
  introLine: string;
  roastLine: string;
  isPersonalBest: boolean;
  isSaving: boolean;
  saveFailed: boolean;
  leaderboard: GameLeaderboard | undefined;
  leaderboardPending: boolean;
  leaderboardError: boolean;
  start: () => void;
  onThrow: () => void;
  onLanded: (kind: PieceKind, bucket: Bucket | null) => void;
  goHome: () => void;
}

const TICK_MS = 200;

// One Weitwurf round after the other: start → 30 s of throwing → a short
// overtime for the pieces still in the air → score saved, end screen.
export const useWeitwurfRound = (): WeitwurfRound => {
  const navigate = useNavigate();
  const [seed] = useState(rollSeed);
  const [phase, setPhase] = useState<RoundPhase>("ready");
  const [round, setRound] = useState(0);
  const [tally, setTally] = useState<GameTally>(INITIAL_TALLY);
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(0);
  const [nextKind, setNextKind] = useState<PieceKind>(() => pickPieceKind(Math.random()));
  // Landings arrive from the render loop; the timer needs the latest tally.
  const latest = useRef<GameTally>(INITIAL_TALLY);
  const submit = useSubmitGameScore();
  const leaderboardQuery = useGameLeaderboard(phase === "over");
  const { mutate } = submit;

  useEffect(() => {
    if (phase !== "playing" && phase !== "overtime") {
      return;
    }
    const timer = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      // Each phase ends exactly once: stop ticking before React re-runs the effect.
      if (phase === "playing" && time >= endsAt) {
        window.clearInterval(timer);
        setPhase("overtime");
      } else if (phase === "overtime" && time >= endsAt + OVERTIME_SECONDS * 1000) {
        window.clearInterval(timer);
        setPhase("over");
        const final = latest.current;
        mutate({ score: final.score, hits: final.hits, misses: final.misses });
      }
    }, TICK_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [phase, endsAt, mutate]);

  const start = (): void => {
    const time = Date.now();
    latest.current = INITIAL_TALLY;
    setTally(INITIAL_TALLY);
    setEndsAt(time + ROUND_SECONDS * 1000);
    setNow(time);
    setRound((value) => value + 1);
    setPhase("playing");
    submit.reset();
  };

  const onThrow = (): void => {
    setNextKind(pickPieceKind(Math.random()));
  };

  // The bucket decides the points; the piece only decides the look.
  const onLanded = (_kind: PieceKind, bucket: Bucket | null): void => {
    if (phase !== "playing" && phase !== "overtime") {
      return;
    }
    if (bucket === null) {
      const next = applyMiss(latest.current);
      latest.current = next;
      setTally(next);
      return;
    }
    const next = applyHit(latest.current, bucket);
    latest.current = next;
    setTally(next);
  };

  const goHome = (): void => {
    void navigate({ to: "/" });
  };

  return {
    phase,
    round,
    tally,
    secondsLeft: phase === "ready" ? ROUND_SECONDS : Math.max(0, Math.ceil((endsAt - now) / 1000)),
    nextKind,
    introLine: pickLine(gameCopy.intros, seed),
    roastLine: pickLine(gameCopy.roasts[roastTierFor(tally)], seed + round),
    isPersonalBest: submit.data?.isPersonalBest ?? false,
    isSaving: submit.isPending,
    saveFailed: submit.isError,
    leaderboard: leaderboardQuery.data,
    leaderboardPending: leaderboardQuery.isPending,
    leaderboardError: leaderboardQuery.isError,
    start,
    onThrow,
    onLanded,
    goHome,
  };
};
