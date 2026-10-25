// Margin service worker: works offline. App shell is cache-first; topic packs are network-first so new packs show up right away.
const CACHE='margin-v5';
const SHELL=['./','index.html','manifest.webmanifest','icon.svg','icon-180.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 const fresh=u.pathname.includes('/packs/')||u.pathname.endsWith('/')||u.pathname.endsWith('index.html');
 if(fresh)e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r;}).catch(()=>caches.match(e.request)));
 else e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
