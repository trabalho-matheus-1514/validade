/* Prazo Certo — Service Worker */
/* Sempre que publicar uma nova versão do app, troque o número abaixo
   para forçar a atualização do cache nos dispositivos dos usuários. */
var CACHE_VERSION = "prazo-certo-v1";
var PRECACHE = CACHE_VERSION + "-shell";

var APP_SHELL = [
  "/",
  "/index.html",
  "/offline.html",
  "/css/styles.css",
  "/js/app.js",
  "/manifest.webmanifest",
  "/icons/icon-96.png",
  "/icons/icon-128.png",
  "/icons/icon-144.png",
  "/icons/icon-152.png",
  "/icons/icon-192.png",
  "/icons/icon-384.png",
  "/icons/icon-512.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon.ico"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(PRECACHE).then(function (cache) {
      return cache.addAll(APP_SHELL);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key.indexOf(CACHE_VERSION) !== 0; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;

  if (req.method !== "GET") return;

  var url = new URL(req.url);

  // Nunca interceptar chamadas de API externas (ex.: busca de código de barras)
  if (url.origin !== self.location.origin) return;

  // Navegação (abrir/atualizar página): tenta rede, cai para cache, depois offline.html
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(PRECACHE).then(function (cache) { cache.put("/index.html", copy); });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (cached) {
            return cached || caches.match("/index.html") || caches.match("/offline.html");
          });
        })
    );
    return;
  }

  // Demais recursos do próprio app: cache-first, atualizando em segundo plano
  event.respondWith(
    caches.match(req).then(function (cached) {
      var networkFetch = fetch(req)
        .then(function (res) {
          if (res && res.status === 200) {
            var copy = res.clone();
            caches.open(PRECACHE).then(function (cache) { cache.put(req, copy); });
          }
          return res;
        })
        .catch(function () { return cached; });
      return cached || networkFetch;
    })
  );
});
