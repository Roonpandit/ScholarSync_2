import { register, unregister } from '../serviceWorkerRegistration';

export function registerPWA() {
  // Works in both development and production
  register({
    onSuccess: (registration) => {
      console.log('PWA registered successfully:', registration);
    },
    onUpdate: (registration) => {
      console.log('PWA update available');
      if (window.confirm('New version available! Reload to update?')) {
        window.location.reload();
      }
    }
  });
}

export function unregisterPWA() {
  unregister();
}