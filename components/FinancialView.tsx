
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isWithinInterval, 
  format, 
  parseISO, 
  subDays, 
  startOfDay, 
  endOfDay,
  startOfYear,
  endOfYear,
  isValid
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transaction } from '../types';
import { TransactionForm, TransactionFormValues } from './finance/TransactionForm';
import { formatCurrency } from '../lib/utils';
import { useSchoolData } from '../contexts/SchoolDataContext';
import { generateDualReceiptPDF } from '../lib/pdf-service';

interface DateRange {
  from: Date;
  to: Date;
}

export const FinancialView: React.FC = () => {
  const { transactions, addTransaction } = useSchoolData();
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Date Range State & Picker Controls
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date('2023-10-01')), // Mock anchor date for visual consistency with mock data
    to: endOfMonth(new Date('2023-10-01'))
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // 2. Filter Logic (Search + Date Range)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            tx.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const txDate = parseISO(tx.date);
      // Use startOfDay and endOfDay to ensure we cover the entire selected day range
      const inDateRange = isWithinInterval(txDate, { 
        start: startOfDay(dateRange.from), 
        end: endOfDay(dateRange.to) 
      });

      return matchesSearch && inDateRange;
    });
  }, [transactions, searchTerm, dateRange]);

  // 3. Dynamic KPIs based on Filtered Data
  const kpis = useMemo(() => {
    const revenue = filteredTransactions
        .filter(t => t.type === 'income' && t.status === 'completed')
        .reduce((acc, curr) => acc + curr.amount, 0);
    
    const expenses = filteredTransactions
        .filter(t => t.type === 'expense' && t.status === 'completed')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const pending = filteredTransactions
        .filter(t => t.status === 'pending')
        .reduce((acc, curr) => acc + curr.amount, 0);

    return { revenue, expenses, net: revenue - expenses, pending };
  }, [filteredTransactions]);

  // --- Actions ---

  const handlePresetSelect = (preset: 'today' | 'week' | 'month' | 'year' | 'last7' | 'last30') => {
    const today = new Date('2023-10-25'); // Anchored for mock data consistency
    let newRange: DateRange = { from: today, to: today };

    switch (preset) {
        case 'today':
            newRange = { from: today, to: today };
            break;
        case 'week':
            newRange = { from: startOfWeek(today), to: endOfWeek(today) };
            break;
        case 'month':
            newRange = { from: startOfMonth(today), to: endOfMonth(today) };
            break;
        case 'year':
            newRange = { from: startOfYear(today), to: endOfYear(today) };
            break;
        case 'last7':
            newRange = { from: subDays(today, 7), to: today };
            break;
        case 'last30':
            newRange = { from: subDays(today, 30), to: today };
            break;
    }
    setDateRange(newRange);
    setIsDatePickerOpen(false);
    showToast(`Filtro atualizado: ${format(newRange.from, 'dd/MM')} a ${format(newRange.to, 'dd/MM')}`);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Data", "Descrição", "Categoria", "Tipo", "Valor", "Status"];
    const rows = filteredTransactions.map(tx => [
      tx.id,
      tx.date,
      `"${tx.description}"`, // Escape commas
      tx.category,
      tx.type === 'income' ? 'Entrada' : 'Saída',
      tx.amount.toFixed(2),
      tx.status
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const filename = `relatorio-financeiro-${format(dateRange.from, 'yyyy-MM-dd')}-ate-${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Relatório CSV gerado com sucesso!");
    setIsDatePickerOpen(false); // Close if open
  };

  const handleNewTransaction = (data: TransactionFormValues) => {
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: data.date,
      description: data.description,
      amount: Number(data.amount),
      type: data.type,
      category: data.category,
      method: data.paymentMethod as any, // FIXED: Use data from form instead of hardcoded 'Cash'
      status: 'completed',
      attachment: data.attachmentBase64, // Use base64 string
      studentId: data.studentId,
      paidMonths: data.selectedMonths
    };

    addTransaction(newTx);
    setIsSheetOpen(false);
    
    // Generate the Receipt automatically if it's an Income
    if (newTx.type === 'income') {
        generateDualReceiptPDF(newTx);
        showToast("Transação salva e Recibo gerado com sucesso!");
    } else {
        showToast("Saída registrada com sucesso!");
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
       {/* Toast Notification */}
       {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300">
            <span className="material-symbols-outlined text-green-400">check_circle</span>
            <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Controls */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0d121b] dark:text-white">Controle Financeiro</h2>
            <div className="flex items-center gap-2 text-sm text-neutral-gray mt-1">
              <span>Home</span>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span>Financeiro</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             {/* Robust Date Range Picker */}
             <div className="relative" ref={datePickerRef}>
                <button 
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className={`
                    flex items-center gap-2 px-3 py-2 bg-white dark:bg-surface-dark border rounded-lg shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-800
                    ${isDatePickerOpen ? 'border-primary ring-2 ring-primary/10' : 'border-[#e7ebf3] dark:border-gray-700'}
                  `}
                >
                    <span className="material-symbols-outlined text-neutral-gray text-[20px]">calendar_month</span>
                    <div className="flex flex-col items-start text-xs">
                        <span className="text-[10px] text-neutral-gray uppercase font-bold tracking-wider">Período</span>
                        <span className="font-medium text-[#0d121b] dark:text-white whitespace-nowrap">
                            {format(dateRange.from, 'dd MMM, yy', {locale: ptBR})} - {format(dateRange.to, 'dd MMM, yy', {locale: ptBR})}
                        </span>
                    </div>
                    <span className="material-symbols-outlined text-neutral-gray text-[18px]">arrow_drop_down</span>
                </button>

                {/* Date Picker Popover */}
                {isDatePickerOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[320px] sm:w-[480px] bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl border border-[#e7ebf3] dark:border-gray-700 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col sm:flex-row overflow-hidden">
                        
                        {/* Left: Presets */}
                        <div className="w-full sm:w-1/3 bg-gray-50/50 dark:bg-gray-800/50 border-b sm:border-b-0 sm:border-r border-[#e7ebf3] dark:border-gray-800 p-2 flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-visible">
                            {[
                                { id: 'today', label: 'Hoje' },
                                { id: 'last7', label: 'Últimos 7 dias' },
                                { id: 'last30', label: 'Últimos 30 dias' },
                                { id: 'week', label: 'Esta Semana' },
                                { id: 'month', label: 'Este Mês' },
                                { id: 'year', label: 'Este Ano' },
                            ].map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => handlePresetSelect(preset.id as any)}
                                    className="px-3 py-2 text-sm text-left rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm text-neutral-gray hover:text-[#0d121b] dark:hover:text-white transition-all whitespace-nowrap"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Right: Custom Range Inputs */}
                        <div className="p-4 flex-1 space-y-4">
                            <h4 className="text-sm font-bold text-[#0d121b] dark:text-white mb-2">Intervalo Personalizado</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-neutral-gray font-semibold">Início</label>
                                    <input 
                                        type="date" 
                                        value={format(dateRange.from, 'yyyy-MM-dd')}
                                        onChange={(e) => {
                                            const d = parseISO(e.target.value);
                                            if (isValid(d)) setDateRange(prev => ({ ...prev, from: d }));
                                        }}
                                        className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1.5 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-neutral-gray font-semibold">Fim</label>
                                    <input 
                                        type="date" 
                                        value={format(dateRange.to, 'yyyy-MM-dd')}
                                        onChange={(e) => {
                                            const d = parseISO(e.target.value);
                                            if (isValid(d)) setDateRange(prev => ({ ...prev, to: d }));
                                        }}
                                        className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1.5 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-2 border-t border-[#e7ebf3] dark:border-gray-800 flex justify-between items-center">
                                <button 
                                    onClick={handleExportCSV}
                                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[14px]">download</span>
                                    Exportar Dados
                                </button>
                                <button 
                                    onClick={() => setIsDatePickerOpen(false)}
                                    className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:bg-primary-dark transition-colors"
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
             </div>

             <button 
                onClick={() => setIsSheetOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-sm"
             >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Nova Transação
             </button>
          </div>
        </div>

        {/* 2. Financial KPI Cards (Dynamic) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FinancialCard 
              label="Receita (Período)" 
              value={formatCurrency(kpis.revenue)} 
              icon="arrow_circle_up" 
              color="text-success" 
              bgColor="bg-success/10" 
              trend="Filtrado"
            />
            <FinancialCard 
              label="Despesas (Período)" 
              value={formatCurrency(kpis.expenses)} 
              icon="arrow_circle_down" 
              color="text-warning" 
              bgColor="bg-warning/10" 
              trend="Filtrado"
            />
            <FinancialCard 
              label="Saldo Líquido" 
              value={formatCurrency(kpis.net)} 
              icon="account_balance_wallet" 
              color="text-primary" 
              bgColor="bg-primary/10" 
              trend={kpis.net >= 0 ? "Positivo" : "Negativo"}
            />
             <FinancialCard 
              label="Pendentes" 
              value={formatCurrency(kpis.pending)} 
              icon="pending_actions" 
              color="text-orange-500" 
              bgColor="bg-orange-100 dark:bg-orange-900/20" 
              trend="A receber/pagar"
            />
        </div>
      </div>

      {/* 3. Visual Analysis & Ledger Split - Chart removed, Ledger takes full space */}
      <div className="flex-1">
          {/* 4. Transactions Ledger (The Core) */}
          <div className="w-full bg-surface-light dark:bg-surface-dark rounded-xl border border-[#e7ebf3] dark:border-gray-700 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <div className="p-5 border-b border-[#e7ebf3] dark:border-gray-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">Extrato Detalhado</h3>
                  <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar transação..." 
                        className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary"
                     />
                  </div>
              </div>
              
              <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#e7ebf3] dark:border-gray-800">
                              <th className="py-3 px-5 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Data</th>
                              <th className="py-3 px-5 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Descrição</th>
                              <th className="py-3 px-5 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Categoria</th>
                              <th className="py-3 px-5 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Valor</th>
                              <th className="py-3 px-5 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Status</th>
                              <th className="py-3 px-5 text-xs font-semibold text-neutral-gray uppercase tracking-wider text-right">Anexo</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e7ebf3] dark:divide-gray-800">
                          {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                  <td className="py-3 px-5 text-sm text-neutral-gray whitespace-nowrap">
                                    {format(parseISO(tx.date), 'dd/MM/yyyy')}
                                  </td>
                                  <td className="py-3 px-5 text-sm font-medium text-[#0d121b] dark:text-white max-w-[200px] truncate" title={tx.description}>
                                    {tx.description}
                                  </td>
                                  <td className="py-3 px-5">
                                    <span className="px-2 py-1 rounded text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                        {tx.category}
                                    </span>
                                  </td>
                                  <td className={`py-3 px-5 text-sm font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-success' : 'text-warning'}`}>
                                      <div className="flex items-center gap-1">
                                          <span className="material-symbols-outlined text-[14px]">
                                            {tx.type === 'income' ? 'arrow_upward' : 'arrow_downward'}
                                          </span>
                                          {tx.type === 'expense' ? '-' : '+'} {formatCurrency(tx.amount)}
                                      </div>
                                  </td>
                                  <td className="py-3 px-5">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit
                                          ${tx.status === 'completed' ? 'bg-green-50 text-success border-green-100' : 
                                            tx.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                                            'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                          <span className="size-1.5 rounded-full bg-current"></span>
                                          {tx.status === 'completed' ? 'Concluído' : tx.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                      </span>
                                  </td>
                                  <td className="py-3 px-5 text-right">
                                      {tx.attachment ? (
                                        <button 
                                          onClick={() => {
                                            const win = window.open();
                                            if (win) {
                                                win.document.write('<iframe src="' + tx.attachment + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
                                            }
                                          }}
                                          className="text-primary hover:text-primary-dark" 
                                          title="Ver Anexo"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">attachment</span>
                                        </button>
                                      ) : (
                                        <span className="text-gray-300 material-symbols-outlined text-[18px]">block</span>
                                      )}
                                  </td>
                              </tr>
                          )) : (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-neutral-gray text-sm">
                                    Nenhuma transação encontrada neste período.
                                </td>
                            </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* 5. "Nova Transação" Sheet */}
      {isSheetOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                onClick={() => setIsSheetOpen(false)}
              ></div>
              <div className="relative w-full max-w-xl bg-surface-light dark:bg-surface-dark shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="p-6 border-b border-[#e7ebf3] dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                      <div>
                          <h2 className="text-xl font-bold text-[#0d121b] dark:text-white">Nova Transação</h2>
                          <p className="text-sm text-neutral-gray">Registre uma entrada ou saída no sistema.</p>
                      </div>
                      <button onClick={() => setIsSheetOpen(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                          <span className="material-symbols-outlined text-neutral-gray">close</span>
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                      <TransactionForm onSuccess={handleNewTransaction} onCancel={() => setIsSheetOpen(false)} />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// --- Helper Components ---

const FinancialCard: React.FC<{ label: string; value: string; icon: string; color: string; bgColor: string; trend: string }> = ({ label, value, icon, color, bgColor, trend }) => (
    <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-[#e7ebf3] dark:border-gray-700 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
        <div className="flex justify-between items-start z-10">
            <div>
                <p className="text-sm text-neutral-gray font-medium">{label}</p>
                <h3 className={`text-2xl font-bold mt-1 ${label.includes('Despesas') ? 'text-[#0d121b] dark:text-white' : 'text-[#0d121b] dark:text-white'}`}>{value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${bgColor} ${color}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
        </div>
        <p className={`text-xs font-medium mt-2 z-10 ${trend === 'Positivo' ? 'text-success' : trend === 'Negativo' ? 'text-warning' : 'text-neutral-gray'}`}>
            {trend}
        </p>
    </div>
);
