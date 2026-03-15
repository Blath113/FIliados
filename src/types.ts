export type Currency = 'BS' | 'USD';

export interface Transaction {
  id: string;
  type: 'debt' | 'payment';
  amount: number;
  currency: Currency;
  amountUSD: number;
  amountBS: number;
  description?: string;
  date: number;
}

export interface Debtor {
  id: string;
  name: string;
  transactions: Transaction[];
}

export interface AppConfig {
  exchangeRate: number;
}
