import api from './api';
import { Income, IncomeCreate } from '../types';

export const getIncomes = async (): Promise<Income[]> => {
  const response = await api.get('/incomes/');
  return response.data;
};

export const createIncome = async (income: IncomeCreate): Promise<Income> => {
  const response = await api.post('/incomes/', income);
  return response.data;
};

export const updateIncome = async (id: number, income: IncomeCreate): Promise<Income> => {
  const response = await api.put(`/incomes/${id}/`, income);
  return response.data;
};

export const deleteIncome = async (id: number): Promise<void> => {
  await api.delete(`/incomes/${id}/`);
};