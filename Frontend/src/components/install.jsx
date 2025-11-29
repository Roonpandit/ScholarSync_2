import { useState, useEffect } from 'react';
import { Download, Check } from 'lucide-react';

const InstallButton = ({ className = "" }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Check if app is already installed (running in standalone mode)
    const checkIfInstalled = () => {
      // Check for iOS standalone mode - ONLY true when actually added to home screen
      const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      
      if (isIos) {
        // On iOS, window.navigator.standalone is ONLY true when launched from home screen
        // It's false or undefined when running in Safari browser
        if (window.navigator.standalone === true) {
          setIsInstalled(true);
          return;
        }
        // If on iOS and NOT standalone, it's NOT installed
        // Don't check other conditions for iOS
        return;
      }
      
      // For Android/Desktop Chrome - check display-mode
      // These are ONLY true when the PWA is actually running in standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.matchMedia('(display-mode: fullscreen)').matches ||
          window.matchMedia('(display-mode: minimal-ui)').matches ||
          window.matchMedia('(display-mode: window-controls-overlay)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Optional: Check getInstalledRelatedApps (Chrome only)
      // This can check if the PWA is installed even when not running in standalone
      if ('getInstalledRelatedApps' in window.navigator) {
        window.navigator.getInstalledRelatedApps()
          .then((relatedApps) => {
            if (relatedApps && relatedApps.length > 0) {
              setIsInstalled(true);
            }
          })
          .catch((error) => {
            console.log('Error checking installed apps:', error);
          });
      }
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event (Chrome/Edge/Samsung Browser)
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);
      // If we get this event, the app is definitely NOT installed
      setIsInstalled(false);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      showToastMessage('App installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const handleInstallClick = async () => {
    if (isInstalled) {
      showToastMessage('App is already installed on your device');
      return;
    }

    // Check if iOS
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

    // Handle iOS Safari - show manual instructions
    if (isIos) {
      showToastMessage('Tap the Share button ↑ then "Add to Home Screen"');
      return;
    }

    // Handle browsers that don't support PWA installation or prompt not available
    if (!deferredPrompt) {
      // Check if it's a browser that supports PWA but just hasn't fired the event
      const isChromium = /chrome|chromium|crios/i.test(navigator.userAgent);
      const isEdge = /edg/i.test(navigator.userAgent);
      const isSamsung = /samsungbrowser/i.test(navigator.userAgent);
      
      if (isChromium || isEdge || isSamsung) {
        showToastMessage('Use browser menu (⋮) → "Install app" or "Add to Home Screen"');
      } else {
        showToastMessage('This browser may not support app installation');
      }
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        showToastMessage('Installing app...');
      } else {
        showToastMessage('Installation cancelled');
      }
      
      // Clear the deferredPrompt - it can only be used once
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Error during installation:', error);
      showToastMessage('Installation failed. Please try again.');
    }
  };

  // Determine button appearance
  const buttonText = isInstalled ? 'Installed' : 'Install App';
  const buttonIcon = isInstalled ? <Check className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 w-full ${
          isInstalled
            ? 'bg-green-100 text-green-700 cursor-default'
            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:scale-105 active:scale-95'
        } ${className}`}
        disabled={isInstalled}
        title={isInstalled ? 'App is already installed' : 'Install this app on your device'}
      >
        {buttonIcon}
        {buttonText}
      </button>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slide-down">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm mx-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {toastMessage.includes('already installed') || toastMessage.includes('successfully') ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : toastMessage.includes('Share') ? (
                  <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                ) : (
                  <Download className="h-5 w-5 text-indigo-500" />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {toastMessage}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setShowToast(false)}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default InstallButton;