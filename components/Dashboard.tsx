
import React from 'react';
import { KpiCard } from './KpiCard';
import { FinancialChart } from './FinancialChart';
import { KPIData } from '../types';
import { formatCurrency } from '../lib/utils';
import { useSchoolData } from '../contexts/SchoolDataContext';

export const Dashboard: React.FC = () => {
  const { kpis } = useSchoolData();

  const kpiList: KPIData[] = [
    {
      label: 'Alunos Ativos',
      value: kpis.totalStudents.toString(),
      trend: 2.4, // Keep static trend for now or calculate historical diff if needed
      trendLabel: '+2.4%',
      trendDirection: 'up',
      icon: 'school',
      color: 'primary'
    },
    {
      label: 'Receita',
      value: formatCurrency(kpis.totalRevenue),
      subValue: `/ ${formatCurrency(kpis.totalRevenue * 1.1)}`, // Mock target as 110%
      trend: 0,
      trendLabel: 'Meta',
      trendDirection: 'neutral',
      icon: 'attach_money',
      color: 'success',
      progress: 90, // Calculated progress
      isTarget: true
    },
    {
      label: 'Inadimplência',
      value: `${kpis.delinquencyRate}%`,
      trend: -0.5,
      trendLabel: '-0.5%',
      trendDirection: 'down', // Down is good for bad things
      icon: 'warning',
      color: 'warning'
    },
    {
      label: 'Saldo Líquido',
      value: formatCurrency(kpis.netBalance),
      trend: 1.0,
      trendLabel: 'Positivo',
      trendDirection: 'up',
      icon: 'account_balance_wallet',
      color: 'info'
    }
  ];

  const currentDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0d121b] dark:text-white">Visão Geral</h2>
          <p className="text-neutral-gray mt-1 text-sm">Bem-vindo de volta, Ricardo. Aqui está o resumo da escola hoje.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-gray bg-white dark:bg-surface-dark px-4 py-2 rounded-lg border border-[#e7ebf3] dark:border-gray-700 shadow-sm hover:shadow transition-shadow cursor-pointer">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>calendar_today</span>
          <span className="capitalize">{currentDate}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiList.map((kpi, idx) => (
          <KpiCard key={idx} data={kpi} />
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="w-full">
        <FinancialChart />
      </div>
    </div>
  );
};
