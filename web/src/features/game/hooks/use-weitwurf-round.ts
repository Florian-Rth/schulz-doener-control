import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { ImpactWord } from "@/components/DoenerStage";
import { pickLine, rollSeed } from "@/lib/funny-lines";
import { useGameLeaderboard, useSubmitGameScore } from "../api";
import { gameCopy } from "../copy";
import {
  applyHit,
  applyMiss,
  type GameTally,
  INITIAL_TALLY,
  OVERTIME_SECONDS,
  type PieceKind,
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
  word: ImpactWord | null;
  introLine: string;
  roastLine: string;
  isPersonalBest: boolean;
  isSaving: boolean;
  saveFailed: boolean;
  leaderboard: GameLeaderboard | undefined;
  leaderboardPending: boolean;
  leaderboardError: boolean;
  start: () => void;
  onLanded: (kind: PieceKind, inBread: boolean) => void;
  goHome: () => void;
}

const TICK_MS = 200;
// Prime stride: consecutive words differ.
const WORD_STRIDE = 7;
const COMBO_WORD_FROM = 3;

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
  const [word, setWord] = useState<ImpactWord | null>(null);
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
    setWord(null);
    setEndsAt(time + ROUND_SECONDS * 1000);
    setNow(time);
    setRound((value) => value + 1);
    setPhase("playing");
    submit.reset();
  };

  const shout = (pool: readonly string[]): void => {
    const id = (word?.id ?? 0) + 1;
    setWord({ id, text: pickLine(pool, seed + id * WORD_STRIDE) });
  };

  const onLanded = (kind: PieceKind, inBread: boolean): void => {
    if (phase !== "playing" && phase !== "overtime") {
      return;
    }
    const next = inBread ? applyHit(latest.current, kind) : applyMiss(latest.current);
    latest.current = next;
    setTally(next);
    if (!inBread) {
      shout(gameCopy.missWords);
    } else {
      shout(next.combo >= COMBO_WORD_FROM ? gameCopy.comboWords : gameCopy.hitWords);
    }
  };

  const goHome = (): void => {
    void navigate({ to: "/" });
  };

  return {
    phase,
    round,
    tally,
    secondsLeft: phase === "ready" ? ROUND_SECONDS : Math.max(0, Math.ceil((endsAt - now) / 1000)),
    word,
    introLine: pickLine(gameCopy.intros, seed),
    roastLine: pickLine(gameCopy.roasts[roastTierFor(tally)], seed + round),
    isPersonalBest: submit.data?.isPersonalBest ?? false,
    isSaving: submit.isPending,
    saveFailed: submit.isError,
    leaderboard: leaderboardQuery.data,
    leaderboardPending: leaderboardQuery.isPending,
    leaderboardError: leaderboardQuery.isError,
    start,
    onLanded,
    goHome,
  };
};
