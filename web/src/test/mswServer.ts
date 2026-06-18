import { setupServer } from "msw/node";

// A single MSW server instance shared across tests. Individual tests register
// per-test handlers with `server.use(...)`; the global setup resets them
// between tests so handlers never leak across files.
export const mswServer = setupServer();
