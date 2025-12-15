import api from './api';
import { WatchlistItem } from '../types';

export const getWatchlist = async (skip = 0, limit = 100): Promise<WatchlistItem[]> => {
  const response = await api.get('/watchlist/', { params: { skip, limit } });
  return response.data;
};

export const createWatchlistItem = async (payload: Partial<WatchlistItem>): Promise<WatchlistItem> => {
  const response = await api.post('/watchlist/', payload);
  return response.data;
};

export const updateWatchlistItem = async (id: number, payload: Partial<WatchlistItem>): Promise<WatchlistItem> => {
  const response = await api.put(`/watchlist/${id}/`, payload);
  return response.data;
};

export const deleteWatchlistItem = async (id: number): Promise<void> => {
  await api.delete(`/watchlist/${id}/`);
};

export const refreshWatchlistPrices = async (): Promise<any> => {
  try {
    const r = await api.post('/watchlist/refresh-prices/');
    return r.data;
  } catch (e) {
    return null;
  }
};
