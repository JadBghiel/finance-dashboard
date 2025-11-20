import api from './api';
import { Account } from '../types';

export const getAccounts = async (): Promise<Account[]> => {
  const response = await api.get('/accounts/');
  return response.data;
};

export const createAccount = async (account: { name: string; emoji?: string }): Promise<Account> => {
  const response = await api.post('/accounts/', account);
  return response.data;
};

export const updateAccount = async (id: number, account: { name?: string; emoji?: string }): Promise<Account> => {
  const response = await api.put(`/accounts/${id}/`, account);
  return response.data;
};

export const deleteAccount = async (id: number): Promise<void> => {
  await api.delete(`/accounts/${id}/`);
};

export const getAccountBalance = async (id: number): Promise<any> => {
  const response = await api.get(`/accounts/${id}/balance/`);
  return response.data;
};