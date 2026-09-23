// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider, ThemeProvider, CartProvider, ToastProvider } from './context';
import CookieBanner from './components/layout/CookieBanner';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { validateEnv } from './utils/env';
import './styles/global.css';

// Log any missing env vars (never throws)
validateEnv();

const root = document.getElementById('root');

try {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <CartProvider>
                <ToastProvider>
                  <App />
                  <CookieBanner />
                </ToastProvider>
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </React.StrictMode>
  );
} catch (err) {
  // Last resort — if React itself fails to mount, show something
  console.error('[EduVault] Fatal render error:', err);
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;padding:40px;text-align:center;background:#f4f7fb">
      <img src="/logo.png" alt="EduVault" style="height:60px;margin-bottom:24px;opacity:.7" />
      <h1 style="font-size:24px;margin-bottom:12px;color:#0D1B2A">Something went wrong</h1>
      <p style="color:#7A90A8;margin-bottom:28px;max-width:400px;line-height:1.6">
        The application failed to start. Please try refreshing the page.
        If the problem persists, contact support.
      </p>
      <button onclick="location.reload()"
        style="background:#1565C0;color:#fff;border:none;padding:12px 28px;border-radius:9px;font-size:15px;cursor:pointer;font-weight:600">
        Refresh Page
      </button>
      ${import.meta.env.DEV ? `<pre style="margin-top:24px;text-align:left;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;font-size:12px;color:#dc2626;max-width:600px;overflow:auto">${err?.toString()}\n${err?.stack ?? ''}</pre>` : ''}
    </div>
  `;
}
