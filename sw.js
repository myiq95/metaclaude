
/* 다락 · 오프라인 서비스워커 - v4 */
const CACHE = 'darak-v4-offline-final';
const SHELL = [
  './',
  './index.html',
  './manifest.json'
];

const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174';
const KOREAN_CMAPS = ['UniKS-UCS2-H','UniKS-UTF16-H','KSC-EUC-H','KSC-H','KSCms-UHC-H','KSCms-UHC-HW-H','KSCpc-EUC-H'];
const LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  PDFJS+'/build/pdf.min.js',
  PDFJS+'/build/pdf.worker.min.js',
  ...KOREAN_CMAPS.map(n=>PDFJS+'/cmaps/'+n+'.bcmap'),
  'https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap',
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css'
];

const CDN_HOSTS = ['cdnjs.cloudflare.com','cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com','unpkg.com'];

self.addEventListener('install', e=>{
  e.waitUntil((async()=>{
    const cache = await caches.open(CACHE);
    try{ await cache.addAll(SHELL); }catch(_){}
    await Promise.allSettled(LIBS.map(async url=>{
      try{
        const r = await fetch(url,{mode:'cors'});
        if(r.ok) await cache.put(url, r);
      }catch(_){}
    }));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil((async()=>{
    const keys = await caches.keys();
    for(const k of keys){ if(k!==CACHE) await caches.delete(k); }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  const url = new URL(e.request.url);
  const isNav = e.request.mode==='navigate' || e.request.destination==='document' || url.pathname.endsWith('/index.html') || url.pathname==='/' || url.pathname==='/myiq95.github.io/' || url.pathname.endsWith('/');

  if(isNav){
    e.respondWith((async()=>{
      const cache = await caches.open(CACHE);
      try{
        const net = await fetch(e.request);
        if(net.ok) cache.put(e.request, net.clone());
        return net;
      }catch(_){
        const hit = await cache.match('./index.html') || await cache.match('./') || await cache.match(e.request);
        return hit || new Response('<h1>오프라인</h1><p>다락이 오프라인 캐시에서 열렸어요.</p>',{headers:{'Content-Type':'text/html'}});
      }
    })());
    return;
  }

  if(CDN_HOSTS.includes(url.hostname)){
    e.respondWith((async()=>{
      const cache = await caches.open(CACHE);
      const hit = await cache.match(e.request);
      if(hit) return hit;
      try{
        const net = await fetch(e.request);
        if(net.ok) cache.put(e.request, net.clone());
        return net;
      }catch(_){
        return hit || new Response('',{status:503});
      }
    })());
  }
});
