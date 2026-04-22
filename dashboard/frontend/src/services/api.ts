import axios from 'axios';

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const vercelBackendFallback = 'https://finance-dashboard-backend-virid.vercel.app';
const host = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalHost = host === 'localhost' || host === '127.0.0.1';

// prefer explicit env; if missing, default to backend in deployed environments and '/api' only for local dev
const raw = env.REACT_APP_API_URL || (isLocalHost ? '' : vercelBackendFallback);
const cleaned = raw.replace(/\/+$/, ''); // remove trailing slash(es)

// if user provided a URL that already ends with /api, use it as-is, otherwise append /api
const baseWithApi = cleaned.endsWith('/api') ? cleaned : (cleaned ? `${cleaned}/api` : '/api');

// helpful dev-time warning if env looks suspicious
if ((env.NODE_ENV || 'development') !== 'production') {
  if (raw && raw.toLowerCase().includes('/api/') ) {
    // user likely included a trailing '/api' and extra path segments — warn
    // eslint-disable-next-line no-console
    console.warn(`[api] REACT_APP_API_URL looks unusual: "${raw}". Using "${baseWithApi}" as baseURL.`);
  }
}

const api = axios.create({
  baseURL: baseWithApi,
});

export { api };
export default api;