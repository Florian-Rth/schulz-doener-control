// Base URL for all API calls. Empty string = same-origin (relative paths); a
// configured value (e.g. https://api.example.com) is used for the separate-origin
// deployment. Trailing slash is trimmed so callers always pass a leading-slash path.
const rawBase = import.meta.env.VITE_API_BASE ?? "";

export const API_BASE = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

export const buildUrl = (path: string): string => `${API_BASE}${path}`;
