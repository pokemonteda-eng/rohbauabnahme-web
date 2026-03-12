```typescript
import * as CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET_KEY || 'default-secret-key-12345';

export const secureStorage = {
  setItem: (key: string, value: string): void => {
    const encryptedValue = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
    localStorage.setItem(key, encryptedValue);
  },

  getItem: (key: string): string | null => {
    const encryptedValue = localStorage.getItem(key);
    if (!encryptedValue) return null;

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY);
      const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedValue;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    localStorage.clear();
  }
};

export const setSecureToken = (token: string): void => {
  secureStorage.setItem('auth_token', token);
};

export const getSecureToken = (): string | null => {
  return secureStorage.getItem('auth_token');
};

export const removeSecureToken = (): void => {
  secureStorage.removeItem('auth_token');
};
```
