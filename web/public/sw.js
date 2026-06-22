/// <reference lib="webworker" />

// Schulz Döner Control — Web Push service worker.
// Served from the site root (/sw.js) so its scope covers the whole app. It has
// one job: receive a push from the backend (sent on OpenDay) and surface it as a
// system notification; tapping it focuses or opens the app.

const FALLBACK_TITLE = "Schulz Döner Control";
const FALLBACK_BODY = "Es gibt Neuigkeiten vom Döner-Tag.";
const APP_URL = "/";

// Take control immediately so the first subscription's pushes are handled
// without requiring a reload.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const readPayload = (event) => {
  if (!event.data) {
    return { title: FALLBACK_TITLE, body: FALLBACK_BODY };
  }
  try {
    const data = event.data.json();
    return {
      title: typeof data.title === "string" ? data.title : FALLBACK_TITLE,
      body: typeof data.body === "string" ? data.body : FALLBACK_BODY,
      url: typeof data.url === "string" ? data.url : APP_URL,
    };
  } catch {
    return { title: FALLBACK_TITLE, body: event.data.text() || FALLBACK_BODY };
  }
};

self.addEventListener("push", (event) => {
  const payload = readPayload(event);
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/badge-96.png",
      tag: "doener-tag",
      renotify: true,
      data: { url: payload.url || APP_URL },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || APP_URL;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
      return undefined;
    }),
  );
});
