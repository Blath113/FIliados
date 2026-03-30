/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  Settings, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  UserPlus,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  FileDown,
  Calendar,
  Package,
  Boxes,
  Lock,
  Unlock,
  Calculator,
  ShoppingCart,
  Trash,
  Star,
  ArrowUpCircle,
  ArrowDownCircle,
  Minus,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Debtor, Transaction, AppConfig, Currency, InventoryItem, BudgetItem } from './types';
import { exportDebtorToExcel, exportMonthlyActivityToExcel } from './lib/exportUtils';

const STORAGE_KEY = 'deudatrack_data';
const CONFIG_KEY = 'deudatrack_config';

export default function App() {
  // --- State ---
  const [debtors, setDebtors] = useState<Debtor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem(CONFIG_KEY);
    const parsed = saved ? JSON.parse(saved) : { exchangeRate: 60, inventoryItems: [], budgetItems: [] };
    return {
      ...parsed,
      budgetItems: parsed.budgetItems || []
    };
  });

  const [view, setView] = useState<{ type: 'home' | 'profile' | 'config' | 'monthly_summary' | 'inventory' | 'budget'; debtorId?: string }>({ type: 'home' });
  const [isAddDebtorOpen, setIsAddDebtorOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState<{ type: 'debt' | 'payment' } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<{ debtorId: string, transaction: Transaction } | null>(null);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState<boolean>(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(debtors));
  }, [debtors]);

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  // --- Derived State ---
  const totalBalanceUSD = useMemo(() => {
    return debtors.reduce((acc, debtor) => {
      const balance = debtor.transactions.reduce((dAcc, t) => {
        const val = t.type === 'debt' ? t.amountUSD : -t.amountUSD;
        return dAcc + val;
      }, 0);
      return acc + balance;
    }, 0);
  }, [debtors]);

  const currentDebtor = useMemo(() => {
    if (view.type === 'profile' && view.debtorId) {
      return debtors.find(d => d.id === view.debtorId);
    }
    return null;
  }, [view, debtors]);

  const debtorBalanceUSD = useMemo(() => {
    if (!currentDebtor) return 0;
    return currentDebtor.transactions.reduce((acc, t) => {
      const val = t.type === 'debt' ? t.amountUSD : -t.amountUSD;
      return acc + val;
    }, 0);
  }, [currentDebtor]);

  // --- Handlers ---
  const addDebtor = (name: string) => {
    const newDebtor: Debtor = {
      id: crypto.randomUUID(),
      name,
      transactions: []
    };
    setDebtors([...debtors, newDebtor]);
    setIsAddDebtorOpen(false);
  };

  const deleteDebtor = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este deudor?')) {
      setDebtors(debtors.filter(d => d.id !== id));
      setView({ type: 'home' });
    }
  };

  const addTransaction = (debtorId: string, type: 'debt' | 'payment', amount: number, currency: Currency, date: number, description?: string) => {
    const amountUSD = currency === 'USD' ? amount : amount / config.exchangeRate;
    const amountBS = currency === 'BS' ? amount : amount * config.exchangeRate;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      amount,
      currency,
      amountUSD,
      amountBS,
      description,
      date
    };

    setDebtors(debtors.map(d => {
      if (d.id === debtorId) {
        return { ...d, transactions: [newTransaction, ...d.transactions] };
      }
      return d;
    }));
    setIsAddTransactionOpen(null);
  };

  const updateTransaction = (debtorId: string, transactionId: string, amount: number, currency: Currency, date: number, description?: string) => {
    const amountUSD = currency === 'USD' ? amount : amount / config.exchangeRate;
    const amountBS = currency === 'BS' ? amount : amount * config.exchangeRate;

    setDebtors(debtors.map(d => {
      if (d.id === debtorId) {
        return {
          ...d,
          transactions: d.transactions.map(t => {
            if (t.id === transactionId) {
              return { ...t, amount, currency, amountUSD, amountBS, description, date };
            }
            return t;
          })
        };
      }
      return d;
    }));
    setEditingTransaction(null);
  };

  const deleteTransaction = (debtorId: string, transactionId: string) => {
    setDebtors(debtors.map(d => {
      if (d.id === debtorId) {
        return { ...d, transactions: d.transactions.filter(t => t.id !== transactionId) };
      }
      return d;
    }));
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: crypto.randomUUID()
    };
    setConfig(prev => ({
      ...prev,
      inventoryItems: [...prev.inventoryItems, newItem]
    }));
    setIsInventoryModalOpen(false);
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setConfig(prev => ({
      ...prev,
      inventoryItems: prev.inventoryItems.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
    setEditingInventoryItem(null);
  };

  const deleteInventoryItem = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      setConfig(prev => ({
        ...prev,
        inventoryItems: prev.inventoryItems.filter(item => item.id !== id)
      }));
    }
  };

  const addBudgetItem = (inventoryItemId: string) => {
    const existing = config.budgetItems?.find(item => item.inventoryItemId === inventoryItemId);
    if (existing) {
      updateBudgetItem(existing.id, { quantity: existing.quantity + 1 });
      return;
    }

    const newItem: BudgetItem = {
      id: crypto.randomUUID(),
      inventoryItemId,
      quantity: 1,
      priority: 'medium'
    };
    setConfig(prev => ({
      ...prev,
      budgetItems: [...(prev.budgetItems || []), newItem]
    }));
  };

  const updateBudgetItem = (id: string, updates: Partial<BudgetItem>) => {
    setConfig(prev => ({
      ...prev,
      budgetItems: (prev.budgetItems || []).map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  };

  const deleteBudgetItem = (id: string) => {
    setConfig(prev => ({
      ...prev,
      budgetItems: (prev.budgetItems || []).filter(item => item.id !== id)
    }));
  };

  // --- Views ---

  const HomeView = () => (
    <div className="p-4 max-w-md mx-auto space-y-8 pb-24">
      <div className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">DeudaTrack</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestión de Cobros</p>
        </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setView({ type: 'budget' })} 
              className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
              title="Presupuesto"
            >
              <Calculator className="w-6 h-6 text-slate-600" />
            </button>
            <button 
              onClick={() => setView({ type: 'inventory' })} 
              className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
              title="Inventario"
            >
              <Package className="w-6 h-6 text-slate-600" />
            </button>
            <button 
              onClick={() => setView({ type: 'monthly_summary' })} 
              className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
            >
              <BarChart3 className="w-6 h-6 text-slate-600" />
            </button>
            <button 
              onClick={() => setView({ type: 'config' })} 
              className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
            >
              <Settings className="w-6 h-6 text-slate-600" />
            </button>
          </div>
      </div>

      {/* Main Balance Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group"
      >
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <DollarSign className="w-5 h-5 text-blue-100" />
            </div>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-[0.2em]">Saldo Global</p>
          </div>
          
          <h2 className="text-5xl font-black mb-3 tracking-tighter">
            ${totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          
          <div className="flex items-center gap-2 text-blue-100/80 bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="text-sm font-bold tracking-wide">
              Bs. {(totalBalanceUSD * config.exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Add Debtor Button */}
      <button 
        onClick={() => setIsAddDebtorOpen(true)}
        className="w-full bg-white border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all group active:scale-[0.98]"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
          <UserPlus className="w-6 h-6" />
        </div>
        <span className="font-bold text-sm uppercase tracking-widest">Nuevo Deudor</span>
      </button>

      {/* Debtors List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Mis Deudores</h3>
          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{debtors.length}</span>
        </div>
        
        {debtors.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold text-sm">No hay deudores registrados</p>
            <p className="text-slate-300 text-xs mt-1">Toca el botón superior para empezar</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {debtors.map((debtor) => {
              const balance = debtor.transactions.reduce((acc, t) => {
                const val = t.type === 'debt' ? t.amountUSD : -t.amountUSD;
                return acc + val;
              }, 0);
              
              return (
                <motion.div
                  key={debtor.id}
                  layoutId={debtor.id}
                  onClick={() => setView({ type: 'profile', debtorId: debtor.id })}
                  className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex justify-between items-center cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg shadow-inner">
                      {debtor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-black text-slate-800 block leading-none mb-1">{debtor.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {debtor.transactions.length} transacciones
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg tracking-tight ${balance > 0 ? 'text-red-500' : balance < 0 ? 'text-emerald-500' : 'text-slate-300'}`}>
                      {balance > 0 ? '+' : ''}${Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">USD</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const ProfileView = () => {
    const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
    if (!currentDebtor) return null;

    return (
      <div className="p-4 max-w-md mx-auto space-y-8 pb-24">
        <div className="flex justify-between items-center pt-4">
          <button 
            onClick={() => setView({ type: 'home' })} 
            className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="text-center flex-1 px-4">
            <h1 className="text-xl font-black text-slate-900 truncate tracking-tight">{currentDebtor.name}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Perfil de Deudor</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => exportDebtorToExcel(currentDebtor)} 
              className="p-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all active:scale-95"
              title="Exportar Excel"
            >
              <FileDown className="w-5 h-5" />
            </button>
            <button 
              onClick={() => deleteDebtor(currentDebtor.id)} 
              className="p-3 rounded-2xl bg-red-50 text-red-400 hover:bg-red-100 transition-all active:scale-95"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Debtor Balance Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-3">Saldo Pendiente</p>
            <h2 className="text-5xl font-black mb-4 tracking-tighter">
              ${debtorBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="inline-flex items-center gap-2 text-slate-400 bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="text-sm font-bold tracking-wide">
                Bs. {(debtorBalanceUSD * config.exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setIsAddTransactionOpen({ type: 'debt' })}
            className="bg-white border border-red-100 text-red-600 p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-red-50 transition-all shadow-sm active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="font-black text-xs uppercase tracking-widest">Nueva Deuda</span>
          </button>
          <button 
            onClick={() => setIsAddTransactionOpen({ type: 'payment' })}
            className="bg-white border border-emerald-100 text-emerald-600 p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-emerald-50 transition-all shadow-sm active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="font-black text-xs uppercase tracking-widest">Nuevo Abono</span>
          </button>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Movimientos</h3>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{currentDebtor.transactions.length}</span>
          </div>

          {currentDebtor.transactions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold text-sm">Sin movimientos registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentDebtor.transactions.map((t) => (
                <div 
                  key={t.id} 
                  className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md"
                >
                  <div 
                    className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => setExpandedTransaction(expandedTransaction === t.id ? null : t.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${t.type === 'debt' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {t.type === 'debt' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 leading-tight mb-0.5">{t.description || (t.type === 'debt' ? 'Deuda' : 'Abono')}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(t.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-black text-lg tracking-tight ${t.type === 'debt' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {t.type === 'debt' ? '+' : '-'}${t.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          Bs. {t.amountBS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <TransactionMenu 
                          onEdit={() => setEditingTransaction({ debtorId: currentDebtor.id, transaction: t })}
                          onDelete={() => deleteTransaction(currentDebtor.id, t.id)}
                        />
                        {expandedTransaction === t.id ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedTransaction === t.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50/50 border-t border-slate-50"
                      >
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Estado</p>
                              <p className={`text-xs font-black uppercase tracking-wider ${t.type === 'debt' ? 'text-red-600' : 'text-emerald-600'}`}>
                                {t.type === 'debt' ? 'Pendiente' : 'Completado'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tasa Cambio</p>
                              <p className="text-xs font-black text-slate-700">
                                1 USD = {config.exchangeRate} BS
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Monto de Registro</p>
                              <p className="text-sm font-black text-slate-800">
                                {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {t.currency}
                              </p>
                            </div>
                            {t.description && (
                              <div className="col-span-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Nota Adicional</p>
                                <div className="bg-white p-3 rounded-xl border border-slate-100">
                                  <p className="text-sm text-slate-600 font-medium italic">"{t.description}"</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const MonthlySummaryView = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const monthlyStats = useMemo(() => {
      let totalDebt = 0;
      let totalPayment = 0;
      const debtorActivity: { [name: string]: { debt: number; payment: number } } = {};

      debtors.forEach(debtor => {
        debtor.transactions.forEach(t => {
          const date = new Date(t.date);
          if (date.getMonth() === selectedMonth && date.getFullYear() === selectedYear) {
            if (t.type === 'debt') {
              totalDebt += t.amountUSD;
              debtorActivity[debtor.name] = {
                ...debtorActivity[debtor.name] || { debt: 0, payment: 0 },
                debt: (debtorActivity[debtor.name]?.debt || 0) + t.amountUSD
              };
            } else {
              totalPayment += t.amountUSD;
              debtorActivity[debtor.name] = {
                ...debtorActivity[debtor.name] || { debt: 0, payment: 0 },
                payment: (debtorActivity[debtor.name]?.payment || 0) + t.amountUSD
              };
            }
          }
        });
      });

      return { totalDebt, totalPayment, debtorActivity };
    }, [debtors, selectedMonth, selectedYear]);

    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    return (
      <div className="p-4 max-w-md mx-auto space-y-8 pb-24">
        <div className="flex items-center gap-4 pt-4">
          <button 
            onClick={() => setView({ type: 'home' })} 
            className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Resumen Mensual</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Análisis de Actividad</p>
          </div>
          <button 
            onClick={() => exportMonthlyActivityToExcel(debtors, selectedMonth, selectedYear)} 
            className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all active:scale-95"
            title="Exportar Mes"
          >
            <FileDown className="w-6 h-6" />
          </button>
        </div>

        {/* Month Selector */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between gap-2">
          <button 
            onClick={() => {
              if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
            className="p-2 rounded-xl hover:bg-slate-50 text-slate-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 font-black text-slate-800">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="uppercase tracking-widest text-sm">{monthNames[selectedMonth]} {selectedYear}</span>
          </div>
          <button 
            onClick={() => {
              if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
            className="p-2 rounded-xl hover:bg-slate-50 text-slate-400"
          >
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-red-50 shadow-sm">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Total Deudas</p>
            <p className="text-2xl font-black text-red-600 tracking-tight">
              ${monthlyStats.totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-emerald-50 shadow-sm">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Total Abonos</p>
            <p className="text-2xl font-black text-emerald-600 tracking-tight">
              ${monthlyStats.totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Debtor Activity List */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">Actividad por Deudor</h3>
          <div className="space-y-3">
            {Object.keys(monthlyStats.debtorActivity).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100">
                <p className="text-slate-400 font-bold text-sm">Sin actividad este mes</p>
              </div>
            ) : (
              Object.entries(monthlyStats.debtorActivity).map(([name, activity]: [string, { debt: number; payment: number }]) => (
                <div key={name} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-400">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-black text-slate-800">{name}</span>
                  </div>
                  <div className="text-right space-y-0.5">
                    {activity.debt > 0 && (
                      <p className="text-xs font-black text-red-500">+{activity.debt.toLocaleString()} USD</p>
                    )}
                    {activity.payment > 0 && (
                      <p className="text-xs font-black text-emerald-500">-{activity.payment.toLocaleString()} USD</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const BudgetView = () => {
    const budgetItemsWithDetails = (config.budgetItems || []).map(bi => {
      const inventoryItem = config.inventoryItems.find(ii => ii.id === bi.inventoryItemId);
      return { ...bi, inventoryItem };
    }).filter(item => item.inventoryItem);

    const totalUSD = budgetItemsWithDetails.reduce((acc, item) => {
      const cost = item.inventoryItem!.units * item.inventoryItem!.costUSD;
      return acc + (cost * item.quantity);
    }, 0);

    const totalBS = totalUSD * config.exchangeRate;

    const priorityColors = {
      high: 'text-red-600 bg-red-50 border-red-100',
      medium: 'text-amber-600 bg-amber-50 border-amber-100',
      low: 'text-emerald-600 bg-emerald-50 border-emerald-100'
    };

    const priorityLabels = {
      high: 'Alta',
      medium: 'Media',
      low: 'Baja'
    };

    return (
      <div className="p-4 max-w-md mx-auto space-y-8 pb-24">
        <div className="flex items-center gap-4 pt-4">
          <button 
            onClick={() => setView({ type: 'home' })} 
            className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Presupuesto</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Cálculo de Compras</p>
          </div>
          <div className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100">
            <Calculator className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Total Estimado</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-black tracking-tight">Bs. {totalBS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            </div>
            <p className="text-slate-400 font-bold mt-1">${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</p>
          </div>
        </div>

        <div className="space-y-4">
          {budgetItemsWithDetails.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold text-sm">El presupuesto está vacío</p>
              <p className="text-slate-300 text-xs mt-1">Agrega productos desde el inventario</p>
              <button 
                onClick={() => setView({ type: 'inventory' })}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all"
              >
                Ir al Inventario
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {budgetItemsWithDetails
                .sort((a, b) => {
                  const p = { high: 0, medium: 1, low: 2 };
                  return p[a.priority] - p[b.priority];
                })
                .map((item) => {
                  const unitCostUSD = item.inventoryItem!.units * item.inventoryItem!.costUSD;
                  const subtotalUSD = unitCostUSD * item.quantity;
                  const subtotalBS = subtotalUSD * config.exchangeRate;

                  return (
                    <motion.div
                      layout
                      key={item.id}
                      className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${priorityColors[item.priority]}`}>
                            <Star className="w-5 h-5" fill="currentColor" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 leading-none">{item.inventoryItem!.name}</h3>
                            <div className="flex gap-2 mt-2">
                              {(['low', 'medium', 'high'] as const).map((p) => (
                                <button
                                  key={p}
                                  onClick={() => updateBudgetItem(item.id, { priority: p })}
                                  className={`text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded-md border transition-all ${
                                    item.priority === p 
                                      ? priorityColors[p]
                                      : 'text-slate-300 bg-white border-slate-100 hover:border-slate-200'
                                  }`}
                                >
                                  {priorityLabels[p]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteBudgetItem(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => updateBudgetItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                            className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-90 transition-all"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="text-center min-w-[3rem]">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cant.</p>
                            <p className="text-lg font-black text-slate-900">{item.quantity}</p>
                          </div>
                          <button 
                            onClick={() => updateBudgetItem(item.id, { quantity: item.quantity + 1 })}
                            className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-90 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Subtotal</p>
                          <p className="text-sm font-black text-slate-900">Bs. {subtotalBS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <p className="text-[10px] font-bold text-slate-500">${subtotalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const InventoryView = () => (
    <div className="p-4 max-w-md mx-auto space-y-8 pb-24">
      <div className="flex items-center gap-4 pt-4">
        <button 
          onClick={() => setView({ type: 'home' })} 
          className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
        >
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventario</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Gestión de Productos</p>
        </div>
        <button 
          onClick={() => setIsInventoryModalOpen(true)}
          className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        {config.inventoryItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold text-sm">No hay productos en el inventario</p>
            <p className="text-slate-300 text-xs mt-1">Toca el botón "+" para agregar uno</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {config.inventoryItems.map((item) => {
              const currentRate = item.isRateLocked && item.lockedRate ? item.lockedRate : config.exchangeRate;
              const unitCostUSD = item.units * item.costUSD;
              const unitCostBS = unitCostUSD * currentRate;
              const suggestionUSD = unitCostUSD * item.priceUSD;
              const suggestionBS = suggestionUSD * currentRate;

              return (
                <motion.div
                  key={item.id}
                  className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 leading-none">{item.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                          {item.units} unidades @ ${item.costUSD.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setEditingInventoryItem(item)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteInventoryItem(item.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Unitario</p>
                      <div className="space-y-0.5">
                        <p className="text-sm font-black text-slate-800">Bs. {unitCostBS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[10px] font-bold text-slate-500">${unitCostUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Sugerencia</p>
                      <div className="space-y-0.5">
                        <p className="text-sm font-black text-blue-700">Bs. {suggestionBS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[10px] font-bold text-blue-500">${suggestionUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                  
                  {item.isRateLocked && (
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded-md border border-amber-100">
                      <Lock className="w-3 h-3" />
                      Tasa Fija: 1 USD = {item.lockedRate} BS
                    </div>
                  )}

                  <button 
                    onClick={() => addBudgetItem(item.id)}
                    className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Agregar al Presupuesto
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const InventoryModal = ({ initialData, onClose }: { initialData?: InventoryItem, onClose: () => void }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [units, setUnits] = useState(initialData?.units.toString() || '');
    const [costUSD, setCostUSD] = useState(initialData?.costUSD.toString() || '');
    const [priceUSD, setPriceUSD] = useState(initialData?.priceUSD.toString() || '');
    const [isRateLocked, setIsRateLocked] = useState(initialData?.isRateLocked || false);
    const [lockedRate, setLockedRate] = useState(initialData?.lockedRate?.toString() || config.exchangeRate.toString());
    const [tempBS, setTempBS] = useState('');

    const currentRate = isRateLocked ? parseFloat(lockedRate) || config.exchangeRate : config.exchangeRate;

    const handleBSChange = (val: string) => {
      setTempBS(val);
      const bs = parseFloat(val);
      if (!isNaN(bs)) {
        setPriceUSD((bs / currentRate).toFixed(2));
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div 
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {initialData ? 'Editar' : 'Nuevo'} Producto
              </h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Detalles de Inventario</p>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Nombre del Producto</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="Ej. Harina PAN"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Unidades</label>
                <input 
                  type="number" 
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Costo ($)</label>
                <input 
                  type="number" 
                  value={costUSD}
                  onChange={(e) => setCostUSD(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 bg-slate-50 rounded-3xl border-2 border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Precio de Venta</label>
                <button 
                  onClick={() => setIsRateLocked(!isRateLocked)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isRateLocked ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'bg-slate-200 text-slate-500'}`}
                >
                  {isRateLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {isRateLocked ? 'Tasa Fija' : 'Tasa Variable'}
                </button>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">Bs</span>
                  <input 
                    type="number" 
                    value={tempBS}
                    onChange={(e) => handleBSChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-xl text-slate-800 outline-none focus:border-blue-500 transition-all"
                    placeholder={(parseFloat(priceUSD) * currentRate || 0).toFixed(2)}
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">$</span>
                  <input 
                    type="number" 
                    value={priceUSD}
                    onChange={(e) => setPriceUSD(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-xl text-slate-800 outline-none focus:border-blue-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {isRateLocked && (
                <div className="pt-2 space-y-2 border-t border-slate-200 mt-2">
                  <label className="text-[8px] font-black text-amber-600 uppercase tracking-[0.2em]">Valor de Tasa Fija (BS/$)</label>
                  <input 
                    type="number" 
                    value={lockedRate}
                    onChange={(e) => setLockedRate(e.target.value)}
                    className="w-full p-3 bg-white border border-amber-200 rounded-xl font-bold text-amber-700 text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              )}
            </div>

            <button 
              disabled={!name || !units || !costUSD || !priceUSD}
              onClick={() => {
                const itemData = {
                  name,
                  units: parseFloat(units),
                  costUSD: parseFloat(costUSD),
                  priceUSD: parseFloat(priceUSD),
                  isRateLocked,
                  lockedRate: isRateLocked ? parseFloat(lockedRate) : undefined
                };
                if (initialData) {
                  updateInventoryItem(initialData.id, itemData);
                } else {
                  addInventoryItem(itemData);
                }
                onClose();
              }}
              className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-[0.98]"
            >
              {initialData ? 'Guardar Cambios' : 'Agregar al Inventario'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const ConfigView = () => {
    const [rate, setRate] = useState(config.exchangeRate.toString());

    return (
      <div className="p-4 max-w-md mx-auto space-y-8">
        <div className="flex items-center gap-4 pt-4">
          <button 
            onClick={() => setView({ type: 'home' })} 
            className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Configuración</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ajustes del Sistema</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="p-2 bg-blue-50 rounded-xl">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <h2 className="font-black uppercase tracking-widest text-sm">Tasa de Cambio</h2>
            </div>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">Define el valor de 1 USD en Bolívares. Todas las conversiones se basarán en este valor.</p>
            
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-xs font-black text-slate-300 uppercase tracking-widest">1 USD =</span>
              </div>
              <input 
                type="number" 
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full pl-24 pr-16 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-2xl text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="0.00"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase tracking-widest">BS</span>
            </div>
          </div>

          <button 
            onClick={() => {
              setConfig({ exchangeRate: parseFloat(rate) || 1 });
              setView({ type: 'home' });
            }}
            className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    );
  };

  // --- Modals ---

  const AddDebtorModal = () => {
    const [name, setName] = useState('');
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div 
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-8 shadow-2xl"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nuevo Deudor</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Crear Perfil de Cliente</p>
            </div>
            <button onClick={() => setIsAddDebtorOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Nombre Completo</label>
              <input 
                autoFocus
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <button 
              disabled={!name.trim()}
              onClick={() => addDebtor(name)}
              className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 active:scale-[0.98]"
            >
              Crear Perfil
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const TransactionModal = ({ type, debtorId, initialData, onClose }: { type: 'debt' | 'payment', debtorId: string, initialData?: Transaction, onClose: () => void }) => {
    const [amount, setAmount] = useState(initialData?.amount.toString() || '');
    const [currency, setCurrency] = useState<Currency>(initialData?.currency || 'BS');
    const [description, setDescription] = useState(initialData?.description || '');
    const [date, setDate] = useState(initialData ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [calculatorAmounts, setCalculatorAmounts] = useState<number[]>([]);
    const [calcInput, setCalcInput] = useState('');
    const [showCalculator, setShowCalculator] = useState(false);

    const totalCalculated = useMemo(() => {
      return calculatorAmounts.reduce((acc, curr) => acc + curr, 0);
    }, [calculatorAmounts]);

    const handleAddCalcAmount = () => {
      const val = parseFloat(calcInput.replace(',', '.'));
      if (!isNaN(val) && val > 0) {
        setCalculatorAmounts([...calculatorAmounts, val]);
        setCalcInput('');
      }
    };

    const applyCalculated = () => {
      let finalTotal = totalCalculated;
      const currentVal = parseFloat(calcInput.replace(',', '.'));
      if (!isNaN(currentVal) && currentVal > 0) {
        finalTotal += currentVal;
      }

      if (finalTotal > 0) {
        setAmount(finalTotal.toString());
      }
      setShowCalculator(false);
      setCalculatorAmounts([]);
      setCalcInput('');
    };

    useEffect(() => {
      if (showCalculator && amount && calculatorAmounts.length === 0) {
        const currentVal = parseFloat(amount);
        if (!isNaN(currentVal) && currentVal > 0) {
          setCalculatorAmounts([currentVal]);
        }
      }
    }, [showCalculator]);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div 
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white w-full max-w-sm rounded-[2rem] p-5 space-y-4 shadow-2xl relative overflow-hidden"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {initialData ? 'Editar' : 'Registrar'} {type === 'debt' ? 'Deuda' : 'Abono'}
              </h2>
              <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-0.5">Detalles de Transacción</p>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Amount Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Monto</label>
                <button 
                  onClick={() => setShowCalculator(!showCalculator)}
                  className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full transition-all flex items-center gap-1 ${showCalculator ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                >
                  <Plus className={`w-2.5 h-2.5 transition-transform ${showCalculator ? 'rotate-45' : ''}`} />
                  {showCalculator ? 'Cerrar' : 'Sumar'}
                </button>
              </div>

              <AnimatePresence>
                {showCalculator && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 space-y-2 mb-2">
                      <div className="flex gap-1.5">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 font-bold text-xs">{currency === 'BS' ? 'Bs' : '$'}</span>
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={calcInput}
                            onChange={(e) => setCalcInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCalcAmount();
                              }
                            }}
                            placeholder="0.00"
                            className="w-full bg-white border border-blue-100 rounded-xl pl-9 pr-3 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button 
                          onClick={handleAddCalcAmount}
                          className="bg-blue-600 text-white px-4 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {calculatorAmounts.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1">
                            {calculatorAmounts.map((amt, i) => (
                              <span key={i} className="bg-white border border-blue-100 px-1.5 py-0.5 rounded-md text-[9px] font-black text-blue-600 flex items-center gap-1">
                                {amt.toLocaleString()}
                                <button onClick={() => setCalculatorAmounts(calculatorAmounts.filter((_, idx) => idx !== i))}>
                                  <X className="w-2 h-2 text-slate-300 hover:text-red-400" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-1.5 border-t border-blue-100">
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Total</span>
                            <span className="text-sm font-black text-blue-700">{currency === 'BS' ? 'Bs' : '$'} {(totalCalculated + (parseFloat(calcInput.replace(',', '.')) || 0)).toLocaleString()}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => {
                                setCalculatorAmounts([]);
                                setCalcInput('');
                              }}
                              className="flex-1 bg-white border border-blue-200 text-slate-400 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                              Limpiar
                            </button>
                            <button 
                              onClick={applyCalculated}
                              className="flex-[2] bg-blue-600 text-white py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-slate-50 rounded-[1.2rem] p-5 border-2 border-slate-100 focus-within:border-blue-500 transition-all shadow-inner">
                {/* Primary BS Input */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl font-black text-slate-300 tracking-tighter">Bs</span>
                    <input 
                      autoFocus
                      type="number" 
                      value={currency === 'BS' ? amount : (parseFloat(amount) * config.exchangeRate || '').toString()}
                      onChange={(e) => {
                        setCurrency('BS');
                        setAmount(e.target.value);
                      }}
                      className="w-full bg-transparent border-none p-0 font-black text-3xl text-slate-900 outline-none placeholder:text-slate-200 tracking-tighter"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-[8px] font-black text-amber-600 uppercase tracking-[0.2em] ml-1">Bolívares (BS)</p>
                </div>

                <div className="h-px bg-slate-200 my-3" />

                {/* Secondary USD Conversion Input */}
                <div className="space-y-1 opacity-60 focus-within:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-black text-slate-300 tracking-tighter">$</span>
                    <input 
                      type="number" 
                      value={currency === 'USD' ? amount : (parseFloat(amount) / config.exchangeRate || '').toString()}
                      onChange={(e) => {
                        setCurrency('USD');
                        setAmount(e.target.value);
                      }}
                      className="w-full bg-transparent border-none p-0 font-black text-xl text-slate-600 outline-none placeholder:text-slate-200 tracking-tighter"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em] ml-1">Dólares (USD)</p>
                </div>
              </div>
            </div>

            {/* Date Section */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Fecha</label>
              <div className="relative group">
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-lg font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all group-hover:border-slate-200 text-xs"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Concepto</label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-lg font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all group-hover:border-slate-200 text-xs"
                  placeholder="Ej. Pago de factura"
                />
                <Edit2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>

            <button 
              disabled={!amount || parseFloat(amount) <= 0}
              onClick={() => {
                const transactionDate = new Date(date).getTime();
                if (initialData) {
                  updateTransaction(debtorId, initialData.id, parseFloat(amount), currency, transactionDate, description);
                } else {
                  addTransaction(debtorId, type, parseFloat(amount), currency, transactionDate, description);
                }
                onClose();
              }}
              className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-white transition-all shadow-xl active:scale-[0.98] ${type === 'debt' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'}`}
            >
              {initialData ? 'Guardar Cambios' : `Confirmar ${type === 'debt' ? 'Deuda' : 'Abono'}`}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      <AnimatePresence mode="wait">
        {view.type === 'home' && <HomeView key="home" />}
        {view.type === 'profile' && <ProfileView key="profile" />}
        {view.type === 'config' && <ConfigView key="config" />}
        {view.type === 'monthly_summary' && <MonthlySummaryView key="monthly_summary" />}
        {view.type === 'inventory' && <InventoryView key="inventory" />}
        {view.type === 'budget' && <BudgetView key="budget" />}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isAddDebtorOpen && <AddDebtorModal />}
        {isInventoryModalOpen && (
          <InventoryModal 
            onClose={() => setIsInventoryModalOpen(false)} 
          />
        )}
        {editingInventoryItem && (
          <InventoryModal 
            initialData={editingInventoryItem}
            onClose={() => setEditingInventoryItem(null)} 
          />
        )}
        {isAddTransactionOpen && view.debtorId && (
          <TransactionModal 
            type={isAddTransactionOpen.type} 
            debtorId={view.debtorId} 
            onClose={() => setIsAddTransactionOpen(null)} 
          />
        )}
        {editingTransaction && (
          <TransactionModal 
            type={editingTransaction.transaction.type} 
            debtorId={editingTransaction.debtorId} 
            initialData={editingTransaction.transaction}
            onClose={() => setEditingTransaction(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TransactionMenu({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-300 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
        <MoreVertical className="w-5 h-5" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute right-0 mt-2 w-44 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 z-20 overflow-hidden p-2"
            >
              <button 
                onClick={() => { onEdit(); setIsOpen(false); }}
                className="w-full px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </div>
                Editar
              </button>
              <button 
                onClick={() => { onDelete(); setIsOpen(false); }}
                className="w-full px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  <Trash2 className="w-4 h-4" />
                </div>
                Eliminar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
