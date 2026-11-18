/* sw.js — Marcador de juegos de mesa
   La versión llega por la URL (sw.js?v=vNN, la pone index.html con su APP_VERSION):
   cada versión estrena su propia caché y borra las anteriores DE ESTA APP.
   Sin parámetro → «v0», para que el desajuste se vea en Ajustes → Versión.

   OJO: en GitHub Pages todas las apps del usuario comparten el mismo dominio
   (usuario.github.io). Por eso este worker solo toca cachés con el prefijo
   «marcador-» y solo atiende peticiones dentro de su propia carpeta. */
var VERSION = new URL(self.location).searchParams.get('v') || 'v0';
var PREFIX = 'marcador-';
var CACHE = PREFIX + VERSION;
var CORE = ['./', './index.html', './manifest.webmanifest',
            './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf(PREFIX) === 0 && k !== CACHE;   /* solo las viejas de ESTA app */
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                        /* escrituras: nunca se tocan */
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;         /* Google Fonts y otros dominios: pasan de largo */
  var scopePath = new URL(self.registration.scope).pathname;
  if (url.pathname.indexOf(scopePath) !== 0) return;       /* otras apps del mismo dominio: no son nuestras */

  /* El documento va RED PRIMERO (si no, verías la versión vieja hasta la segunda
     recarga). Sin conexión: la copia guardada de index.html. */
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        }
        return res;
      }).catch(function () {
        return caches.match('./index.html', { ignoreSearch: true })
          .then(function (r) { return r || caches.match('./', { ignoreSearch: true }); });
      })
    );
    return;
  }

  /* El resto (iconos, manifest) va CACHÉ PRIMERO. */
  e.respondWith(
    caches.match(req).then(function (r) {
      return r || fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});