const VERSION = "masjid-connect-v1";
const SHELL = ["/", "/manifest.webmanifest"];
self.addEventListener("install", event => { event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", event => { const request = event.request; if (request.method !== "GET") return; const isData = new URL(request.url).pathname.endsWith("/masjids.json"); event.respondWith(caches.match(request).then(cached => { const network = fetch(request).then(response => { if (response.ok) caches.open(VERSION).then(cache => cache.put(request, response.clone())); return response; }).catch(() => cached || caches.match("/")); return isData ? (cached ? Promise.resolve(cached) : network) : (cached || network); })); });
