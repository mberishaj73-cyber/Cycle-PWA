// CACHE_NAME is like a version number for your app's memory. 
// If you update your CSS or JS, changing this to 'v3' tells the phone to refresh everything.
const CACHE_NAME = 'cycle-flow-v3';

// ASSETS is the list of files the phone should "save" so the app works without internet.
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

// --- INSTALL EVENT ---
// This runs the first time someone opens the app or when a new version is detected.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // This downloads all the files in ASSETS and stores them in the phone's cache.
      return cache.addAll(ASSETS);
    })
  );
  // skipWaiting forces the phone to use the newest version of the app immediately.
  self.skipWaiting(); 
});

// --- ACTIVATE EVENT ---
// This runs after a new installation. It’s like a "cleanup" crew.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        // It looks at all the old saved caches and deletes them if they don't match the new CACHE_NAME.
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// --- FETCH EVENT ---
// This runs every time the app asks for a file (like style.css or an image).
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 1. First, it looks in the "Cache" (the phone's saved memory).
      // 2. If it finds the file, it returns it instantly (no internet needed!).
      // 3. If it doesn't find it, it goes out to the internet to get it.
      return response || fetch(event.request);
    })
  );
});

