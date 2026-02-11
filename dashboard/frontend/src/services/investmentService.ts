import api from './api';
import { Investment, InvestmentCreate } from '../types';

export const getInvestments = async (skip = 0, limit = 100): Promise<Investment[]> => {
  const response = await api.get('/investments/', { params: { skip, limit } });
  return response.data;
};

export const createInvestment = async (payload: InvestmentCreate): Promise<Investment> => {
  const response = await api.post('/investments/', payload);
  return response.data;
};

export const updateInvestment = async (id: number, payload: Partial<InvestmentCreate>): Promise<Investment> => {
  const response = await api.put(`/investments/${id}/`, payload);
  return response.data;
};

export const deleteInvestment = async (id: number): Promise<void> => {
  await api.delete(`/investments/${id}/`);
};

export const refreshInvestmentPrice = async (id: number): Promise<any> => {
  // backend may implement this; if not it will return 404 or stub response
  try {
    const r = await api.post(`/investments/${id}/refresh-price/`);
    return r.data;
  } catch (e) {
    return null;
  }
};
