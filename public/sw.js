/*
 * Service worker trybu offline panelu kursantki.
 *
 * Rejestruje go wyłącznie panel (components/panel-kursanta/OfflineSupport),
 * ze scope'em "/panel-kursanta" — strona publiczna nie jest nim objęta, a
 * worker OneSignala (scope "/") działa obok bez konfliktu.
 *
 * Strategie:
 * - strony panelu (nawigacje): najpierw sieć, przy braku sieci zapisana kopia,
 *   a gdy jej nie ma — /offline.html;
 * - /_next/static (JS, CSS, fonty — nazwy z hashem, niezmienne): najpierw cache;
 * - obrazki: kopia z cache, odświeżana w tle; offline dowolny zapisany rozmiar;
 * - /api, zapytania RSC i wszystko poza GET: zawsze sieć, nic nie zapisujemy.
 *
 * Strony panelu zawierają dane osobowe (mail w znaku wodnym e-booka), więc:
 * - przy zmianie konta cache stron jest czyszczony (wiadomość "sync"),
 * - wylogowanie kasuje go z poziomu strony (lib/offline.ts).
 *
 * Po zmianie tego pliku podbij VERSION — stare cache zostaną usunięte.
 */

const VERSION = "v1";
const PREFIX = "aip-";
const PAGES = `${PREFIX}pages-${VERSION}`;
const STATIC = `${PREFIX}static-${VERSION}`;
const IMAGES = `${PREFIX}images-${VERSION}`;
const META = `${PREFIX}meta-${VERSION}`;
const CURRENT = [PAGES, STATIC, IMAGES, META];

const PANEL = "/panel-kursanta";
const OFFLINE_URL = "/offline.html";
const USER_KEY = "/__aip/user";

/** Ile czekamy na sieć, zanim pokażemy zapisaną kopię strony. */
const NETWORK_TIMEOUT_MS = 8000;
/** Kopie stron starsze niż tyle odświeżamy przy rozgrzewaniu cache. */
const PAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_STATIC_ENTRIES = 400;
const MAX_IMAGE_ENTRIES = 300;
/** Preferowana szerokość obrazków zapisywanych z wyprzedzeniem. */
const WARM_IMAGE_WIDTH = 1080;

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(PAGES).then((cache) => cache.add(OFFLINE_URL)),
      // Ikona ze strony offline — też musi być dostępna bez sieci.
      caches.open(IMAGES).then((cache) => cache.add("/icon-192.png")),
    ]).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(PREFIX) && !CURRENT.includes(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// --- POBIERANIE ---

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    if (isPanelPath(url.pathname)) {
      event.respondWith(handlePage(request));
    }
    return;
  }

  // Ładunki RSC zależą od stanu routera — nie zapisujemy ich. Offline Next
  // po nieudanym pobraniu robi zwykłą nawigację, a tę obsługuje handlePage.
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }

  if (url.pathname === "/_next/image") {
    event.respondWith(handleNextImage(request));
    return;
  }

  if (/\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, IMAGES));
  }
});

function isPanelPath(pathname) {
  return pathname === PANEL || pathname.startsWith(`${PANEL}/`);
}

/** Klucz strony: sama ścieżka, bez query i końcowego ukośnika. */
function pageKey(input) {
  const url = new URL(input, self.location.origin);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  return `${url.origin}${pathname}`;
}

function isCacheablePage(response) {
  // `redirected` = np. wygasła sesja i przekierowanie na /logowanie.
  // Takiej odpowiedzi nie zapisujemy pod adresem panelu.
  return (
    response.ok &&
    !response.redirected &&
    response.type === "basic" &&
    (response.headers.get("content-type") || "").includes("text/html")
  );
}

async function handlePage(request) {
  const cache = await caches.open(PAGES);
  const key = pageKey(request.url);
  const cached = await cache.match(key, { ignoreVary: true });

  const network = fetch(request).then(async (response) => {
    if (isCacheablePage(response)) {
      await cache.put(key, response.clone());
    }
    return response;
  });
  // Po przekroczeniu czasu nikt już nie czeka na tę obietnicę — nie chcemy
  // w konsoli błędu „unhandled rejection”, gdy sieć padnie później.
  network.catch(() => {});

  try {
    // Bez zapisanej kopii czekamy na sieć tyle, ile trzeba.
    if (!cached) return await network;
    return await Promise.race([network, timeout(NETWORK_TIMEOUT_MS)]);
  } catch {
    if (cached) return cached;
    const panel = await cache.match(pageKey(PANEL), { ignoreVary: true });
    return panel || (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

function timeout(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), ms),
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });

  const network = fetch(request)
    .then(async (response) => {
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) return cached;
  return (await network) || Response.error();
}

/**
 * /_next/image ma osobny adres dla każdej szerokości. Offline podajemy
 * dowolną zapisaną szerokość tego samego obrazka — lepszy obrazek w innym
 * rozmiarze niż dziura w rozdziale.
 */
async function handleNextImage(request) {
  const cache = await caches.open(IMAGES);
  const cached = await cache.match(request, { ignoreVary: true });

  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    if (cached) return cached;

    const source = new URL(request.url).searchParams.get("url");
    if (source) {
      for (const key of await cache.keys()) {
        const keyUrl = new URL(key.url);
        if (
          keyUrl.pathname === "/_next/image" &&
          keyUrl.searchParams.get("url") === source
        ) {
          const match = await cache.match(key);
          if (match) return match;
        }
      }
    }
    return Response.error();
  }
}

// --- WIADOMOŚCI OD STRONY ---

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "sync" && typeof data.userId === "string") {
    event.waitUntil(sync(data.userId, Array.isArray(data.urls) ? data.urls : []));
  }
});

/**
 * Zapamiętuje, czyje strony są w cache, i zapisuje z wyprzedzeniem panel
 * oraz rozdziały e-booka, żeby dało się je czytać bez sieci.
 */
async function sync(userId, urls) {
  await ensureUser(userId);
  await warm(urls.filter((u) => typeof u === "string" && isPanelPath(u)));
  await trim(STATIC, MAX_STATIC_ENTRIES);
  await trim(IMAGES, MAX_IMAGE_ENTRIES);
}

async function ensureUser(userId) {
  const meta = await caches.open(META);
  const stored = await meta.match(USER_KEY);
  const storedId = stored ? await stored.text() : null;

  if (storedId !== userId) {
    // Inne konto na tym urządzeniu — strony poprzedniej osoby (z jej mailem)
    // nie mogą zostać do wglądu offline.
    await caches.delete(PAGES);
    await caches.open(PAGES).then((cache) => cache.add(OFFLINE_URL));
    await meta.put(USER_KEY, new Response(userId));
  }
}

async function warm(urls) {
  const pages = await caches.open(PAGES);

  // Po kolei, żeby nie zalać serwera i łącza kursantki.
  for (const url of urls) {
    try {
      const key = pageKey(url);
      const cached = await pages.match(key, { ignoreVary: true });
      if (cached && !isStale(cached)) continue;

      const response = await fetch(url, { credentials: "same-origin" });
      if (!isCacheablePage(response)) continue;

      const html = await response.clone().text();
      await pages.put(key, response);
      await warmAssets(html);
    } catch {
      // Brak sieci w trakcie — dokończymy przy następnej wizycie w panelu.
      return;
    }
  }
}

function isStale(response) {
  const date = Date.parse(response.headers.get("date") || "");
  return Number.isNaN(date) || Date.now() - date > PAGE_MAX_AGE_MS;
}

/** Zapisuje skrypty, style, fonty i obrazki, których potrzebuje strona. */
async function warmAssets(html) {
  const staticUrls = new Set(
    html.match(/\/_next\/static\/[^"'\s\\)]+/g) || [],
  );

  const staticCache = await caches.open(STATIC);
  for (const assetUrl of staticUrls) {
    if (await staticCache.match(assetUrl)) continue;
    const response = await fetch(assetUrl);
    if (!response.ok) continue;

    if (assetUrl.endsWith(".css")) {
      // Fonty są podpięte w CSS, nie w HTML.
      const css = await response.clone().text();
      for (const fontUrl of css.match(/\/_next\/static\/media\/[^"'\s)]+/g) ||
        []) {
        if (!(await staticCache.match(fontUrl))) {
          const font = await fetch(fontUrl);
          if (font.ok) await staticCache.put(fontUrl, font);
        }
      }
    }
    await staticCache.put(assetUrl, response);
  }

  const imageCache = await caches.open(IMAGES);
  for (const imageUrl of pickImageUrls(html)) {
    if (await imageCache.match(imageUrl)) continue;
    const response = await fetch(imageUrl);
    if (response.ok) await imageCache.put(imageUrl, response);
  }
}

/**
 * Z każdego srcSet obrazka next/image wybiera jeden rozmiar — najbliższy
 * WARM_IMAGE_WIDTH. Wszystkie szerokości to kilkanaście razy więcej danych.
 */
function pickImageUrls(html) {
  const result = new Set();
  const srcSets = html.match(/srcSet="[^"]*\/_next\/image[^"]*"/g) || [];

  for (const attr of srcSets) {
    const candidates = attr
      .slice('srcSet="'.length, -1)
      .split(",")
      .map((part) => {
        const [url, width] = part.trim().split(/\s+/);
        return { url: url.replace(/&amp;/g, "&"), width: parseInt(width) || 0 };
      })
      .filter((c) => c.url.startsWith("/_next/image"));
    if (candidates.length === 0) continue;

    candidates.sort(
      (a, b) =>
        Math.abs(a.width - WARM_IMAGE_WIDTH) -
        Math.abs(b.width - WARM_IMAGE_WIDTH),
    );
    result.add(candidates[0].url);
  }
  return result;
}

/** Usuwa najstarsze wpisy ponad limit (np. skrypty z poprzednich wdrożeń). */
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) {
    await cache.delete(key);
  }
}
