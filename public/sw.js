// Self-destructing service worker (kill switch).
//
// This app intentionally registers NO service worker. A leftover SW from a
// previous project served on this origin (e.g. localhost:3000) can stay
// registered, keep re-fetching its script at /sw.js, and reload-loop the page.
//
// By serving this valid script at /sw.js, the browser picks it up as an update
// to that stale registration; it then unregisters itself and reloads each open
// client exactly once — permanently removing the rogue worker.
//
// Safe to delete once every device has loaded the app at least once.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});
