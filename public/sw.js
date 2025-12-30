
try {
  importScripts("./sw/caching-sw.js");
  importScripts("./sw/notification-sw.js");
  importScripts("./sw/background-sync-sw.js");
  importScripts("./sw/web-share-sw.js");
} catch (e) {
  console.log("Module loading failed:", e);
}

self.addEventListener("install", (event) => {
  if (self.CachingHandlers) {
    self.CachingHandlers.handleInstall(event);
  }
});

self.addEventListener("activate", (event) => {
  if (self.CachingHandlers) {
    self.CachingHandlers.handleActivate(event);
  }
  if (self.NotificationHandlers && self.NotificationHandlers.restoreTimers) {
    event.waitUntil(self.NotificationHandlers.restoreTimers());
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === "/api/share-target" && event.request.method === "POST") {
    if (self.ShareTargetHandler) {
      event.respondWith(self.ShareTargetHandler.handleShare(event));
      return;
    }
  }

  if (self.CachingHandlers && event.request.method === "GET") {
    self.CachingHandlers.handleFetch(event);
  }
});

self.addEventListener("push", (event) => {
  if (self.NotificationHandlers) {
    self.NotificationHandlers.handlePush(event);
  }
});

self.addEventListener("notificationclick", (event) => {
  if (self.NotificationHandlers) {
    self.NotificationHandlers.handleClick(event);
  }
});

self.addEventListener("notificationclose", (event) => {
  if (self.NotificationHandlers) {
    self.NotificationHandlers.handleClose(event);
  }
});

self.addEventListener("sync", (event) => {
  if (self.BackgroundSyncHandlers) {
    self.BackgroundSyncHandlers.handleSync(event);
  }
});

self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data.type === "CHECK_STATUS") {
    event.source.postMessage({
      type: "SW_READY",
      timestamp: Date.now(),
    });
    return;
  }

  if (self.BackgroundSyncHandlers) {
    if (
      event.data.type === "FORCE_SYNC" ||
      event.data.type === "ONLINE_STATUS"
    ) {
      self.BackgroundSyncHandlers.handleMessage(event);
    }
  }
});

