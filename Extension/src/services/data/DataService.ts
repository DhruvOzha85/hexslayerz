import { StorageService } from "../chrome";
import type { ContextAISettings } from "../settings";
import { SettingsValidator, SettingsService } from "../settings";
import type { Checkpoint } from "../checkpoint";
import { CheckpointValidator, CheckpointRecall, CheckpointStorage } from "../checkpoint";

// --- TYPES & CONSTANTS ---
export const CURRENT_DATA_VERSION = 1;

export interface ContextAIExportPayload {
  version: number;
  timestamp: number;
  settings: ContextAISettings;
  checkpoints: Checkpoint[];
}

const BACKUP_KEY = "context_ai_backup";

// --- MIGRATION & VALIDATION ---
export class MigrationService {
  static migrate(payload: unknown): Record<string, unknown> {
    const data = payload as Record<string, unknown>;
    const currentVersion = data.version as number;
    const migratedPayload = { ...data };

    if (currentVersion < CURRENT_DATA_VERSION) {
      migratedPayload.version = CURRENT_DATA_VERSION;
    }
    return migratedPayload;
  }
}

export class DataValidator {
  static validateSchema(payload: unknown): ContextAIExportPayload {
    if (!payload || typeof payload !== "object") throw new Error("Invalid payload: Must be a JSON object.");
    const data = payload as Record<string, unknown>;

    if (typeof data.version !== "number") throw new Error("Invalid payload: Missing or invalid version.");
    if (data.version > CURRENT_DATA_VERSION) throw new Error(`Unsupported version: ${data.version}. Extension needs an update.`);
    if (typeof data.timestamp !== "number") throw new Error("Invalid payload: Missing or invalid timestamp.");

    const validSettings = SettingsValidator.validate(data.settings as Record<string, unknown>);

    if (!Array.isArray(data.checkpoints)) throw new Error("Invalid payload: checkpoints must be an array.");
    const validCheckpoints = data.checkpoints.map((cp, idx) => {
      try {
        CheckpointValidator.validate(cp as unknown as Checkpoint);
        return cp;
      } catch (e) {
        throw new Error(`Invalid payload: Corrupt checkpoint at index ${idx}. ${e instanceof Error ? e.message : "Unknown error"}`, { cause: e });
      }
    });

    return {
      version: data.version,
      timestamp: data.timestamp,
      settings: validSettings,
      checkpoints: validCheckpoints as unknown as ContextAIExportPayload["checkpoints"],
    };
  }
}

// --- CORE SERVICE ---
export class DataService {
  static async exportData(): Promise<string> {
    const settings = await SettingsService.loadSettings();
    const checkpoints = await CheckpointRecall.getAll();

    const payload: ContextAIExportPayload = {
      version: CURRENT_DATA_VERSION,
      timestamp: Date.now(),
      settings,
      checkpoints,
    };

    return JSON.stringify(payload, null, 2);
  }

  static async importData(jsonString: string): Promise<void> {
    let rawPayload;
    try {
      rawPayload = JSON.parse(jsonString);
    } catch (e) {
      throw new Error("Import failed: Invalid JSON format.", { cause: e });
    }

    const migrated = MigrationService.migrate(rawPayload);
    const validData = DataValidator.validateSchema(migrated);

    await CheckpointStorage.clear();
    await SettingsService.saveSettings(validData.settings);

    for (const cp of validData.checkpoints) {
      await CheckpointStorage.save(cp);
    }
  }

  static async createBackup(): Promise<void> {
    const jsonString = await this.exportData();
    await StorageService.set(BACKUP_KEY, jsonString);
  }

  static async restoreBackup(): Promise<void> {
    const jsonString = await StorageService.get<string>(BACKUP_KEY);
    if (!jsonString) {
      throw new Error("No backup found to restore.");
    }
    await this.importData(jsonString);
  }
}
