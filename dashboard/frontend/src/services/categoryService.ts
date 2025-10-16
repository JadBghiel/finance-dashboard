import api from './api';
import { Category } from '../types';

// Updated to handle optional type
export const getCategories = async (type?: 'income' | 'expense'): Promise<Category[]> => {
  const params = type ? { type } : {};
  const response = await api.get('/categories/', { params }); // Add trailing slash
  return response.data;
};

export const createCategory = async (category: { name: string, type: string }): Promise<Category> => {
  const response = await api.post('/categories/', category); // Add trailing slash
  return response.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/categories/${id}/`); // Add trailing slash
};