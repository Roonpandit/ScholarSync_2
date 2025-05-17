import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Toast configuration
const toastConfig = {
  position: toast.POSITION.BOTTOM_CENTER,
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light'
};

// Export toast with configuration
export const showToast = {
  success: (message) => toast.success(message, toastConfig),
  error: (message) => toast.error(message, toastConfig),
  warning: (message) => toast.warning(message, toastConfig),
  info: (message) => toast.info(message, toastConfig)
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
