import './index.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const clearDevServiceWorkerCache = async () => {
  if (!import.meta.env.DEV || !("serviceWorker" in navigator)) return;

  const reloadKey = "proTutorsHubDevServiceWorkerCleared";
  try {
    const registrations = await navigator.serviceWorker.getRegistrations?.();
    const cacheKeys = "caches" in window ? await window.caches.keys() : [];
    const hadStaleState = Boolean(registrations?.length || cacheKeys.length);

    await Promise.all([
      ...(registrations || []).map((registration) => registration.unregister()),
      ...cacheKeys.map((key) => window.caches.delete(key)),
    ]);

    if (hadStaleState && window.sessionStorage.getItem(reloadKey) !== "true") {
      window.sessionStorage.setItem(reloadKey, "true");
      window.location.reload();
    }
  } catch (error) {
    console.warn("Development service worker cleanup failed", error);
  }
};

clearDevServiceWorkerCache();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}
