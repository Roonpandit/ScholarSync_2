import { useEffect } from 'react';
import { toast } from 'react-toastify';
import usePWAInstall from './usePWAInstall';

/**
 * HiddenInstallTrigger - Invisible component that enables PWA installation
 * 
 * Features:
 * - Keyboard shortcut: Ctrl+Shift+A (Cmd+Shift+A on Mac) to install
 * - Optional: Click the app logo 5 times rapidly to trigger install
 * - Shows toast notifications for install status
 */
export function HiddenInstallTrigger() {
  const { promptInstall } = usePWAInstall();

  useEffect(() => {
    const handleInstallResult = (e) => {
      const { outcome, message } = e.detail;
      
      switch (outcome) {
        case 'accepted':
          toast.success('App installed successfully!', { icon: '🎉' });
          break;
        case 'dismissed':
          toast.info('Installation cancelled');
          break;
        case 'already-installed':
          toast.info('App is already installed', { icon: '✅' });
          break;
        case 'ios-manual':
          toast.info(message, { 
            icon: '📱',
            autoClose: 5000 
          });
          break;
        case 'not-available':
          toast.info(message, { icon: 'ℹ️' });
          break;
        case 'error':
          toast.error(message);
          break;
        default:
          break;
      }
    };

    window.addEventListener('pwa-install-result', handleInstallResult);
    return () => window.removeEventListener('pwa-install-result', handleInstallResult);
  }, []);

  // This component renders nothing - it just sets up the listeners
  return null;
}

export default HiddenInstallTrigger;
