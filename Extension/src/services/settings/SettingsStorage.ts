import { StorageService } from "../chrome";
import type { Context(AI)sSettings } from "./SettingsTypes";

const SETTINGS_KEY = "context_ai_settings";

export class SettingsStorage {
  /**
   * Loads raw settings from chrome storage.
   */
  static async load(): Promise<Partial<Context(AI)sSettings> | null> {
    return await StorageService.get<Partial<Context(AI)sSettings>>(SETTINGS_KEY);
  }

  /**
   * Saves settings to chrome storage.
   */
  static async save(settings: Context(AI)sSettings): Promise<void> {
    await StorageService.set(SETTINGS_KEY, settings);
  }

  /**
   * Clears the settings from chrome storage.
   */
  static async clear(): Promise<void> {
    await StorageService.remove(SETTINGS_KEY);
  }
}
