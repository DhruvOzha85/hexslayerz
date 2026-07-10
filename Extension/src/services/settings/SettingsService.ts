import type { ContextAISettings } from "./SettingsTypes";

import { SettingsValidator } from "./SettingsValidator";
import { SettingsStorage } from "./SettingsStorage";

export class SettingsService {
  /**
   * Loads and validates settings from storage.
   */
  static async loadSettings(): Promise<ContextAISettings> {
    const rawSettings = await SettingsStorage.load();
    return SettingsValidator.validate(rawSettings);
  }

  /**
   * Merges partial settings, validates them, and saves to storage.
   */
  static async saveSettings(
    updates: Partial<ContextAISettings>,
  ): Promise<ContextAISettings> {
    const current = await this.loadSettings();
    const merged = { ...current, ...updates };
    const validated = SettingsValidator.validate(merged);
    await SettingsStorage.save(validated);
    return validated;
  }

  /**
   * Resets settings to default values.
   */
  static async resetSettings(): Promise<ContextAISettings> {
    await SettingsStorage.clear();
    return SettingsValidator.validate(null);
  }
}
