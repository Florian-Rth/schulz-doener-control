import { useNavigate } from "@tanstack/react-router";
import { useAdminTiere } from "../api";
import type { AdminTier } from "../types";

interface UseAdminTierePageResult {
  tiers: AdminTier[] | undefined;
  windowDays: number | undefined;
  isLoading: boolean;
  isError: boolean;
  goBack: () => void;
}

// Logic layer for the read-only Döner-Tiere admin screen: the catalog query plus
// a back-to-hub navigate helper. The page body only composes the returned
// slices; there is no mutation here.
export const useAdminTierePage = (): UseAdminTierePageResult => {
  const navigate = useNavigate();
  const tiereQuery = useAdminTiere();

  return {
    tiers: tiereQuery.data?.tiers,
    windowDays: tiereQuery.data?.windowDays,
    isLoading: tiereQuery.isLoading,
    isError: tiereQuery.isError,
    goBack: () => void navigate({ to: "/admin" }),
  };
};
