import axios from 'axios';

const baseURL = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, ''); // remove trailing slash, default to empty for relative /api
const api = axios.create({
  baseURL: baseURL + '/api',
});

export { api };
export default api;