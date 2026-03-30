import * as XLSX from 'xlsx';
import { Debtor, Transaction } from '../types';

export const exportDebtorToExcel = (debtor: Debtor) => {
  const data = debtor.transactions.map(t => ({
    Fecha: new Date(t.date).toLocaleDateString(),
    Tipo: t.type === 'debt' ? 'Deuda' : 'Abono',
    Monto: t.amount,
    Moneda: t.currency,
    'Monto USD': t.amountUSD.toFixed(2),
    'Monto BS': t.amountBS.toFixed(2),
    Descripción: t.description || ''
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Actividad');
  XLSX.writeFile(wb, `${debtor.name}_actividad.xlsx`);
};

export const exportMonthlyActivityToExcel = (debtors: Debtor[], month: number, year: number) => {
  const allTransactions: any[] = [];
  
  debtors.forEach(debtor => {
    debtor.transactions.forEach(t => {
      const date = new Date(t.date);
      if (date.getMonth() === month && date.getFullYear() === year) {
        allTransactions.push({
          Deudor: debtor.name,
          Fecha: date.toLocaleDateString(),
          Tipo: t.type === 'debt' ? 'Deuda' : 'Abono',
          Monto: t.amount,
          Moneda: t.currency,
          'Monto USD': t.amountUSD.toFixed(2),
          'Monto BS': t.amountBS.toFixed(2),
          Descripción: t.description || ''
        });
      }
    });
  });

  const ws = XLSX.utils.json_to_sheet(allTransactions);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Actividad Mensual');
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
  XLSX.writeFile(wb, `Actividad_${monthName}_${year}.xlsx`);
};
