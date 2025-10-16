export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'investment';
}

export interface Income {
  id: number;
  amount: number;
  currency: string;
  description: string | null;
  date: string; // using string for simplicity, can be date object
  category_id: number;
  category: Category;
}

export type IncomeCreate = Omit<Income, 'id' | 'category'>;