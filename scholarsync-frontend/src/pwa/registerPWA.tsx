import { register, unregister } from '@/serviceWorkerRegistration';

export function registerPWA(): void {
  // Only register in production — SW interferes with Vite HMR in dev
  if (import.meta.env.DEV) return;

  register({
    onSuccess: (registration: ServiceWorkerRegistration) => {
      console.log('PWA registered successfully:', registration);
    },
    onUpdate: (_registration: ServiceWorkerRegistration) => {
      console.log('PWA update available');
      if (window.confirm('New version available! Reload to update?')) {
        window.location.reload();
      }
    }
  });
}

export function unregisterPWA(): void {
  unregister();
}
