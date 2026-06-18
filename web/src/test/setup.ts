import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "vitest";
import { mswServer } from "@/test/mswServer";

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
