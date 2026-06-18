// Reads a non-httpOnly cookie value by name. Used for the `dc_xsrf` CSRF token
// which JS must echo back in the X-XSRF-TOKEN header on every mutating request.
export const readCookie = (name: string): string | null => {
  const prefix = `${name}=`;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
};
