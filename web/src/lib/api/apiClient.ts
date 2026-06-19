import { buildUrl } from "@/lib/api/config";
import { readCookie } from "@/lib/api/cookies";
import { ApiError, ProblemDetailsSchema } from "@/lib/api/problem";
import { attemptRefresh, triggerHardLogout } from "@/lib/api/refresh-link";

const XSRF_COOKIE = "dc_xsrf";
const XSRF_HEADER = "X-XSRF-TOKEN";

// Endpoints that must never trigger the refresh-and-retry loop (refreshing on a
// failed login/refresh would recurse). A 401 from these is returned to the caller.
const NO_REFRESH_PATHS = ["/api/auth/login", "/api/auth/refresh"];

// The session probe: a 401 here is the normal "not logged in" signal, already
// handled by the auth layer (fetchSession maps it to null and the route guard
// redirects to /login). It must NOT fire the navigating hard-logout, which would
// preempt the in-flight route navigation and surface a CancelledError. It may
// still attempt a refresh (a valid refresh token re-authenticates the probe).
const NO_HARD_LOGOUT_PATHS = ["/api/auth/me"];

type Json = Record<string, unknown> | unknown[] | null;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: Json;
  signal?: AbortSignal;
}

const buildHeaders = (method: string, hasBody: boolean): Headers => {
  const headers = new Headers();
  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }
  // Double-submit CSRF: echo the non-httpOnly cookie on every mutating request.
  if (method !== "GET") {
    const token = readCookie(XSRF_COOKIE);
    if (token !== null) {
      headers.set(XSRF_HEADER, token);
    }
  }
  return headers;
};

const parseProblem = async (response: Response): Promise<ApiError> => {
  try {
    const data: unknown = await response.json();
    const parsed = ProblemDetailsSchema.safeParse(data);
    return new ApiError(response.status, parsed.success ? parsed.data : null);
  } catch {
    return new ApiError(response.status, null);
  }
};

const sendRequest = (path: string, options: RequestOptions): Promise<Response> => {
  const method = options.method ?? "GET";
  const hasBody = options.body !== undefined;
  return fetch(buildUrl(path), {
    method,
    credentials: "include",
    headers: buildHeaders(method, hasBody),
    body: hasBody ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });
};

// Core request: attaches cookies + CSRF header, and on a 401 from a protected
// endpoint performs a single silent refresh then retries once. If the retry
// still 401s (or refresh fails) it triggers the hard-logout path and throws.
const request = async (path: string, options: RequestOptions): Promise<Response> => {
  let response = await sendRequest(path, options);

  if (response.status === 401 && !NO_REFRESH_PATHS.includes(path)) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      response = await sendRequest(path, options);
    }
    if (response.status === 401) {
      if (!NO_HARD_LOGOUT_PATHS.includes(path)) {
        triggerHardLogout();
      }
      throw await parseProblem(response);
    }
  }

  if (!response.ok) {
    throw await parseProblem(response);
  }

  return response;
};

// Returns parsed JSON; feature hooks run the result through their Zod schema.
const requestJson = async (path: string, options: RequestOptions): Promise<unknown> => {
  const response = await request(path, options);
  if (response.status === 204) {
    return null;
  }
  return response.json();
};

export const apiClient = {
  get: (path: string, signal?: AbortSignal): Promise<unknown> =>
    requestJson(path, { method: "GET", signal }),
  post: (path: string, body?: Json, signal?: AbortSignal): Promise<unknown> =>
    requestJson(path, { method: "POST", body, signal }),
  put: (path: string, body?: Json, signal?: AbortSignal): Promise<unknown> =>
    requestJson(path, { method: "PUT", body, signal }),
  delete: (path: string, signal?: AbortSignal): Promise<unknown> =>
    requestJson(path, { method: "DELETE", signal }),
};
