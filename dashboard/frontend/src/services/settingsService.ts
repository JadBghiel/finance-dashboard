import api from './api';

export const getBaseCurrency = async (): Promise<string> => {
  const response = await api.get('/settings/base-currency/');
  return response.data.base_currency;
};

export const updateBaseCurrency = async (base_currency: string): Promise<{ base_currency: string }> => {
  const response = await api.post('/settings/base-currency/', { base_currency });
  return response.data;
};