import { useCallback, useEffect, useState } from 'react';

// License key storage key
const LICENSE_KEY_STORAGE_KEY = 'ShadcnStudio_license_key';

interface LicenseKeyState {
  licenseKey: string | null;
  isProUser: boolean;
  email: string | null;
  isValidated: boolean;
  lastValidated: Date | null;
}

export function useLicenseKey() {
  const [licenseState, setLicenseState] = useState<LicenseKeyState>({
    licenseKey: null,
    email: null,
    isProUser: false,
    isValidated: false,
    lastValidated: null,
  });

  const loadLicenseKey = useCallback(async () => {
    try {
      const storedData = localStorage.getItem(LICENSE_KEY_STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setLicenseState({
          licenseKey: parsed.licenseKey,
          email: parsed.email,
          isProUser: parsed.isValidated === true,
          isValidated: parsed.isValidated === true,
          lastValidated: parsed.lastValidated
            ? new Date(parsed.lastValidated)
            : null,
        });
      }
    } catch (error) {
      console.warn('Failed to load license key from storage:', error);
      // Clear invalid stored data
      localStorage.removeItem(LICENSE_KEY_STORAGE_KEY);
    }
  }, []);

  // Load license key from storage on mount
  useEffect(() => {
    loadLicenseKey();

    // Listen for storage changes (from other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LICENSE_KEY_STORAGE_KEY) {
        loadLicenseKey();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadLicenseKey]);

  const validateLicenseKey = useCallback(
    async (licensekey: string, email: string): Promise<boolean> => {
      if (!licensekey || typeof licensekey !== 'string') {
        return false;
      }

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return false;
      }

      const trimmedLicenseKey = licensekey.trim();
      const trimmedEmail = email.trim();

      const validateUrl = `https://shadcnstudio.com/api/validate-user?email=${trimmedEmail}&license_key=${trimmedLicenseKey}`;

      const response = await fetch(validateUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(
          'License key validation request failed:',
          response.status,
        );
        return false;
      }
      return true;
    },
    [],
  );

  const saveLicenseKey = useCallback(
    async (key: string, email: string): Promise<void> => {
      const trimmedKey = key.trim().toUpperCase();
      const trimmedEmail = email.trim();

      console.log('Saving license key for email:', trimmedEmail);
      console.log('License key to save:', trimmedKey);

      // Validate the key first
      const isValid = await validateLicenseKey(trimmedKey, trimmedEmail);

      if (!isValid) {
        throw new Error('Invalid license key or Email');
      }

      const licenseData = {
        licenseKey: trimmedKey,
        email: trimmedEmail,
        isValidated: true,
        lastValidated: new Date().toISOString(),
      };

      try {
        // Store in localStorage
        localStorage.setItem(
          LICENSE_KEY_STORAGE_KEY,
          JSON.stringify(licenseData),
        );

        // Update state immediately
        const newState = {
          licenseKey: trimmedKey,
          email: trimmedEmail,
          isProUser: true,
          isValidated: true,
          lastValidated: new Date(),
        };

        setLicenseState(newState);

        // Trigger a storage event for other components/tabs to sync
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: LICENSE_KEY_STORAGE_KEY,
            newValue: JSON.stringify(licenseData),
            storageArea: localStorage,
          }),
        );
      } catch (error) {
        console.error('Failed to save license key:', error);
        throw new Error('Failed to save license key');
      }
    },
    [validateLicenseKey],
  );

  const removeLicenseKey = useCallback(() => {
    try {
      localStorage.removeItem(LICENSE_KEY_STORAGE_KEY);
      setLicenseState({
        licenseKey: null,
        email: null,
        isProUser: false,
        isValidated: false,
        lastValidated: null,
      });

      // Trigger a storage event for other components/tabs to sync
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: LICENSE_KEY_STORAGE_KEY,
          newValue: null,
          storageArea: localStorage,
        }),
      );
    } catch (error) {
      console.error('Failed to remove license key:', error);
      throw new Error('Failed to remove license key');
    }
  }, []);

  const refreshLicenseValidation = useCallback(async (): Promise<boolean> => {
    if (!licenseState.licenseKey) {
      return false;
    }

    try {
      const isValid = await validateLicenseKey(
        licenseState.licenseKey,
        licenseState.email,
      );

      if (isValid) {
        const licenseData = {
          licenseKey: licenseState.licenseKey,
          email: licenseState.email,
          isValidated: true,
          lastValidated: new Date().toISOString(),
        };

        localStorage.setItem(
          LICENSE_KEY_STORAGE_KEY,
          JSON.stringify(licenseData),
        );

        setLicenseState((prev) => ({
          ...prev,
          isProUser: true,
          isValidated: true,
          lastValidated: new Date(),
        }));
      } else {
        // License is no longer valid, remove it
        removeLicenseKey();
      }

      return isValid;
    } catch (error) {
      console.error('Failed to refresh license validation:', error);
      return false;
    }
  }, [licenseState.licenseKey, validateLicenseKey, removeLicenseKey]);

  // Helper to check if license needs revalidation (e.g., every 24 hours)
  const needsRevalidation = useCallback((): boolean => {
    if (!licenseState.lastValidated) {
      return true;
    }

    const hoursSinceLastValidation =
      (Date.now() - licenseState.lastValidated.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastValidation > 24; // Revalidate every 24 hours
  }, [licenseState.lastValidated]);

  return {
    // State
    licenseKey: licenseState.licenseKey,
    email: licenseState.email,
    isProUser: licenseState.isProUser,
    isValidated: licenseState.isValidated,
    lastValidated: licenseState.lastValidated,

    // Actions
    saveLicenseKey,
    removeLicenseKey,
    validateLicenseKey,
    refreshLicenseValidation,
    needsRevalidation,
    loadLicenseKey,
  };
}
