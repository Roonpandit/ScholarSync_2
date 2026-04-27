import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallResult {
  outcome: 'accepted' | 'dismissed' | 'already-installed' | 'ios-manual' | 'not-available' | 'error';
  message: string;
}

interface UsePWAInstallReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<InstallResult>;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

      if (isIos) {
        // On iOS, ONLY trust standalone mode, NOT localStorage
        if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) {
          setIsInstalled(true);
        }
        return;  // Don't check localStorage for iOS
      }

      // For Android/Desktop only - check localStorage
      if (localStorage.getItem('pwa-installed') === 'true') {
        setIsInstalled(true);
        return;
      }

      if (window.matchMedia('(display-mode: standalone)').matches ||
          window.matchMedia('(display-mode: fullscreen)').matches ||
          window.matchMedia('(display-mode: minimal-ui)').matches) {
        setIsInstalled(true);
        localStorage.setItem('pwa-installed', 'true');
      }
    };
    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      // If we get this event, app is definitely NOT installed
      setIsInstalled(false);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallResult> => {
    if (isInstalled) {
      return { outcome: 'already-installed', message: 'App is already installed' };
    }

    // iOS Safari
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    if (isIos) {
      return {
        outcome: 'ios-manual',
        message: 'Tap the Share button \u2191 then "Add to Home Screen"'
      };
    }

    if (!deferredPrompt) {
      return {
        outcome: 'not-available',
        message: 'Use browser menu (\u22EE) \u2192 "Install app"'
      };
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstallable(false);
      return { outcome, message: outcome === 'accepted' ? 'Installing...' : 'Cancelled' };
    } catch {
      return { outcome: 'error', message: 'Installation failed' };
    }
  }, [deferredPrompt, isInstalled]);

  // Keyboard shortcut listener (Ctrl+Shift+A for "Add to homescreen")
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+A (or Cmd+Shift+A on Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        promptInstall().then(result => {
          window.dispatchEvent(new CustomEvent('pwa-install-result', { detail: result }));
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [promptInstall]);

  return { isInstallable, isInstalled, promptInstall };
}

export default usePWAInstall;
