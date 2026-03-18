import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.NEXT_PUBLIC_COOKIE_ENCRYPTION_KEY;

if (!SECRET_KEY && typeof window !== 'undefined') {
  console.warn("Security Warning: NEXT_PUBLIC_COOKIE_ENCRYPTION_KEY is missing.");
}

export const EncryptionUtils = {
  saveEncrypted: (key: string, data: any) => {
    try {
      const ciphertext = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        SECRET_KEY,
      ).toString();
      localStorage.setItem(key, ciphertext);
    } catch (e) {
      console.error("Encryption failed", e);
    }
  },

  loadDecrypted: (key: string) => {
    try {
      const ciphertext = localStorage.getItem(key);
      if (!ciphertext) return null;
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedData ? JSON.parse(decryptedData) : null;
    } catch (e) {
      localStorage.removeItem(key);
      return null;
    }
  },

  cleanOldKeys: () => {
    const validKeys = [
      "academia_cookies",
      "ratio_credentials",
      "ratio_data",
      "ratiod_custom_name",
      "ratiod_theme",
      "ratio_private_notes",
      "ratio_class_notes",
      "ratio_custom_classes",
      "ratio_app_version",
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
  },
};
