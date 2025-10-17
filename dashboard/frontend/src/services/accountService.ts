import api from './api';
import { Account } from '../types';

export const getAccounts = async (): Promise<Account[]> => {
  const response = await api.get('/accounts/');
  return response.data;
};

export const createAccount = async (account: { name: string }): Promise<Account> => {
  const response = await api.post('/accounts/', account);
  return response.data;
};