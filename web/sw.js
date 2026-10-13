// Cache: kerangka situs (cache-first) dan data (network-first, cadangan cache saat offline)
const V = "v2", KERANGKA = ["./", "index.html", "css/style.css", "js/app.js", "geo/desa.geojson", "img/lambang.svg", "manifest.json", "rapor.html", "css/rapor.css", "js/rapor.js"];
self.addEventListener("install", e => e.waitUntil(caches.open(V).then(c => c.addAll(KERANGKA))));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== V).map(n => caches.delete(n))))));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  if (u.pathname.includes("/data/")) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
  } else e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
