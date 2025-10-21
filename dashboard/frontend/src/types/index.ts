export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'investment';
}

export interface Account {
  id: number;
  name: string;
}

export interface Income {
  id: number;
  amount: number;
  currency: string;
  description: string | null;
  date: string; // using string for simplicity, can be date object
  category_id: number;
  category: Category;
  account_id: number;
  account: Account;
}

export type IncomeCreate = Omit<Income, 'id' | 'category' | 'account'>;

// added expense types (mirror of income)
export interface Expense {
  id: number;
  amount: number;
  currency: string;
  description: string | null;
  date: string;
  category_id: number;
  category: Category;
  account_id: number;
  account: Account;
}

export type ExpenseCreate = Omit<Expense, 'id' | 'category' | 'account'>;