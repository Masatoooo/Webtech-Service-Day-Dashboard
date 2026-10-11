import { Injectable } from '@angular/core';

export const STORAGE_KEYS = {
  NGOS: 'sdd_ngos',
  ACTIVITIES: 'sdd_activities',
  USERS: 'sdd_users',
  REGISTRATIONS: 'sdd_registrations',
  NOTIFICATIONS: 'sdd_notifications',
  ATTENDANCE: 'sdd_attendance',
  INITIALIZED: 'sdd_initialized'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly memoryFallback = new Map<string, string>();
  private isStorageAvailable: boolean;

  constructor() {
    this.isStorageAvailable = this.checkStorageAvailability();
  }

  /**
   * Safe check for localStorage availability (handles disabled cookies,
   * incognito quotas, SecurityErrors, or non-browser environments).
   */
  private checkStorageAvailability(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__sdd_storage_probe__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retrieves a typed value from storage.
   * If parsing fails or data is corrupt, safely logs a warning and returns the fallback.
   */
  getItem<T>(key: string, fallback: T | null = null): T | null {
    try {
      let raw: string | null = null;
      if (this.isStorageAvailable) {
        raw = window.localStorage.getItem(key);
      } else {
        raw = this.memoryFallback.get(key) ?? null;
      }

      if (raw === null || raw === undefined) {
        return fallback;
      }

      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`[StorageService] Failed to parse key "${key}". Returning fallback.`, error);
      return fallback;
    }
  }

  /**
   * Saves a typed value to storage after serializing to JSON.
   */
  setItem<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      if (this.isStorageAvailable) {
        window.localStorage.setItem(key, serialized);
      } else {
        this.memoryFallback.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`[StorageService] Failed to set key "${key}". Falling back to in-memory store.`, error);
      try {
        this.memoryFallback.set(key, JSON.stringify(value));
      } catch {
        // Safe no-op
      }
      return false;
    }
  }

  /**
   * Removes an item by key from both localStorage and in-memory store.
   */
  removeItem(key: string): void {
    try {
      if (this.isStorageAvailable) {
        window.localStorage.removeItem(key);
      }
      this.memoryFallback.delete(key);
    } catch (error) {
      console.warn(`[StorageService] Failed to remove key "${key}".`, error);
    }
  }

  /**
   * Checks whether a non-null item exists for the key.
   */
  hasItem(key: string): boolean {
    if (this.isStorageAvailable) {
      try {
        return window.localStorage.getItem(key) !== null;
      } catch {
        return this.memoryFallback.has(key);
      }
    }
    return this.memoryFallback.has(key);
  }

  /**
   * Clears all Service Day specific keys.
   */
  clearAllDemoData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      this.removeItem(key);
    });
  }

  /**
   * Indicates whether native localStorage is operational.
   */
  get isLocalStorageSupported(): boolean {
    return this.isStorageAvailable;
  }
}
