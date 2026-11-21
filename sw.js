/* Service worker: guarda la app en el dispositivo para usarla sin internet.
   Si modificás index.html, subí la versión (v1 -> v2) para que se actualice. */
const VERSION = "caja-entradas-v1";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;                       // los POST a Sheets pasan directo
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;             // no tocar pedidos a otros sitios
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;                                // primero lo guardado: abre al instante sin red
      return fetch(req).then(res => {
        const copia = res.clone();
        caches.open(VERSION).then(c => c.put(req, copia));
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
