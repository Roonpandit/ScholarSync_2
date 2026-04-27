import { toast, ToastContainer, type ToastPosition } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Toast configuration
const toastConfig = {
  position: 'bottom-center' as ToastPosition,
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light' as const
};

// Export toast with configuration
export const showToast = {
  success: (message: string) => toast.success(message, toastConfig),
  error: (message: string) => toast.error(message, toastConfig),
  warning: (message: string) => toast.warning(message, toastConfig),
  info: (message: string) => toast.info(message, toastConfig)
};

// Export ToastContainer
export const Toast = () => (
  <ToastContainer
    position={toastConfig.position}
    autoClose={toastConfig.autoClose}
    hideProgressBar={toastConfig.hideProgressBar}
    newestOnTop={false}
    closeOnClick={toastConfig.closeOnClick}
    rtl={false}
    draggable={toastConfig.draggable}
    theme={toastConfig.theme}
  />
);
