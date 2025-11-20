import api from './api';
import { Category } from '../types';

export const getCategories = async (type?: 'income' | 'expense'): Promise<Category[]> => {
  const params = type ? { type } : {};
  const response = await api.get('/categories/', { params });
  return response.data;
};

export const createCategory = async (category: { name: string, type: string }): Promise<Category> => {
  const response = await api.post('/categories/', category);
  return response.data;
};

export const updateCategory = async (id: number, category: { name: string, type: string }): Promise<Category> => {
  const response = await api.put(`/categories/${id}/`, category);
  return response.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/categories/${id}/`);
};