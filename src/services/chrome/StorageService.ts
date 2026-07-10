import { ChromeService } from "./ChromeService";

export class StorageService {
  /**
   * Retrieves a value from chrome.storage.local.
   */
  static async get<T>(key: string): Promise<T | null> {
    ChromeService.validateEnvironment();
    const result = await chrome.storage.local.get(key);
    return (result[key] as T) ?? null;
  }

  /**
   * Sets a value in chrome.storage.local.
   */
  static async set<T>(key: string, value: T): Promise<void> {
    ChromeService.validateEnvironment();
    await chrome.storage.local.set({ [key]: value });
  }

  /**
   * Removes a specific key from chrome.storage.local.
   */
  static async remove(key: string): Promise<void> {
    ChromeService.validateEnvironment();
    await chrome.storage.local.remove(key);
  }

  /**
   * Clears all data in chrome.storage.local.
   */
  static async clear(): Promise<void> {
    ChromeService.validateEnvironment();
    await chrome.storage.local.clear();
  }
}
