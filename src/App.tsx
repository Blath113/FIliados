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
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Debtor, Transaction, AppConfig, Currency } from './types';

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
    return saved ? JSON.parse(saved) : { exchangeRate: 60 }; // Default rate
  });

  const [view, setView] = useState<{ type: 'home' | 'profile' | 'config'; debtorId?: string }>({ type: 'home' });
  const [isAddDebtorOpen, setIsAddDebtorOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState<{ type: 'debt' | 'payment' } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<{ debtorId: string, transaction: Transaction } | null>(null);

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

  const addTransaction = (debtorId: string, type: 'debt' | 'payment', amount: number, currency: Currency, description?: string) => {
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
      date: Date.now()
    };

    setDebtors(debtors.map(d => {
      if (d.id === debtorId) {
        return { ...d, transactions: [newTransaction, ...d.transactions] };
      }
      return d;
    }));
    setIsAddTransactionOpen(null);
  };

  const updateTransaction = (debtorId: string, transactionId: string, amount: number, currency: Currency, description?: string) => {
    const amountUSD = currency === 'USD' ? amount : amount / config.exchangeRate;
    const amountBS = currency === 'BS' ? amount : amount * config.exchangeRate;

    setDebtors(debtors.map(d => {
      if (d.id === debtorId) {
        return {
          ...d,
          transactions: d.transactions.map(t => {
            if (t.id === transactionId) {
              return { ...t, amount, currency, amountUSD, amountBS, description };
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

  // --- Views ---

  const HomeView = () => (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">DeudaTrack</h1>
        <button onClick={() => setView({ type: 'config' })} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <Settings className="w-6 h-6 text-slate-600" />
        </button>
      </div>

      {/* Main Balance Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <DollarSign className="w-24 h-24" />
        </div>
        <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Saldo Total</p>
        <h2 className="text-4xl font-bold mb-2">
          ${totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        <p className="text-blue-200 text-sm">
          ≈ Bs. {(totalBalanceUSD * config.exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </motion.div>

      {/* Add Debtor Button */}
      <button 
        onClick={() => setIsAddDebtorOpen(true)}
        className="w-full bg-white border-2 border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-all group"
      >
        <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-medium">Añadir Deudor</span>
      </button>

      {/* Debtors List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest px-1">Perfiles</h3>
        {debtors.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>No hay deudores registrados</p>
          </div>
        ) : (
          debtors.map((debtor) => {
            const balance = debtor.transactions.reduce((acc, t) => {
              const val = t.type === 'debt' ? t.amountUSD : -t.amountUSD;
              return acc + val;
            }, 0);
            
            return (
              <motion.div
                key={debtor.id}
                layoutId={debtor.id}
                onClick={() => setView({ type: 'profile', debtorId: debtor.id })}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {debtor.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-700">{debtor.name}</span>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${balance > 0 ? 'text-red-500' : balance < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {balance > 0 ? '+' : ''}${Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );

  const ProfileView = () => {
    const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
    if (!currentDebtor) return null;

    return (
      <div className="p-4 max-w-md mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <button onClick={() => setView({ type: 'home' })} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-800 truncate px-4">{currentDebtor.name}</h1>
          <button onClick={() => deleteDebtor(currentDebtor.id)} className="p-2 rounded-full hover:bg-red-50 text-red-400 transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Debtor Balance Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200"
        >
          <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Saldo Pendiente</p>
          <h2 className="text-4xl font-bold mb-2">
            ${debtorBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-blue-200 text-sm">
            ≈ Bs. {(debtorBalanceUSD * config.exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setIsAddTransactionOpen({ type: 'debt' })}
            className="bg-red-50 text-red-600 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-red-100 transition-colors font-semibold"
          >
            <TrendingUp className="w-6 h-6" />
            Deuda
          </button>
          <button 
            onClick={() => setIsAddTransactionOpen({ type: 'payment' })}
            className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-emerald-100 transition-colors font-semibold"
          >
            <TrendingDown className="w-6 h-6" />
            Abono
          </button>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest px-1">Movimientos</h3>
          {currentDebtor.transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>No hay transacciones</p>
            </div>
          ) : (
            currentDebtor.transactions.map((t) => (
              <div 
                key={t.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all"
              >
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedTransaction(expandedTransaction === t.id ? null : t.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'debt' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      {t.type === 'debt' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">{t.description || (t.type === 'debt' ? 'Deuda' : 'Abono')}</p>
                      <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-bold text-lg ${t.type === 'debt' ? 'text-red-500' : 'text-emerald-500'}`}>
                        {t.type === 'debt' ? '+' : '-'}${t.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
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
                      className="border-top border-slate-50 bg-slate-50/50"
                    >
                      <div className="p-4 pt-0 space-y-3">
                        <div className="h-px bg-slate-100 w-full mb-3" />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</p>
                            <p className={`text-sm font-semibold ${t.type === 'debt' ? 'text-red-600' : 'text-emerald-600'}`}>
                              {t.type === 'debt' ? 'Deuda Registrada' : 'Abono Realizado'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasa Aplicada</p>
                            <p className="text-sm font-semibold text-slate-600">
                              1 USD = {config.exchangeRate} BS
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monto Original</p>
                            <p className="text-sm font-semibold text-slate-700">
                              {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {t.currency}
                            </p>
                          </div>
                          {t.description && (
                            <div className="col-span-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nota</p>
                              <p className="text-sm text-slate-600 italic">"{t.description}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const ConfigView = () => {
    const [rate, setRate] = useState(config.exchangeRate.toString());

    return (
      <div className="p-4 max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setView({ type: 'home' })} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <ArrowLeftRight className="w-5 h-5" />
            <h2 className="font-bold">Tasa de Cambio</h2>
          </div>
          <p className="text-sm text-slate-500">Define el valor de 1 USD en Bolívares para los cálculos automáticos.</p>
          
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">1 USD =</span>
            <input 
              type="number" 
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full pl-20 pr-12 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0.00"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">BS</span>
          </div>

          <button 
            onClick={() => {
              setConfig({ exchangeRate: parseFloat(rate) || 1 });
              setView({ type: 'home' });
            }}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
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
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Nuevo Deudor</h2>
            <button onClick={() => setIsAddDebtorOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nombre Completo</label>
              <input 
                autoFocus
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <button 
              disabled={!name.trim()}
              onClick={() => addDebtor(name)}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
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
    const [currency, setCurrency] = useState<Currency>(initialData?.currency || 'USD');
    const [description, setDescription] = useState(initialData?.description || '');

    const converted = useMemo(() => {
      const val = parseFloat(amount) || 0;
      if (currency === 'USD') return `Bs. ${(val * config.exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      return `$${(val / config.exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }, [amount, currency]);

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">
              {initialData ? 'Editar' : 'Agregar'} {type === 'debt' ? 'Deuda' : 'Abono'}
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 rounded-3xl p-6 border-2 border-slate-100 focus-within:border-blue-500 transition-all">
              {/* Primary USD Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-1">Monto Principal (USD)</label>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-slate-400">$</span>
                  <input 
                    autoFocus
                    type="number" 
                    value={currency === 'USD' ? amount : (parseFloat(amount) / config.exchangeRate || '').toString()}
                    onChange={(e) => {
                      setCurrency('USD');
                      setAmount(e.target.value);
                    }}
                    className="w-full bg-transparent border-none p-0 font-bold text-4xl text-slate-800 outline-none placeholder:text-slate-200"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="h-px bg-slate-200 my-4" />

              {/* Secondary BS Conversion Input */}
              <div className="space-y-1 opacity-80 focus-within:opacity-100 transition-opacity">
                <label className="text-[10px] font-bold text-amber-600 uppercase tracking-widest ml-1">Conversión (BS)</label>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-slate-400">Bs</span>
                  <input 
                    type="number" 
                    value={currency === 'BS' ? amount : (parseFloat(amount) * config.exchangeRate || '').toString()}
                    onChange={(e) => {
                      setCurrency('BS');
                      setAmount(e.target.value);
                    }}
                    className="w-full bg-transparent border-none p-0 font-bold text-2xl text-slate-600 outline-none placeholder:text-slate-200"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Descripción (Opcional)</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej. Compra de repuestos"
            />
          </div>

            <button 
              disabled={!amount || parseFloat(amount) <= 0}
              onClick={() => {
                if (initialData) {
                  updateTransaction(debtorId, initialData.id, parseFloat(amount), currency, description);
                } else {
                  addTransaction(debtorId, type, parseFloat(amount), currency, description);
                }
              }}
              className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg ${type === 'debt' ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100'}`}
            >
              Confirmar {type === 'debt' ? 'Deuda' : 'Abono'}
            </button>
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
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isAddDebtorOpen && <AddDebtorModal />}
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
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50">
        <MoreVertical className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden">
            <button 
              onClick={() => { onEdit(); setIsOpen(false); }}
              className="w-full px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
            <button 
              onClick={() => { onDelete(); setIsOpen(false); }}
              className="w-full px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
