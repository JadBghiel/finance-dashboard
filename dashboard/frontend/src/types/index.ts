export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'investment';
}

export interface Account {
  id: number;
  name: string;
  emoji?: string;
  account_type?: string;
}

export interface Income {
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

export interface Investment {
  id: number;
  symbol: string;
  name?: string;
  type: 'stock'|'etf'|'crypto'|'mutual_fund';
  quantity: number;
  purchase_price: number;
  purchase_date: string;
  current_price?: number | null;
  currency: string;
  account_id: number;
  account?: Account; // linked account (investment account)
  notes?: string | null;
}

// allow current_price (and name/notes) in create payload
export type InvestmentCreate = Omit<Investment, 'id'>;

export interface WatchlistItem {
  id: number;
  symbol: string;
  name?: string;
  type: 'stock'|'etf'|'crypto'|'mutual_fund';
  target_price?: number | null;
  notes?: string | null;
}

export interface PortfolioSummary {
  total_value: number;
  total_invested: number;
  cash_position: number;
  total_pnl: number;
  pnl_percentage: number;
  allocation: Record<string, number>; // type -> value
}