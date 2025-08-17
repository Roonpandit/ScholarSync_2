import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { Toast } from './components/ToastConfig'
import 'react-toastify/dist/ReactToastify.css'
import { registerPWA } from './pwa/registerPWA.jsx';

// Register PWA
registerPWA();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toast />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)