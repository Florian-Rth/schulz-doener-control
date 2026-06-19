import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { mswServer } from "@/test/mswServer";

// Component tests render through MSW + React Query, so their content resolves
// asynchronously. Under the full suite's parallel workers the heaviest pages can
// take longer than Testing Library's 1000ms default `findBy*` timeout purely from
// CPU contention (they pass comfortably in isolation). Raise the async timeout so
// the suite is deterministic rather than load-dependent.
configure({ asyncUtilTimeout: 5000 });

// Boot the MSW request interceptor for the whole test run. Unhandled requests
// error loudly so a missing handler surfaces as a test failure, not a silent
// network hang.
beforeAll(() => {
  mswServer.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  mswServer.resetHandlers();
});

afterAll(() => {
  mswServer.close();
});
