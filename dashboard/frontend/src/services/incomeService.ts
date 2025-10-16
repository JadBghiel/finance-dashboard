import api from './api';
import { Income, IncomeCreate } from '../types';

export const getIncomes = async (): Promise<Income[]> => {
  const response = await api.get('/incomes/'); // Add trailing slash
  return response.data;
};

export const createIncome = async (income: IncomeCreate): Promise<Income> => {
  const response = await api.post('/incomes/', income); // Add trailing slash
  return response.data;
};

// Add updateIncome and deleteIncome functions here later