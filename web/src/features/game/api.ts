import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { GameLeaderboardSchema, SubmittedGameScoreSchema } from "./schemas";
import type { GameLeaderboard, GameRoundResult, SubmittedGameScore } from "./types";

export const gameKeys = {
  leaderboard: ["game", "leaderboard"] as const,
};

const fetchLeaderboard = async (signal: AbortSignal): Promise<GameLeaderboard> => {
  const data = await apiClient.get("/api/game/leaderboard", signal);
  return GameLeaderboardSchema.parse(data);
};

const submitScore = async (round: GameRoundResult): Promise<SubmittedGameScore> => {
  const data = await apiClient.post("/api/game/scores", {
    score: round.score,
    hits: round.hits,
    misses: round.misses,
  });
  return SubmittedGameScoreSchema.parse(data);
};

export const useGameLeaderboard = (enabled: boolean) =>
  useQuery({
    queryKey: gameKeys.leaderboard,
    queryFn: ({ signal }) => fetchLeaderboard(signal),
    enabled,
  });

// Stores a finished round; the leaderboard refetches so the new score shows up.
export const useSubmitGameScore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitScore,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard });
    },
  });
};
