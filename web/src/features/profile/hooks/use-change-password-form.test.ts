import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/features/auth";
import { mswServer } from "@/test/mswServer";
import { useChangePasswordForm } from "./use-change-password-form";

// The forced-change session sentinel: authenticated but locked behind the
// must-change gate. Drives the hook's `forced` derivation.
const lockedSession: Session = {
  userId: "22222222-2222-2222-2222-222222222222",
  displayName: "Sara Yilmaz",
  firstName: "Sara",
  initials: "SY",
  avatarColorHex: "#C90023",
  role: "employee",
  payPalHandleSet: false,
  payPalHandle: null,
  mustChangePassword: true,
};

const NEW = "ganzNeuesPw7";
const INITIAL = "Schulz-Start!";

// Spies the hook reads via the router / auth context. Reassigned per test.
const navigate = vi.fn(async () => {});
const refresh = vi.fn(async () => {});

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>();
  return {
    ...actual,
    useAuth: () => ({
      status: "authenticated" as const,
      user: lockedSession,
      refresh,
      clear: vi.fn(),
    }),
  };
});

const seedXsrfCookie = (): void => {
  // biome-ignore lint/suspicious/noDocumentCookie: seeding the CSRF cookie the apiClient reads; Cookie Store API is unavailable in jsdom
  document.cookie = "dc_xsrf=test-token";
};

const buildWrapper = (): ((props: { children: ReactNode }) => ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return ({ children }) => createElement(QueryClientProvider, { client: queryClient }, children);
};

// Submits the form by driving react-hook-form's fields then firing onSubmit
// through a synthetic event (preventDefault is all handleSubmit needs).
const submit = async (
  result: { current: ReturnType<typeof useChangePasswordForm> },
  values: { currentPassword?: string; newPassword: string },
): Promise<void> => {
  act(() => {
    if (values.currentPassword !== undefined) {
      result.current.form.setValue("currentPassword", values.currentPassword);
    }
    result.current.form.setValue("newPassword", values.newPassword);
    result.current.form.setValue("confirmNewPassword", values.newPassword);
  });
  await act(async () => {
    await result.current.onSubmit({
      preventDefault: () => {},
    } as unknown as React.FormEvent<HTMLFormElement>);
  });
};

describe("useChangePasswordForm — post-change navigation (BUG 2)", () => {
  beforeEach(() => {
    navigate.mockClear();
    refresh.mockClear();
    seedXsrfCookie();
  });

  afterEach(() => {
    mswServer.resetHandlers();
  });

  it("refresht die Session und navigiert nach Erfolg nach Hause (/), niemals nach /login", async () => {
    mswServer.use(
      http.post("*/api/auth/change-password", () => new HttpResponse(null, { status: 204 })),
    );

    const { result } = renderHook(() => useChangePasswordForm(), { wrapper: buildWrapper() });

    await submit(result, { newPassword: NEW });

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: "/" });
    });

    // B6 re-issues fresh cookies, so the session stays valid: refresh runs and
    // must complete BEFORE navigation so the guard reads the cleared flag.
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0]);

    // The user must NOT be bounced back to the login screen after a success.
    expect(navigate).not.toHaveBeenCalledWith({ to: "/login" });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(result.current.serverError).toBeNull();
  });

  it("navigiert zu einem überschriebenen redirectTo statt nach /login", async () => {
    mswServer.use(
      http.post("*/api/auth/change-password", () => new HttpResponse(null, { status: 204 })),
    );

    const { result } = renderHook(() => useChangePasswordForm({ redirectTo: "/profil" }), {
      wrapper: buildWrapper(),
    });

    await submit(result, { newPassword: NEW });

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: "/profil" });
    });
    expect(navigate).not.toHaveBeenCalledWith({ to: "/login" });
  });

  it("zeigt bei falschem aktuellem Passwort (401) den Fehler und navigiert NICHT", async () => {
    mswServer.use(
      http.post("*/api/auth/change-password", () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => useChangePasswordForm(), { wrapper: buildWrapper() });

    // Forced is derived from the locked session, so currentPassword would be
    // omitted; submit one anyway — the 401 branch is exercised by the handler.
    await submit(result, { currentPassword: INITIAL, newPassword: NEW });

    await waitFor(() => {
      expect(result.current.serverError).toMatch(/aktuelle Passwort stimmt nicht/i);
    });
    expect(navigate).not.toHaveBeenCalled();
  });
});
