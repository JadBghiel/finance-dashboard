import api from './api';
import { Expense, ExpenseCreate } from '../types';

export const getExpenses = async (): Promise<Expense[]> => {
  const response = await api.get('/expenses/');
  return response.data;
};

export const createExpense = async (expense: ExpenseCreate): Promise<Expense> => {
  const response = await api.post('/expenses/', expense);
  return response.data;
};

export const updateExpense = async (id: number, expense: ExpenseCreate): Promise<Expense> => {
  const response = await api.put(`/expenses/${id}/`, expense);
  return response.data;
};

export const deleteExpense = async (id: number): Promise<void> => {
  await api.delete(`/expenses/${id}/`);
};