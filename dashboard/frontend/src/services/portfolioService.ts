import api from './api';
import { PortfolioSummary } from '../types';

export const getPortfolioSummary = async (): Promise<PortfolioSummary> => {
  const r = await api.get('/portfolio/summary/');
  return r.data;
};

export const refreshAllPrices = async (force: boolean = false): Promise<{ updated: number }> => {
  const r = await api.post('/portfolio/refresh-prices/', null, { params: { force } });
  return r.data;
};

export interface SymbolSuggestion {
  symbol: string;
  category?: 'stock' | 'etf' | 'crypto' | 'mutual_fund';
}

export const searchSymbols = async (q: string, category?: string): Promise<SymbolSuggestion[]> => {
  if (!q || q.trim().length < 2) return [];
  const r = await api.get('/markets/tickers/', { params: { q, category } });
  return r.data?.items ?? [];
};
