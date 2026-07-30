/* Kustom PDRI service worker */
var VERSION = "pdri-v37";
var SHELL = [
  "./",
  "./hub.html",
  "./index.html",
  "./initial-job-walk.html",
  "./weekly-project-update.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(VERSION).then(function(cache){
      return cache.addAll(SHELL);
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k !== VERSION) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;

  var url = new URL(req.url);

  /* Fonts and other cross-origin GETs: cache-first with network fill */
  if(url.origin !== location.origin){
    e.respondWith(
      caches.match(req).then(function(hit){
        return hit || fetch(req).then(function(res){
          var copy = res.clone();
          caches.open(VERSION).then(function(cache){ cache.put(req, copy); });
          return res;
        }).catch(function(){ return hit; });
      })
    );
    return;
  }

  /* App shell: network-first so updates land, cache fallback for offline */
  e.respondWith(
    fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(VERSION).then(function(cache){ cache.put(req, copy); });
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        return hit || caches.match("./index.html");
      });
    })
  );
});
