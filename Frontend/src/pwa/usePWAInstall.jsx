import { useState, useEffect, useCallback } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      
      if (isIos) {
        // On iOS, ONLY check window.navigator.standalone === true
        // It's false/undefined when running in Safari browser
        if (window.navigator.standalone === true) {
          setIsInstalled(true);
        }
        // Don't check other conditions for iOS
        return;
      }
      
      // For Android/Desktop - check display-mode
      if (window.matchMedia('(display-mode: standalone)').matches ||
          window.matchMedia('(display-mode: fullscreen)').matches ||
          window.matchMedia('(display-mode: minimal-ui)').matches) {
        setIsInstalled(true);
      }
    };
    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      // If we get this event, app is definitely NOT installed
      setIsInstalled(false);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (isInstalled) {
      return { outcome: 'already-installed', message: 'App is already installed' };
    }

    // iOS Safari
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    if (isIos) {
      return { 
        outcome: 'ios-manual', 
        message: 'Tap the Share button ↑ then "Add to Home Screen"' 
      };
    }

    if (!deferredPrompt) {
      return { 
        outcome: 'not-available', 
        message: 'Use browser menu (⋮) → "Install app"' 
      };
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstallable(false);
      return { outcome, message: outcome === 'accepted' ? 'Installing...' : 'Cancelled' };
    } catch (error) {
      return { outcome: 'error', message: 'Installation failed' };
    }
  }, [deferredPrompt, isInstalled]);

  // Keyboard shortcut listener (Ctrl+Shift+A for "Add to homescreen")
  useEffect(() => {
    const handleKeyDown = (e) => {
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