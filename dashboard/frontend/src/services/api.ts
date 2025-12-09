import axios from 'axios';

const raw = process.env.REACT_APP_API_URL || '';
const cleaned = raw.replace(/\/+$/, ''); // remove trailing slash(es)

// if user provided a URL that already ends with /api, use it as-is, otherwise append /api
const baseWithApi = cleaned.endsWith('/api') ? cleaned : (cleaned ? `${cleaned}/api` : '/api');

// helpful dev-time warning if env looks suspicious
if (process.env.NODE_ENV !== 'production') {
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