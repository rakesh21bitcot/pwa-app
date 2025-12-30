const SHARE_DB_NAME = "SharedContentDB";
const SHARE_STORE_NAME = "pending-shares";
const SHARE_DB_VERSION = 1;

// Max file size: 50 MB per file (adjust if needed)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function openShareDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SHARE_DB_NAME, SHARE_DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SHARE_STORE_NAME)) {
        db.createObjectStore(SHARE_STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

async function saveShareToIDB(record) {
  const db = await openShareDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SHARE_STORE_NAME, "readwrite");
    const store = tx.objectStore(SHARE_STORE_NAME);

    store.put(record);

    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };

    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

const ShareTargetHandler = {
  handleShare: async (event) => {
    try {
      const formData = await event.request.formData();

      const title = formData.get("title");
      const text = formData.get("text");
      const url = formData.get("url");
      const mediaFiles = formData.getAll("media");

      const files = [];
      const mediaTypes = new Set();

      for (const file of mediaFiles) {
        if (!file || file.size === 0) continue;
        if (file.size > MAX_FILE_SIZE) continue;

        if (file.type.startsWith("image/")) mediaTypes.add("image");
        else if (file.type.startsWith("video/")) mediaTypes.add("video");
        else if (file.type.startsWith("audio/")) mediaTypes.add("audio");
        else mediaTypes.add("file");

        files.push({
          blob: file,            // ✅ Store Blob directly
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        });
      }

      const shareId = `share_${crypto.randomUUID()}`;

      const sharedContentData = {
        title,
        text,
        url,
        hasMedia: files.length > 0,
        mediaTypes: Array.from(mediaTypes),
        files,
        fileCount: files.length,
        timestamp: Date.now(),
      };

      await saveShareToIDB({
        id: shareId,
        data: sharedContentData,
        timestamp: Date.now(),
      });

      return Response.redirect(`/share-target?shareId=${shareId}`, 303);
    } catch (error) {
      console.log("Share Error:", error);
      return Response.redirect("/share-target?error=true", 303);
    }
  },
};

self.ShareTargetHandler = ShareTargetHandler;
