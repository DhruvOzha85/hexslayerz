import { StorageService } from "../chrome";
import type { ContextAISettings } from "./SettingsTypes";

const SETTINGS_KEY = "context_ai_settings";

export class SettingsStorage {
  /**
   * Loads raw settings from chrome storage.
   */
  static async load(): Promise<Partial<ContextAISettings> | null> {
    return await StorageService.get<Partial<ContextAISettings>>(SETTINGS_KEY);
  }

  /**
   * Saves settings to chrome storage.
   */
  static async save(settings: ContextAISettings): Promise<void> {
    await StorageService.set(SETTINGS_KEY, settings);
  }

  /**
   * Clears the settings from chrome storage.
   */
  static async clear(): Promise<void> {
    await StorageService.remove(SETTINGS_KEY);
  }
}
