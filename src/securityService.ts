/**
 * Security Service for Al Uzer CRM
 * Manages Owner PIN, PIN customization, and Employee vs Owner app mode.
 */

const LOCAL_STORAGE_KEYS = {
  OWNER_PIN: 'al_uzer_crm_owner_pin',
  APP_ROLE: 'al_uzer_crm_app_role',
};

const DEFAULT_OWNER_PIN = '163692';

export type AppRole = 'employee' | 'owner';

export function getOwnerPin(): string {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.OWNER_PIN);
    if (stored && stored.trim().length === 6) {
      return stored.trim();
    }
  } catch {}
  return DEFAULT_OWNER_PIN;
}

export function setOwnerPin(newPin: string): boolean {
  if (!newPin || newPin.trim().length !== 6 || !/^\d{6}$/.test(newPin.trim())) {
    return false;
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.OWNER_PIN, newPin.trim());
    return true;
  } catch {
    return false;
  }
}

export function verifyOwnerPin(inputPin: string): boolean {
  const currentPin = getOwnerPin();
  return inputPin.trim() === currentPin;
}

export function getStoredAppRole(): AppRole {
  try {
    const role = localStorage.getItem(LOCAL_STORAGE_KEYS.APP_ROLE);
    if (role === 'owner' || role === 'employee') {
      return role;
    }
  } catch {}
  return 'employee'; // Default to Employee mode for privacy safety
}

export function setStoredAppRole(role: AppRole): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.APP_ROLE, role);
  } catch {}
}
