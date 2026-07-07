// Змінюй це число (v1 -> v2 -> v3 ...) щоразу, коли заливаєш нову версію
// index.html, manifest.json або звуків. Це єдине, що треба пам'ятати —
// решта оновлення відбудеться автоматично, без скидання кукі користувачем.
const CACHE_NAME = 'box-timer-v2';
const ASSETS = [
    './index.html',
    './manifest.json',
    './sounds/gong.mp3',
    './sounds/whistle.mp3',
    './sounds/warning.mp3',
    './sounds/tick.mp3'
];

self.addEventListener('install', (e) => {
    // Не чекаємо, поки користувач закриє всі вкладки — нова версія
    // активується одразу після встановлення
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME) // видаляємо всі СТАРІ версії кешу
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim()) // одразу беремо контроль над відкритими вкладками
    );
});

self.addEventListener('fetch', (e) => {
    // "Network first, cache fallback" для index.html - завжди намагаємось
    // взяти свіжу версію з мережі, і тільки якщо офлайн - віддаємо кеш.
    // Для решти файлів (звуки, іконки) лишаємо швидший "cache first".
    const isHtml = e.request.mode === 'navigate' || e.request.url.endsWith('index.html');

    if (isHtml) {
        e.respondWith(
            fetch(e.request)
                .then((res) => {
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
                    return res;
                })
                .catch(() => caches.match(e.request))
        );
    } else {
        e.respondWith(
            caches.match(e.request).then((res) => res || fetch(e.request))
        );
    }
});
