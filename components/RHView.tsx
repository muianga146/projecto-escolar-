
import React, { useState } from 'react';
import { Employee, Department } from '../types';
import { EmployeeForm, EmployeeFormValues } from './rh/EmployeeForm';
import { formatCurrency } from '../lib/utils';
import { useSchoolData } from '../contexts/SchoolDataContext';

export const RHView: React.FC = () => {
  const { employees, addEmployee } = useSchoolData();
  const [activeTab, setActiveTab] = useState<'colaboradores'>('colaboradores');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showValues, setShowValues] = useState(false);
  const [filterDept, setFilterDept] = useState<string>('Todos');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getDepartmentColor = (dept: Department) => {
      switch(dept) {
          case 'Docentes': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
          case 'Administrativo': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
          case 'Direção': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
          default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      }
  };

  const filteredEmployees = filterDept === 'Todos' 
    ? employees 
    : employees.filter(emp => emp.department === filterDept);

  const handleNewEmployee = (data: EmployeeFormValues) => {
    const newEmployee: Employee = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.personal.fullName,
        role: data.contract.role,
        department: data.contract.department as Department,
        salary: {
            base: Number(data.contract.baseSalary),
            currency: 'MZN'
        },
        email: data.personal.email,
        phone: data.personal.phone,
        // Use uploaded avatar if present, else fallback
        avatar: data.avatarBase64 || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.personal.fullName)}&background=random`,
        contractType: data.contract.contractType as any,
        admissionDate: data.contract.admissionDate,
        status: 'active',
        personal: {
            biNumber: data.personal.biNumber,
            nuit: data.personal.nuit,
            dob: data.personal.dob
        },
        bank: {
            bankName: data.bank.bankName,
            accountNumber: data.bank.accountNumber,
            nib: data.bank.nib
        }
    };

    addEmployee(newEmployee);
    setIsSheetOpen(false);
    setToastMessage("Colaborador cadastrado com sucesso!");
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

      {/* 1. Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0d121b] dark:text-white">Recursos Humanos</h2>
          <div className="flex items-center gap-2 text-sm text-neutral-gray mt-1">
            <span>Home</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span>RH</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
             <button 
                onClick={() => setShowValues(!showValues)}
                className={`p-2 rounded-lg border transition-colors ${showValues ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 text-neutral-gray'}`}
                title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
             >
                <span className="material-symbols-outlined">{showValues ? 'visibility' : 'visibility_off'}</span>
             </button>
             
             {activeTab === 'colaboradores' && (
                <button 
                    onClick={() => setIsSheetOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-sm"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Novo Colaborador
                </button>
             )}
        </div>
      </div>

      {/* 2. Tabs Navigation */}
      <div className="border-b border-[#e7ebf3] dark:border-gray-800">
          <nav className="flex gap-6" aria-label="Tabs">
            {[
                { id: 'colaboradores', label: 'Colaboradores', icon: 'group' },
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                        group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all
                        ${activeTab === tab.id 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-neutral-gray hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}
                    `}
                >
                    <span className={`material-symbols-outlined text-[20px] ${activeTab === tab.id ? 'filled' : ''}`}>{tab.icon}</span>
                    {tab.label}
                </button>
            ))}
          </nav>
      </div>

      {/* 3. Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* --- TAB A: COLABORADORES --- */}
        {activeTab === 'colaboradores' && (
            <div className="space-y-6 flex-1 flex flex-col animate-in fade-in duration-300">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-[#e7ebf3] dark:border-gray-700">
                     <div className="relative w-full sm:w-96">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-gray text-[20px]">search</span>
                        <input 
                        type="text" 
                        placeholder="Buscar colaborador..." 
                        className="w-full pl-10 pr-4 py-2 bg-background-light dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 border focus:border-primary rounded-lg text-sm transition-all outline-none"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                        {['Todos', 'Docentes', 'Administrativo', 'Segurança'].map(dept => (
                            <button 
                                key={dept}
                                onClick={() => setFilterDept(dept)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filterDept === dept ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-neutral-gray hover:bg-gray-200'}`}
                            >
                                {dept}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-[#e7ebf3] dark:border-gray-700 shadow-sm overflow-hidden flex-1">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#e7ebf3] dark:border-gray-800">
                                    <th className="py-4 px-6 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Nome / Cargo</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Departamento</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Contato</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Contrato</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Status</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-neutral-gray uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e7ebf3] dark:divide-gray-800">
                                {filteredEmployees.length > 0 ? filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <img src={emp.avatar} alt={emp.name} className="size-10 rounded-full object-cover border border-gray-100 dark:border-gray-700" />
                                                <div>
                                                    <p className="text-sm font-semibold text-[#0d121b] dark:text-white">{emp.name}</p>
                                                    <p className="text-xs text-neutral-gray">{emp.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getDepartmentColor(emp.department)}`}>
                                                {emp.department}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-[#0d121b] dark:text-white">{emp.email}</span>
                                                <span className="text-xs text-neutral-gray">{emp.phone}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-neutral-gray bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                                                {emp.contractType}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                                                emp.status === 'active' ? 'text-success' : 
                                                emp.status === 'vacation' ? 'text-warning' : 'text-neutral-gray'
                                            }`}>
                                                <span className={`size-1.5 rounded-full ${
                                                    emp.status === 'active' ? 'bg-success' : 
                                                    emp.status === 'vacation' ? 'bg-warning' : 'bg-neutral-gray'
                                                }`}></span>
                                                {emp.status === 'active' ? 'Ativo' : emp.status === 'vacation' ? 'Férias' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button className="text-primary hover:text-primary-dark font-medium text-xs">Editar</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-neutral-gray">
                                            Nenhum colaborador encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

      </div>

      {/* Sheet for New Employee */}
      {isSheetOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                onClick={() => setIsSheetOpen(false)}
              ></div>
              <div className="relative w-full max-w-xl bg-surface-light dark:bg-surface-dark shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="p-6 border-b border-[#e7ebf3] dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                      <div>
                          <h2 className="text-xl font-bold text-[#0d121b] dark:text-white">Novo Colaborador</h2>
                          <p className="text-sm text-neutral-gray">Registro de ficha de funcionário.</p>
                      </div>
                      <button onClick={() => setIsSheetOpen(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                          <span className="material-symbols-outlined text-neutral-gray">close</span>
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                      <EmployeeForm onSuccess={handleNewEmployee} onCancel={() => setIsSheetOpen(false)} />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
