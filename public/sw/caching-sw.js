self.isPrecachingComplete = false;

const CACHE_PREFIX = "pwa-cache";

const CACHE_NAMES = {
  pages: `${CACHE_PREFIX}-pages`,
  static: `${CACHE_PREFIX}-static`,
  images: `${CACHE_PREFIX}-images`,
  api: `${CACHE_PREFIX}-api`,
};

const CACHE_LIMITS = {
  pages: 100,
  static: 500,
  images: 100,
  api: 150,
};

const NETWORK_TIMEOUTS = {
  document: 10000,
  script: 12000,
  style: 10000,
  image: 10000,
  font: 10000,
  api: 15000,
  default: 10000,
};

const OFFLINE_PAGE = "/offline";

const ESSENTIAL_ROUTES = [
  "/",
  "/chat-portal",
  "/health-information",
  "/offline",
  "/manifest.json",
];

const CRITICAL_IMAGES = [
  "/icons/camera.png",
  "/icons/Vector.png",
  "/icons/send.png",
  "/images/offline-message-icon.png",
  "/icons/app_Logo.png",
  "/icons/backArrow.png",
  "/icons/backbutton.png",
  "/icons/land-marker.svg",
  "/icons/patient-icon.svg",
  "/icons/doctor.png",
  "/icons/notification.png",
  "/icons/learnmore.svg",
  "/icons/provider.svg",
  "/icons/share-file.svg",
  "/icons/doctor.svg",
];

const DEVICE_PROFILES = {
  desktop: {
    name: "desktop",
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  mobile: {
    name: "mobile",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  tablet: {
    name: "tablet",
    ua: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
};

let currentBuildId = null;

function getCurrentDeviceType() {
  const ua = self.navigator.userAgent;
  if (/iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    return "tablet";
  }
  if (/iPhone|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

async function getCurrentBuildId() {
  if (currentBuildId) return currentBuildId;
  try {
    const response = await fetch("/", {
      cache: "no-cache",
      credentials: "same-origin",
    });
    if (response.ok) {
      const html = await response.text();
      const buildIdMatch = html.match(/"buildId":"([^"]+)"/);
      if (buildIdMatch && buildIdMatch[1]) {
        currentBuildId = buildIdMatch[1];
        const cache = await caches.open("build-metadata-v1");
        await cache.put("/build-id", new Response(currentBuildId));
        return currentBuildId;
      }
    }
  } catch (err) {
    console.log(err);
  }
  try {
    const cache = await caches.open("build-metadata-v1");
    const cached = await cache.match("/build-id");
    if (cached) {
      currentBuildId = await cached.text();
      return currentBuildId;
    }
  } catch (err) {
    console.log(err);
  }
  return null;
}

async function extractBuildIdFromUrl(url) {
  const dataMatch = url.pathname.match(/\/_next\/data\/([^\/]+)\//);
  if (dataMatch && dataMatch[1]) return dataMatch[1];
  const staticMatch = url.pathname.match(/\/_next\/static\/([^\/]+)\//);
  if (staticMatch && staticMatch[1]) return staticMatch[1];
  return null;
}

async function addCacheMetadata(response) {
  const blob = await response.blob();
  return new Response(blob, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers({
      ...Object.fromEntries(response.headers),
      "X-Cache-Time": Date.now().toString(),
      "X-Cache-TTL": "3600000",
    }),
  });
}

function getCacheName(url) {
  const pathname = url.pathname;
  if (pathname.startsWith("/api/")) return CACHE_NAMES.api;
  if (/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(pathname))
    return CACHE_NAMES.images;
  if (
    /\.(js|css|woff2?|ttf|eot)$/i.test(pathname) ||
    pathname.startsWith("/_next/")
  )
    return CACHE_NAMES.static;
  return CACHE_NAMES.pages;
}

async function enforceQuotaLimit(cacheName) {
  try {
    const cacheType = cacheName.split("-").pop();
    const limit = CACHE_LIMITS[cacheType];
    if (!limit) return;
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > limit) {
      const overage = keys.length - limit;
      for (let i = 0; i < overage; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch (err) {
    console.log(" Quota enforcement failed:", err);
  }
}

async function cleanupOldCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter(key => key.startsWith(CACHE_PREFIX))
      .map(key => caches.delete(key))
  );
}

async function getCachedResponse(request, url, cacheName) {
  const cache = await caches.open(cacheName);
  let response = await cache.match(request, { ignoreVary: true });
  if (response) return response;
  const urlWithoutQuery = new URL(url);
  urlWithoutQuery.search = "";
  response = await cache.match(urlWithoutQuery.href, { ignoreVary: true });
  if (response) return response;
  response = await cache.match(url.pathname, { ignoreVary: true });
  if (response) return response;
  const alternatePaths = [url.pathname + "/", url.pathname.replace(/\/$/, "")];
  for (const path of alternatePaths) {
    response = await cache.match(path, { ignoreVary: true });
    if (response) return response;
  }
  return null;
}

function updateCacheInBackground(request, url, cacheName, deviceType) {
  const device = DEVICE_PROFILES[deviceType];
  fetch(request, {
    headers: url.pathname.startsWith("/_next/")
      ? { "User-Agent": device.ua }
      : {},
  })
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => {
          if (url.pathname.startsWith("/_next/")) {
            const deviceCacheKey = `${deviceType}:${url.pathname}`;
            const deviceRequest = new Request(request.url, {
              headers: {
                "X-Device-Type": deviceType,
                "X-SW-Cache-Key": deviceCacheKey,
              },
            });
            cache.put(deviceRequest, response);
          } else {
            cache.put(request, response);
          }
        });
      }
    })
    .catch(() => { });
}

function getRequestType(request, url) {
  if (url.pathname.startsWith("/api/")) return "api";
  const purpose = request.headers.get("purpose");
  const nextRouterState = request.headers.get("next-router-state-tree");
  const nextUrl = request.headers.get("next-url");
  const rsc = request.headers.get("rsc");
  const isNextClientNav =
    purpose === "prefetch" ||
    nextRouterState !== null ||
    nextUrl !== null ||
    rsc === "1";
  const isDocumentRequest =
    request.destination === "document" || request.mode === "navigate";
  if (
    isDocumentRequest &&
    !isNextClientNav &&
    !url.pathname.startsWith("/_next/data/")
  ) {
    return "navigation";
  }
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image" ||
    url.pathname.startsWith("/_next/")
  )
    return "static";
  return "default";
}

function updateDataCacheInBackground(route, buildId, cacheName, deviceType) {
  if (!route || !buildId) return;
  const dataUrl = `/_next/data/${buildId}${route === "/" ? "/index" : route
    }.json`;
  const device = DEVICE_PROFILES[deviceType];
  fetch(dataUrl, {
    credentials: "same-origin",
    headers: { "User-Agent": device.ua },
  })
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => {
          const deviceCacheKey = `${deviceType}:${dataUrl}`;
          const deviceRequest = new Request(dataUrl, {
            headers: {
              "X-Device-Type": deviceType,
              "X-SW-Cache-Key": deviceCacheKey,
            },
          });
          cache.put(deviceRequest, response);
        });
      }
    })
    .catch(() => { });
}

async function precacheCriticalImages() {
  const imageCache = await caches.open(CACHE_NAMES.images);
  for (const imagePath of CRITICAL_IMAGES) {
    try {
      const originalResponse = await fetch(imagePath);
      if (originalResponse.ok) {
        await imageCache.put(imagePath, originalResponse.clone());
      }
      const widths = [48, 64, 96, 128, 256];
      for (const width of widths) {
        const optimizedUrl = `/_next/image?url=${encodeURIComponent(
          imagePath
        )}&w=${width}&q=75`;
        try {
          const optimizedResponse = await fetch(optimizedUrl);
          if (optimizedResponse.ok) {
            await imageCache.put(optimizedUrl, optimizedResponse);
          }
        } catch (err) {
          console.log(`Failed to fetch optimized image`, err);
        }
      }
    } catch (err) {
      console.log(`Failed to fetch critical image`, err);
    }
  }
}

async function precacheEssentialsAgnostic() {
  try {
    const pagesCache = await caches.open(CACHE_NAMES.pages);
    const staticCache = await caches.open(CACHE_NAMES.static);

    await Promise.allSettled([
      fetch("/manifest.json", { cache: "reload" }).then((res) =>
        res.ok ? pagesCache.put("/manifest.json", res) : null
      ),
      fetch("/offline", { cache: "reload" }).then((res) =>
        res.ok ? pagesCache.put("/offline", res) : null
      ),
      fetch("/", { cache: "reload" }).then((res) =>
        res.ok ? pagesCache.put("/", res) : null
      ),
      fetch("/chat-portal", { cache: "reload" }).then((res) =>
        res.ok ? pagesCache.put("/chat-portal", res) : null
      ),
      fetch("/health-information", { cache: "reload" }).then((res) =>
        res.ok ? pagesCache.put("/health-information", res) : null
      ),
    ]);

    const routesToCache = ESSENTIAL_ROUTES.filter(
      (route) => route !== "/manifest.json" && route !== "/offline"
    );

    let detectedBuildId = null;

    for (const deviceType of Object.keys(DEVICE_PROFILES)) {
      const device = DEVICE_PROFILES[deviceType];

      for (const route of routesToCache) {
        try {
          const response = await fetch(route, {
            headers: { "User-Agent": device.ua },
            cache: "no-cache",
            credentials: "same-origin",
          });

          if (response.ok) {
            const deviceCacheKey = `${deviceType}:${route}`;
            await pagesCache.put(
              new Request(route, {
                headers: {
                  "X-Device-Type": deviceType,
                  "X-SW-Cache-Key": deviceCacheKey,
                },
              }),
              response.clone()
            );

            const html = await response.text();
            const buildIdMatch = html.match(/"buildId":"([^"]+)"/);
            if (buildIdMatch && buildIdMatch[1]) {
              detectedBuildId = buildIdMatch[1];
            }
          }

          try {
            const rscResponse = await fetch(route, {
              headers: { "User-Agent": device.ua, RSC: "1" },
              cache: "no-cache",
              credentials: "same-origin",
            });

            if (rscResponse.ok) {
              const rscKey = `${route}/__rsc`;
              const deviceRscKey = `${deviceType}:${rscKey}`;

              await pagesCache.put(
                new Request(rscKey, {
                  headers: {
                    "X-Device-Type": deviceType,
                    "X-SW-Cache-Key": deviceRscKey,
                  },
                }),
                rscResponse
              );
            }
          } catch (e) {
            console.log("Error caching RSC for route", route, e);
          }
        } catch (err) {
          console.log("Error checking route", route, err);
        }
      }
    }

    if (detectedBuildId) {
      currentBuildId = detectedBuildId;
      const metaCache = await caches.open("build-metadata-v1");
      await metaCache.put("/build-id", new Response(detectedBuildId));
    }

    let allStaticResources = [];
    try {
      const manifestRes = await fetch("/api/pwa-manifest");
      if (manifestRes.ok) {
        const data = await manifestRes.json();
        if (data.files && Array.isArray(data.files)) {
          allStaticResources = data.files;
        }
      }
    } catch (err) {
      console.log("Failed to fetch PWA manifest from API:", err);
    }

    const BATCH_SIZE = 5;
    for (let i = 0; i < allStaticResources.length; i += BATCH_SIZE) {
      const batch = allStaticResources.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async (url) => {
          try {
            const existing = await staticCache.match(url);
            if (existing) return;

            const res = await fetch(url, {
              cache: "no-cache",
              priority: "high",
            });
            if (res.ok) {
              await staticCache.put(url, res);
            }
          } catch (e) {
            console.log("Error caching static resource", e);
          }
        })
      );
    }
  } catch (error) {
    console.log("Pre-caching error:", error);
  }
}

function isNextJSResource(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.includes("webpack") ||
    url.pathname.includes("main-app") ||
    url.pathname.includes("app-pages-internals")
  );
}

async function handleNextImageRequest(request, url) {
  const imageCache = await caches.open(CACHE_NAMES.images);
  const staticCache = await caches.open(CACHE_NAMES.static);
  let cached = await imageCache.match(request);
  if (cached) return cached;

  const imageUrl = url.searchParams.get("url");
  if (imageUrl) {
    cached = await imageCache.match(imageUrl);
    if (cached) return cached;
    cached = await staticCache.match(imageUrl);
    if (cached) return cached;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      NETWORK_TIMEOUTS.image
    );
    const networkResponse = await fetch(request, {
      signal: controller.signal,
      credentials: "same-origin",
    });
    clearTimeout(timeoutId);
    if (networkResponse.ok) {
      imageCache
        .put(request, networkResponse.clone())
        .then(() => enforceQuotaLimit(CACHE_NAMES.images));
      return networkResponse;
    }
  } catch (err) {
    console.log("Next Image fetch failed:", err);
  }

  const transparentPng =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  return fetch(transparentPng);
}

async function handleNextDataRequest(request, url, cacheName, deviceType) {
  const cache = await caches.open(cacheName);
  const urlBuildId = await extractBuildIdFromUrl(url);
  const routeMatch = url.pathname.match(/\/_next\/data\/[^\/]+\/(.+)\.json$/);
  let route = null;
  if (routeMatch) {
    route = routeMatch[1] === "index" ? "/" : "/" + routeMatch[1];
  }

  const serverBuildId = await getCurrentBuildId();
  if (urlBuildId && serverBuildId && urlBuildId !== serverBuildId && route) {
    const correctedUrl = `/_next/data/${serverBuildId}${route === "/" ? "/index" : route
      }.json`;
    try {
      const correctedRequest = new Request(correctedUrl, {
        headers: request.headers,
        credentials: "same-origin",
      });
      return handleNextDataRequest(
        correctedRequest,
        new URL(correctedUrl, self.location.origin),
        cacheName,
        deviceType
      );
    } catch (err) {
      console.log("Failed to fetch corrected Next.js data URL:", err);
    }
  }

  const deviceCacheKey = `${deviceType}:${url.pathname}`;
  const deviceSpecificRequest = new Request(url.href, {
    headers: { "X-Device-Type": deviceType, "X-SW-Cache-Key": deviceCacheKey },
  });
  let cached = await cache.match(deviceSpecificRequest, { ignoreVary: true });
  if (cached) {
    updateDataCacheInBackground(route, serverBuildId, cacheName, deviceType);
    return cached;
  }

  cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      NETWORK_TIMEOUTS.document
    );
    const device = DEVICE_PROFILES[deviceType];
    const networkResponse = await fetch(request, {
      signal: controller.signal,
      credentials: "same-origin",
      headers: { "User-Agent": device.ua },
    });
    clearTimeout(timeoutId);
    if (networkResponse.ok) {
      const deviceRequest = new Request(url.href, {
        headers: {
          "X-Device-Type": deviceType,
          "X-SW-Cache-Key": deviceCacheKey,
        },
      });
      cache
        .put(deviceRequest, networkResponse.clone())
        .then(() => enforceQuotaLimit(cacheName));
    }
    return networkResponse;
  } catch (error) {
    console.log("Failed to handle Next.js data request:", error);
    return new Response(JSON.stringify({ pageProps: {}, __N_SSP: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleNextJSResource(request, url, cacheName, deviceType) {
  const cache = await caches.open(cacheName);
  const deviceCacheKey = `${deviceType}:${url.pathname}`;
  const deviceSpecificRequest = new Request(url.href, {
    headers: { "X-Device-Type": deviceType, "X-SW-Cache-Key": deviceCacheKey },
  });
  let cached = await cache.match(deviceSpecificRequest, { ignoreVary: true });
  if (cached) {
    updateCacheInBackground(request, url, cacheName, deviceType);
    return cached;
  }

  cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;

  const allCacheNames = [
    CACHE_NAMES.static,
    CACHE_NAMES.pages,
    CACHE_NAMES.images,
  ];
  for (const cn of allCacheNames) {
    const otherCache = await caches.open(cn);
    const response = await otherCache.match(url.pathname, {
      ignoreSearch: true,
      ignoreVary: true,
    });
    if (response) return response;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      NETWORK_TIMEOUTS.script
    );
    const device = DEVICE_PROFILES[deviceType];
    const networkResponse = await fetch(request, {
      signal: controller.signal,
      credentials: "same-origin",
      headers: { "User-Agent": device.ua },
    });
    clearTimeout(timeoutId);
    if (networkResponse.ok) {
      const deviceRequest = new Request(url.href, {
        headers: {
          "X-Device-Type": deviceType,
          "X-SW-Cache-Key": deviceCacheKey,
        },
      });
      cache.put(deviceRequest, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("Failed to handle Next.js resource request:", error);
    return new Response("", { status: 200 });
  }
}

async function handleAPIRequest(request, url, cacheName) {
  const isShareTarget = url.pathname.includes("/share-target");
  const isSync = url.pathname.includes("/sync");
  const syncTimeout = isSync ? 5000 : NETWORK_TIMEOUTS.api;
  const timeout = isShareTarget ? 3000 : syncTimeout;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const networkResponse = await fetch(request, {
      signal: controller.signal,
      credentials: "same-origin",
    });
    clearTimeout(timeoutId);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = await addCacheMetadata(networkResponse.clone());
      cache
        .put(request, responseToCache)
        .then(() => enforceQuotaLimit(cacheName));
    }
    return networkResponse;
  } catch (error) {
    console.log("Failed to handle API request:", error);
    const cached = await getCachedResponse(request, url, cacheName);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ offline: true, error: "No network connection" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function handleNavigationRequest(request, url, cacheName, deviceType) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      NETWORK_TIMEOUTS.document
    );
    const device = DEVICE_PROFILES[deviceType];
    const networkResponse = await fetch(request, {
      signal: controller.signal,
      credentials: "same-origin",
      headers: { "User-Agent": device.ua },
    });
    clearTimeout(timeoutId);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const deviceCacheKey = `${deviceType}:${url.pathname}`;
      const deviceRequest = new Request(url.href, {
        headers: {
          "X-Device-Type": deviceType,
          "X-SW-Cache-Key": deviceCacheKey,
        },
      });
      cache
        .put(deviceRequest, networkResponse.clone())
        .then(() => enforceQuotaLimit(cacheName));
    }
    return networkResponse;
  } catch (error) {
    console.log("Failed to handle navigation request:", error);
    const cache = await caches.open(cacheName);
    const deviceCacheKey = `${deviceType}:${url.pathname}`;
    const deviceSpecificRequest = new Request(url.href, {
      headers: {
        "X-Device-Type": deviceType,
        "X-SW-Cache-Key": deviceCacheKey,
      },
    });
    let cached = await cache.match(deviceSpecificRequest, { ignoreVary: true });
    if (!cached) cached = await getCachedResponse(request, url, cacheName);
    if (cached) return cached;

    const offlinePage = await cache.match("/offline");
    if (offlinePage) return offlinePage;
    return new Response(
      "<!DOCTYPE html><html><body><h1>Offline</h1></body></html>",
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }
}

async function handleStaticRequest(request, url, cacheName, deviceType) {
  const cache = await caches.open(cacheName);

  if (
    request.destination === "image" ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname)
  ) {
    const imageCache = await caches.open(CACHE_NAMES.images);
    const imgCached = await imageCache.match(url.pathname, {
      ignoreVary: true,
    });
    if (imgCached) return imgCached;
  }

  let cached = await getCachedResponse(request, url, cacheName);
  if (cached) return cached;

  cached = await cache.match(url.pathname, { ignoreVary: true });
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout =
      NETWORK_TIMEOUTS[request.destination] || NETWORK_TIMEOUTS.default;
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const device = DEVICE_PROFILES[deviceType];
    const networkResponse = await fetch(request, {
      signal: controller.signal,
      headers: url.pathname.startsWith("/_next/")
        ? { "User-Agent": device.ua }
        : {},
    });
    clearTimeout(timeoutId);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("Failed to handle static request:", error);
    return new Response("", { status: 404 });
  }
}

async function handleDefaultRequest(request, url, cacheName, deviceType) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      NETWORK_TIMEOUTS.default
    );

    const networkResponse = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone()).then(() => {
        enforceQuotaLimit(cacheName);
      });
    }

    return networkResponse;
  } catch (error) {
    const isRscDataRequest =
      request.headers.get("rsc") === "1" || url.searchParams.has("_rsc");
    const isPrefetch =
      request.headers.get("next-router-prefetch") === "1" ||
      request.headers.get("purpose") === "prefetch";

    if (isRscDataRequest) {
      if (isPrefetch) {
        return new Response("{}", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const rscKey = `${url.pathname}/__rsc`;

      const cache = await caches.open(CACHE_NAMES.pages);
      const deviceCacheKey = `${deviceType}:${rscKey}`;
      const deviceRequest = new Request(rscKey, {
        headers: {
          "X-Device-Type": deviceType,
          "X-SW-Cache-Key": deviceCacheKey,
        },
      });

      let cachedRsc = await cache.match(deviceRequest, { ignoreVary: true });

      if (!cachedRsc) {
        cachedRsc = await cache.match(rscKey, { ignoreVary: true });
      }

      if (cachedRsc) {
        return cachedRsc;
      }

      return new Response(null, { status: 204, statusText: "No Content" });
    }

    const cached = await getCachedResponse(request, url, cacheName);
    if (cached) return cached;

    const isLikelyPageRequest =
      !url.pathname.startsWith("/_next/") &&
      !url.pathname.includes(".") &&
      url.pathname !== "/";

    if (isLikelyPageRequest) {
      const pagesCache = await caches.open(CACHE_NAMES.pages);
      const cachedPage = await pagesCache.match(url.pathname, {
        ignoreSearch: true,
        ignoreVary: true,
      });
      if (cachedPage) return cachedPage;

      const withSlash = url.pathname.endsWith("/")
        ? url.pathname.slice(0, -1)
        : url.pathname + "/";
      const cachedVariant = await pagesCache.match(withSlash, {
        ignoreSearch: true,
        ignoreVary: true,
      });
      if (cachedVariant) return cachedVariant;
    }

    return new Response("Not found offline", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function handleRequest(request, url) {
  const cacheName = getCacheName(url);
  const requestType = getRequestType(request, url);
  const deviceType = getCurrentDeviceType();

  if (url.pathname === "/_next/image")
    return handleNextImageRequest(request, url);
  if (url.pathname.startsWith("/_next/data/"))
    return handleNextDataRequest(request, url, cacheName, deviceType);
  if (isNextJSResource(url))
    return handleNextJSResource(request, url, cacheName, deviceType);

  switch (requestType) {
    case "api":
      return handleAPIRequest(request, url, cacheName);
    case "navigation":
      return handleNavigationRequest(request, url, cacheName, deviceType);
    case "static":
      return handleStaticRequest(request, url, cacheName, deviceType);
    default:
      return handleDefaultRequest(request, url, cacheName, deviceType);
  }
}

const CachingHandlers = {
  handleInstall: (event) => {
    event.waitUntil(
      Promise.all([precacheEssentialsAgnostic(), precacheCriticalImages()])
        .then(() => {
          self.isPrecachingComplete = true;
          return self.clients.matchAll({
            includeUncontrolled: true,
            type: "window",
          });
        })
        .then((clients) => {
          if (clients && clients.length) {
            clients.forEach((client) => {
              client.postMessage({
                type: "SW_READY",
                buildId: currentBuildId || null,
                timestamp: Date.now(),
              });
            });
          }
          return self.skipWaiting();
        })
        .catch((err) => {
          console.log("Pre-caching failed:", err);
          return self.skipWaiting();
        })
    );
  },
  handleActivate: (event) => {
    event.waitUntil(
      Promise.all([
        self.clients.claim(),
        cleanupOldCaches(),
        getCurrentBuildId()
      ])
    );
  },
  handleFetch: (event) => {
    const { request } = event;
    const url = new URL(request.url);
    if (
      request.method !== "GET" ||
      !url.protocol.startsWith("http") ||
      url.origin !== self.location.origin
    )
      return;
    event.respondWith(handleRequest(request, url));
  },
};

self.CachingHandlers = CachingHandlers;
self.CACHE_NAMES = CACHE_NAMES;
