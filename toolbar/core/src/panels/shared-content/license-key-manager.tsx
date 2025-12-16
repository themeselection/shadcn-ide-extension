import { Button } from '@/components/ui/button';
import { useLicenseKey } from '@/hooks/use-license-key';
import {
  CheckCircleIcon,
  EditIcon,
  KeyIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  TrashIcon,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { LicenseKeyDialog } from './license-key-dialog';

export function LicenseKeyManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    licenseKey,
    email,
    isProUser,
    lastValidated,
    removeLicenseKey,
    refreshLicenseValidation,
    needsRevalidation,
    loadLicenseKey,
  } = useLicenseKey();

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    // Force a refresh of the license state when dialog closes
    // This ensures we get the latest state after a license key has been saved
    loadLicenseKey();
  }, [loadLicenseKey]);

  const handleRemoveLicense = useCallback(async () => {
    if (
      window.confirm(
        'Are you sure you want to remove your license key? You will lose access to pro features.',
      )
    ) {
      try {
        removeLicenseKey();
      } catch (error) {
        console.error('Failed to remove license key:', error);
        alert('Failed to remove license key. Please try again.');
      }
    }
  }, [removeLicenseKey]);

  const handleRefreshValidation = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshLicenseValidation();
    } catch (error) {
      console.error('Failed to refresh license validation:', error);
      alert('Failed to refresh license validation. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshLicenseValidation]);

  const formatLicenseKey = (key: string) => {
    // Mask the middle part for security
    if (key.length <= 8) return key;
    const start = key.substring(0, 4);
    const end = key.substring(key.length - 4);
    return `${start}${'*'.repeat(8)}${end}`;
  };

  const formatLastValidated = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

    return date.toLocaleDateString();
  };

  // Pro user with license key
  if (isProUser && licenseKey) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4 text-foreground" />
            <h3 className="font-medium text-foreground text-sm">Pro License</h3>
          </div>
          <div className="flex h-5 items-center rounded-full bg-zinc-100 px-2.5 py-0.5 dark:bg-zinc-800/50">
            <CheckCircleIcon className="mr-1 h-3 w-3 text-zinc-600 dark:text-zinc-400" />
            <span className="font-medium text-xs text-zinc-700 dark:text-zinc-300">
              Active
            </span>
          </div>
        </div>{' '}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
                  {formatLicenseKey(licenseKey)}
                </code>
                {needsRevalidation() && (
                  <span
                    className="text-amber-600 text-xs dark:text-amber-400"
                    title="License validation recommended"
                  >
                    ⚠️
                  </span>
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsDialogOpen(true)}
                className="h-7 text-xs"
              >
                <EditIcon className="mr-1.5 h-3 w-3" />
                Edit
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs">
              {lastValidated && (
                <span className="text-zinc-600 dark:text-zinc-400">
                  Last validated {formatLastValidated(lastValidated)}
                </span>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefreshValidation}
                  disabled={isRefreshing}
                  className="h-6 px-2 text-xs text-zinc-600 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                >
                  <RefreshCwIcon
                    className={`mr-1 h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveLicense}
                  className="h-6 px-2 text-xs text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300"
                >
                  <TrashIcon className="mr-1 h-3 w-3" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>
        <LicenseKeyDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          existingLicenseKey={licenseKey}
          existingEmail={email}
        />
      </div>
    );
  }

  // User without license key (could be pro user who hasn't entered key or free user)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-foreground text-sm">Pro License</h3>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <KeyIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="font-medium text-foreground text-sm">
                Unlock Pro Features
              </h4>
              <p className="mt-1 text-muted-foreground text-xs">
                Add your credentials or upgrade to access premium features
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsDialogOpen(true)}
                className="flex-1 text-xs"
              >
                Add Credentials
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  // Open upgrade URL or show upgrade dialog
                  window.open('https://shadcnstudio.com/#pricing', '_blank');
                }}
                className="flex-1 text-xs"
              >
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </div>
      </div>

      <LicenseKeyDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        existingLicenseKey={null}
        existingEmail={null}
      />
    </div>
  );
}
