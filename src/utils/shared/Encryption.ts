import CryptoJS from "crypto-js";

const DB_NAME = "ratio_secure";
const STORE = "keys";
const KEY_ID = "dk";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      (e.target as IDBOpenDBRequest).result.createObjectStore(STORE);
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
}

async function getOrCreateKey(): Promise<CryptoKey> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const get = store.get(KEY_ID);

    get.onsuccess = async () => {
      if (get.result) {
        resolve(get.result as CryptoKey);
        return;
      }
      const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
      store.put(key, KEY_ID);
      resolve(key);
    };
    get.onerror = () => reject(get.error);
  });
}

async function encrypt(data: unknown): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const buf = new Uint8Array(12 + ciphertext.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(ciphertext), 12);
  return btoa(String.fromCharCode(...buf));
}

async function decrypt(stored: string): Promise<unknown> {
  const key = await getOrCreateKey();
  const buf = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: buf.slice(0, 12) },
    key,
    buf.slice(12)
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}

function legacyDecrypt(ciphertext: string): unknown | null {
  try {
    const legacyKey = localStorage.getItem("ratio_internal_dk");
    if (!legacyKey) return null;
    const bytes = CryptoJS.AES.decrypt(ciphertext, legacyKey);
    const str = bytes.toString(CryptoJS.enc.Utf8);
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
}

async function migrateIfNeeded(lsKey: string): Promise<void> {
  const raw = localStorage.getItem(lsKey);
  if (!raw) return;

  try {
    const buf = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    if (buf.length > 12) {
      await decrypt(raw);
      return;
    }
  } catch {
    // not new format, fall through to legacy migration
  }

  const legacyData = legacyDecrypt(raw);
  if (legacyData !== null) {
    await EncryptionUtils.saveEncrypted(lsKey, legacyData);
  } else {
    localStorage.removeItem(lsKey);
  }
}

export async function runMigration(): Promise<void> {
  if (typeof window === "undefined") return;
  const migrated = localStorage.getItem("ratio_enc_v2");
  if (migrated) return;

  await migrateIfNeeded("ratio_credentials");
  await migrateIfNeeded("academia_cookies");

  localStorage.removeItem("ratio_internal_dk");
  localStorage.setItem("ratio_enc_v2", "1");
}

export const EncryptionUtils = {
  saveEncrypted: async (key: string, data: unknown): Promise<void> => {
    try {
      localStorage.setItem(key, await encrypt(data));
    } catch {
      console.error("Encryption failed");
    }
  },

  loadDecrypted: async (key: string): Promise<unknown> => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return await decrypt(raw);
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  },

  cleanOldKeys: () => {
    const valid = [
      "ratio_enc_v2",
      "ratio_app_version",
      "academia_cookies",
      "ratio_credentials",
      "ratio_data",
      "ratiod_custom_name",
      "ratiod_theme",
      "ratio_private_notes",
      "ratio_custom_classes",
      "ratiod_onboarded",
      "ratio_update_history",
      "ratio_seen_version",
      "ratio_profile_seed",
      "ratiod_bypass_pwa",
      "ratiod_setup_bypassed",
    ];
    Object.keys(localStorage).forEach((k) => {
      if (!valid.includes(k)) localStorage.removeItem(k);
    });
  },

  flushAllStorage: async () => {
    const onboarded = localStorage.getItem("ratiod_onboarded");
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "ratio_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    try {
      const db = await openDB();
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY_ID);
    } catch {
      // best effort
    }
    if ("caches" in window) {
      try {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      } catch {
        // best effort
      }
    }
    if (onboarded) localStorage.setItem("ratiod_onboarded", onboarded);
  },

  setSessionCookie: () => {
    document.cookie = "ratio_session=active; path=/; max-age=2592000; SameSite=Strict";
  },
};
