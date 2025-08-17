// registerPWA.jsx - Fixed PWA registration
import { register, unregister } from '../serviceWorkerRegistration';

export function registerPWA() {
  if (process.env.NODE_ENV === 'production') {
    register({
      onSuccess: (registration) => {
        console.log('PWA registered successfully:', registration);
      },
      onUpdate: (registration) => {
        console.log('PWA updated:', registration);
        // Optional: Show update available message to user
        if (window.confirm('A new version is available. Reload to update?')) {
          window.location.reload();
        }
      }
    });
  } else {
    console.log('PWA registration skipped in development mode');
  }
}

export function unregisterPWA() {
  unregister();
}