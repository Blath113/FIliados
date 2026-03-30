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
  inventoryItems: InventoryItem[];
  budgetItems: BudgetItem[];
}

export interface BudgetItem {
  id: string;
  inventoryItemId: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high';
}

export interface InventoryItem {
  id: string;
  name: string;
  units: number;
  costUSD: number;
  priceUSD: number;
  isRateLocked: boolean;
  lockedRate?: number;
}
