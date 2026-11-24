/* Service worker : l'appli s'ouvre sans réseau (gymnase, salle sans wifi).
   Fichiers de l'appli : servis depuis le cache, puis mis à jour en arrière-plan.
   Changer CACHE à chaque mise en ligne pour forcer le renouvellement. */
const CACHE = 'rds-v1.4.0';
const SHELL = [
  './', './index.html', './css/app.css', './js/store.js', './js/firebase-config.js', './js/sync.js', './js/app.js', './manifest.webmanifest',
  './icons/logo-groupe.png', './icons/logo-asso.png', './icons/icon-192.png', './icons/icon-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  const isFirebaseSdk = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  if (!sameOrigin && !isFont && !isFirebaseSdk) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: sameOrigin });
      const network = fetch(req, sameOrigin ? { cache: 'no-cache' } : undefined)
        .then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (cached) { event.waitUntil(network); return cached; }
      const res = await network;
      if (res) return res;
      if (req.mode === 'navigate') return cache.match('./index.html');
      return new Response('', { status: 504, statusText: 'Hors ligne' });
    })
  );
});
