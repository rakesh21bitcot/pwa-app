const SYNC_TAG = "sync-expenses";
const DB_NAME = "PWADatabase";
const DB_VERSION = 1;
const STORE_NAME = "pending-sync";

function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains("expenses")) {
        db.createObjectStore("expenses", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
  });
}

async function getPendingExpenses() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    return await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.log(" Error getting pending expenses:", error.name, error.message);
    return [];
  }
}

async function removeFromPendingSync(id) {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = resolve;
      request.onerror = reject;
    });
  } catch (error) {
    console.log(" Error removing expense:", error.name, error.message);
  }
}

function notifyClient(type, data) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: type,
        data: data,
        timestamp: Date.now(),
      });
    });
  });
}

async function syncExpenses() {
  try {
    if (!navigator.onLine) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch("/api/sync?action=ping", {
        method: "GET",
        cache: "no-cache",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        return;
      }
    } catch (error) {
      console.log(" Network connectivity check failed:", error.message);
      return;
    }

    const pendingExpenses = await getPendingExpenses();
    if (pendingExpenses.length === 0) {
      return;
    }

    for (const expense of pendingExpenses) {
      try {
        const response = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(expense.data),
        });

        if (response.ok) {
          await removeFromPendingSync(expense.id);
          notifyClient("SYNC_SUCCESS", expense.data);
        } else {
          console.log(" Failed to sync expense:", expense.id, response.status);
        }
      } catch (error) {
        console.log(" Error syncing expense:", expense.id, error);
        notifyClient("SYNC_FAILED", {
          expense: expense.data,
          error: error.message,
        });
      }
    }
  } catch (error) {
    console.log(" Error syncing expenses:", error.name, error.message);
    notifyClient("SYNC_FAILED", { error: error.message });
  }
}

const BackgroundSyncHandlers = {
  handleSync: (event) => {
    if (event.tag === SYNC_TAG) {
      event.waitUntil(syncExpenses());
    }
  },

  handleMessage: (event) => {
    const { type, data } = event.data;
    switch (type) {
      case "FORCE_SYNC":
        syncExpenses();
        break;
      case "ONLINE_STATUS":
        if (data.isOnline) syncExpenses();
        break;
    }
  },
};

self.BackgroundSyncHandlers = BackgroundSyncHandlers;
