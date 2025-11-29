import { useEffect, useState } from 'react';
import { Check, X, Download, AlertCircle, Smartphone } from 'lucide-react';
import usePWAInstall from './usePWAInstall';

/**
 * HiddenInstallTrigger - Invisible component that enables PWA installation
 * 
 * Features:
 * - Keyboard shortcut: Ctrl+Shift+A (Cmd+Shift+A on Mac) to install
 * - Shows popup modals for install status
 */
export function HiddenInstallTrigger() {
  const { promptInstall } = usePWAInstall();
  const [popup, setPopup] = useState({ show: false, type: '', message: '' });

  const showPopup = (type, message) => {
    setPopup({ show: true, type, message });
  };

  const closePopup = () => {
    setPopup({ show: false, type: '', message: '' });
  };

  useEffect(() => {
    const handleInstallResult = (e) => {
      const { outcome, message } = e.detail;
      
      switch (outcome) {
        case 'accepted':
          showPopup('success', 'App installed successfully!');
          break;
        case 'dismissed':
          showPopup('info', 'Installation cancelled');
          break;
        case 'already-installed':
          showPopup('success', 'App is already installed');
          break;
        case 'ios-manual':
          showPopup('ios', message);
          break;
        case 'not-available':
          showPopup('info', message);
          break;
        case 'error':
          showPopup('error', message);
          break;
        default:
          break;
      }
    };

    window.addEventListener('pwa-install-result', handleInstallResult);
    return () => window.removeEventListener('pwa-install-result', handleInstallResult);
  }, []);

  const getPopupConfig = () => {
    switch (popup.type) {
      case 'success':
        return {
          icon: <Check className="h-12 w-12 text-green-500" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Success!'
        };
      case 'inprogress':
        return {
          icon: (
            <svg className="h-12 w-12 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ),
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          title: 'Installing...'
        };
      case 'ios':
        return {
          icon: <Smartphone className="h-12 w-12 text-indigo-500" />,
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          title: 'Install on iOS'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Error'
        };
      default:
        return {
          icon: <Download className="h-12 w-12 text-indigo-500" />,
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          title: 'Install App'
        };
    }
  };

  const config = getPopupConfig();

  return (
    <>
      {/* Popup Modal */}
      {popup.show && (
        <div 
          className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closePopup}
        >
          <div 
            className={`relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform animate-popup ${config.borderColor} border-2`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Icon */}
            <div className={`mx-auto w-20 h-20 ${config.bgColor} rounded-full flex items-center justify-center mb-4`}>
              {config.icon}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              {config.title}
            </h3>

            {/* Message */}
            <p className="text-gray-600 text-center mb-6">
              {popup.message}
            </p>

            {/* iOS specific instructions */}
            {popup.type === 'ios' && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">1</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Tap the</span>
                    <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-sm text-gray-700">Share button</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">2</div>
                  <span className="text-sm text-gray-700">Select "Add to Home Screen"</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">3</div>
                  <span className="text-sm text-gray-700">Tap "Add" to confirm</span>
                </div>
              </div>
            )}

            {/* Button */}
            <button
              onClick={closePopup}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              {popup.type === 'ios' ? 'Got it' : popup.type === 'inprogress' ? 'Please wait...' : 'OK'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes popup {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-popup {
          animation: popup 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

/**
 * InstallHint - Floating install button
 * A beautiful, subtle floating button that prompts installation
 */
export function InstallHint({ position = 'bottom-left' }) {
  const { isInstalled, promptInstall } = usePWAInstall();
  
  if (isInstalled) return null;
  
  const positionClasses = {
    'bottom-left': 'bottom-6 left-6',
    'bottom-right': 'bottom-6 right-6',
    'top-left': 'top-20 left-6',
    'top-right': 'top-20 right-6',
  };

  const handleClick = async () => {
    const result = await promptInstall();
    window.dispatchEvent(new CustomEvent('pwa-install-result', { detail: result }));
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <button
        onClick={handleClick}
        className="group relative flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 
                   text-white px-4 py-3 rounded-full shadow-lg 
                   hover:shadow-xl hover:scale-105 active:scale-95
                   transition-all duration-300 ease-out"
        title="Install App"
      >
        {/* Pulse animation ring */}
        <span className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-25"></span>
        
        {/* Icon */}
        <span className="relative">
          <Download className="w-5 h-5" />
        </span>
        
        {/* Text - visible on hover */}
        <span className="relative max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap font-medium">
          Install App
        </span>
      </button>
    </div>
  );
}

export default HiddenInstallTrigger;