import { useNavigate } from "@tanstack/react-router";
import { useTierCatalog } from "../api";
import type { TierCatalog } from "../types";

interface UseTiereCatalogResult {
  entries: TierCatalog | undefined;
  isPending: boolean;
  isError: boolean;
  goHome: () => void;
}

// Logic layer for the catalog screen: the catalog query + a navigate-home
// helper. The page body only composes the returned slices.
export const useTiereCatalog = (): UseTiereCatalogResult => {
  const navigate = useNavigate();
  const catalogQuery = useTierCatalog();

  const goHome = (): void => {
    void navigate({ to: "/" });
  };

  return {
    entries: catalogQuery.data,
    isPending: catalogQuery.isPending,
    isError: catalogQuery.isError,
    goHome,
  };
};
