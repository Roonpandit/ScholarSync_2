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

/**
 * InstallHint - Small, subtle hint that appears in corner
 * Shows keyboard shortcut on hover
 */
export function InstallHint({ position = 'bottom-left' }) {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  
  if (isInstalled) return null;
  
  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  };

  const handleClick = async () => {
    const result = await promptInstall();
    window.dispatchEvent(new CustomEvent('pwa-install-result', { detail: result }));
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-40 group`}
      title="Press Ctrl+Shift+A to install"
    >
      <button
        onClick={handleClick}
        className="opacity-30 hover:opacity-100 transition-opacity duration-300 
                   bg-gray-800 text-white text-xs px-2 py-1 rounded-full
                   flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="hidden group-hover:inline">Install App (Ctrl+Shift+A)</span>
      </button>
    </div>
  );
}

export default HiddenInstallTrigger;
