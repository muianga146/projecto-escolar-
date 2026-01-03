
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Student, Transaction, CalendarEvent, Employee, KPIData } from '../types';
import { getStudentFinancialStatus } from '../lib/utils';

// --- CONTEXT DEFINITION ---

interface SchoolDataContextType {
  students: Student[];
  transactions: Transaction[];
  events: CalendarEvent[];
  employees: Employee[];
  
  // Actions
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (student: Student) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  addEvent: (event: CalendarEvent) => Promise<void>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addEmployee: (employee: Employee) => Promise<void>;
  refreshData: () => Promise<void>;

  // Computed KPIs
  kpis: {
    totalStudents: number;
    totalRevenue: number;
    totalExpenses: number;
    netBalance: number;
    delinquencyRate: number; // Percentage
  };
  isLoading: boolean;
}

const SchoolDataContext = createContext<SchoolDataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  STUDENTS: 'seiva_students',
  TRANSACTIONS: 'seiva_transactions',
  EVENTS: 'seiva_events',
  EMPLOYEES: 'seiva_employees'
};

export const SchoolDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State: Initialize with empty arrays (Server-Safe)
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. useEffect Loader: Load from LocalStorage ONLY after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
        const savedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const savedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
        const savedEmployees = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);

        if (savedStudents) setStudents(JSON.parse(savedStudents));
        if (savedTx) setTransactions(JSON.parse(savedTx));
        if (savedEvents) {
          const parsedEvents = JSON.parse(savedEvents);
          // Hydrate Date strings back to Date objects
          const hydratedEvents = parsedEvents.map((e: any) => ({
            ...e,
            start: new Date(e.start),
            end: new Date(e.end)
          }));
          setEvents(hydratedEvents);
        }
        if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
      } catch (error) {
        console.error("Failed to load data from localStorage", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // 3. Save data when state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    }
  }, [students, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }
  }, [transactions, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    }
  }, [events, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    }
  }, [employees, isLoading]);


  // --- Actions ---

  const addStudent = async (s: Student) => {
    setStudents(prev => [s, ...prev]);
  };

  const updateStudent = async (s: Student) => {
    setStudents(prev => prev.map(item => item.id === s.id ? s : item));
  };
  
  const addTransaction = async (t: Transaction) => {
    setTransactions(prev => [t, ...prev]);
    
    // Auto-update student financial status if linked
    if (t.studentId && t.paidMonths && t.paidMonths.length > 0) {
      setStudents(prev => prev.map(s => {
        if (s.id === t.studentId) {
          const updatedPaidMonths = Array.from(new Set([...s.paidMonths, ...t.paidMonths!]));
          const newStatus = getStudentFinancialStatus(updatedPaidMonths);
          return { ...s, paidMonths: updatedPaidMonths, financialStatus: newStatus };
        }
        return s;
      }));
    }
  };
  
  const addEvent = async (e: CalendarEvent) => {
    setEvents(prev => [...prev, e]);
  };

  const updateEvent = async (e: CalendarEvent) => {
    setEvents(prev => prev.map(ev => ev.id === e.id ? e : ev));
  };

  const deleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(ev => ev.id !== id));
  };

  const addEmployee = async (e: Employee) => {
    setEmployees(prev => [e, ...prev]);
  };

  const refreshData = async () => {
    // No-op for LocalStorage, data is always fresh in state
    return Promise.resolve();
  };

  // Computed KPIs
  const kpis = useMemo(() => {
    const totalStudents = students.length;
    const revenue = transactions
        .filter(t => t.type === 'income' && t.status === 'completed')
        .reduce((acc, curr) => acc + curr.amount, 0);
    const expenses = transactions
        .filter(t => t.type === 'expense' && t.status === 'completed')
        .reduce((acc, curr) => acc + curr.amount, 0);
    const lateStudents = students.filter(s => getStudentFinancialStatus(s.paidMonths) === 'late').length;
    const delinquencyRate = totalStudents > 0 ? (lateStudents / totalStudents) * 100 : 0;

    return {
        totalStudents,
        totalRevenue: revenue,
        totalExpenses: expenses,
        netBalance: revenue - expenses,
        delinquencyRate: parseFloat(delinquencyRate.toFixed(1))
    };
  }, [students, transactions]);

  return (
    <SchoolDataContext.Provider value={{
      students,
      transactions,
      events,
      employees,
      addStudent,
      updateStudent,
      addTransaction,
      addEvent,
      updateEvent,
      deleteEvent,
      addEmployee,
      refreshData,
      kpis,
      isLoading
    }}>
      {children}
    </SchoolDataContext.Provider>
  );
};

export const useSchoolData = () => {
  const context = useContext(SchoolDataContext);
  if (context === undefined) {
    throw new Error('useSchoolData must be used within a SchoolDataProvider');
  }
  return context;
};
