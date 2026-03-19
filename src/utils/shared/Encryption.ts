import CryptoJS from "crypto-js";

const getDeviceKey = () => {
  if (typeof window === "undefined") return "fallback";
  let key = localStorage.getItem("ratio_internal_dk");
  if (!key) {
    key = Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    localStorage.setItem("ratio_internal_dk", key);
  }
  return key;
};

const SECRET_KEY = getDeviceKey();

export const EncryptionUtils = {
  saveEncrypted: (key: string, data: any) => {
    try {
      const ciphertext = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        SECRET_KEY
      ).toString();
      localStorage.setItem(key, ciphertext);
    } catch {
      console.error("Encryption failed");
    }
  },

  loadDecrypted: (key: string) => {
    try {
      const ciphertext = localStorage.getItem(key);
      if (!ciphertext) return null;
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedData ? JSON.parse(decryptedData) : null;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  },

  cleanOldKeys: () => {
    const validKeys = [
      "ratio_internal_dk",
      "ratio_app_version",
      "academia_cookies",
      "ratio_credentials",
      "ratio_data",
      "ratiod_custom_name",
      "ratiod_theme",
      "ratio_private_notes",
      "ratio_custom_classes",
      "ratiod_onboarded",
    ];

    Object.keys(localStorage).forEach((key) => {
      if (!validKeys.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  },

  flushAllStorage: () => {
    localStorage.removeItem("academia_cookies");
    localStorage.removeItem("ratio_credentials");
    localStorage.removeItem("ratio_data");
    localStorage.removeItem("ratiod_theme");
    document.cookie = "ratio_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  },

  setSessionCookie: () => {
    document.cookie = "ratio_session=active; path=/; max-age=2592000; SameSite=Lax";
  },
};
