const C="sisi-sapotay-online-v3";
const A=["./","./index.html","./admin.html","./admin-login.html","./client.html","./style.css","./app.js","./config.js","./cloud.js","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method==="GET")e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
