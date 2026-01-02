
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Student, Transaction, CalendarEvent, Employee, KPIData } from '../types';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { getStudentFinancialStatus } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';

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

export const SchoolDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Data Fetching ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
        // 1. Fetch Students
        const { data: studentsData, error: studentError } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (studentError) throw studentError;

        setStudents((studentsData || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            avatar: s.avatar,
            enrollmentId: s.enrollment_id,
            grade: s.grade,
            balance: s.balance,
            status: s.status,
            financialStatus: s.financial_status,
            paidMonths: s.paid_months || [],
            personal: s.personal || {},
            academic: s.academic || {},
            guardians: s.guardians || {},
            health: s.health || {}
        })));

        // 2. Fetch Transactions
        const { data: txData, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });

        if (txError) throw txError;

        setTransactions((txData || []).map((t: any) => ({
            id: t.id,
            date: t.date,
            description: t.description,
            amount: t.amount,
            type: t.type,
            category: t.category,
            method: t.method,
            status: t.status,
            attachment: t.attachment,
            studentId: t.student_id,
            paidMonths: t.paid_months || []
        })));

        // 3. Fetch Events
        const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('*');

        if (eventError) throw eventError;

        setEvents((eventData || []).map((e: any) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            start: new Date(e.start_time),
            end: new Date(e.end_time),
            category: e.category,
            location: e.location
        })));

        // 4. Fetch Employees
        const { data: empData, error: empError } = await supabase
            .from('employees')
            .select('*')
            .order('created_at', { ascending: false });

        if (empError) throw empError;

        setEmployees((empData || []).map((e: any) => ({
            id: e.id,
            name: e.name,
            role: e.role,
            department: e.department,
            email: e.email,
            phone: e.phone,
            avatar: e.avatar,
            contractType: e.contract_type,
            admissionDate: e.admission_date,
            status: e.status,
            salary: {
                base: e.salary_base,
                currency: e.salary_currency
            },
            personal: e.personal || {},
            bank: e.bank || {}
        })));

    } catch (err: any) {
        console.error("Supabase Data Fetch Error:", err.message || JSON.stringify(err));
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Actions ---

  const addStudent = async (s: Student) => {
    setStudents(prev => [s, ...prev]);
    const { error } = await supabase.from('students').insert({
        id: s.id,
        name: s.name,
        email: s.email,
        avatar: s.avatar,
        enrollment_id: s.enrollmentId,
        grade: s.grade,
        balance: s.balance,
        status: s.status,
        financial_status: s.financialStatus,
        paid_months: s.paidMonths,
        personal: s.personal,
        academic: s.academic,
        guardians: s.guardians,
        health: s.health
    });
    if (error) console.error("Error saving student:", error);
  };

  const updateStudent = async (s: Student) => {
    setStudents(prev => prev.map(item => item.id === s.id ? s : item));
    const { error } = await supabase.from('students').update({
        name: s.name,
        email: s.email,
        avatar: s.avatar,
        enrollment_id: s.enrollmentId,
        grade: s.grade,
        balance: s.balance,
        status: s.status,
        financial_status: s.financialStatus,
        paid_months: s.paidMonths,
        personal: s.personal,
        academic: s.academic,
        guardians: s.guardians,
        health: s.health
    }).eq('id', s.id);
    if (error) console.error("Error updating student:", error);
  };
  
  const addTransaction = async (t: Transaction) => {
    setTransactions(prev => [t, ...prev]);
    const { error: txError } = await supabase.from('transactions').insert({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        method: t.method,
        status: t.status,
        attachment: t.attachment,
        student_id: t.studentId || null,
        paid_months: t.paidMonths
    });
    if (txError) console.error("Error adding transaction:", txError);

    if (t.studentId && t.paidMonths && t.paidMonths.length > 0) {
        const studentToUpdate = students.find(s => s.id === t.studentId);
        if (studentToUpdate) {
            const updatedPaidMonths = Array.from(new Set([...studentToUpdate.paidMonths, ...t.paidMonths!]));
            const newStatus = getStudentFinancialStatus(updatedPaidMonths);
            const updatedStudent = { ...studentToUpdate, paidMonths: updatedPaidMonths, financialStatus: newStatus };
            
            setStudents(prev => prev.map(s => s.id === t.studentId ? updatedStudent : s));
            await supabase.from('students').update({
                paid_months: updatedPaidMonths,
                financial_status: newStatus
            }).eq('id', t.studentId);
        }
    }
  };
  
  const addEvent = async (e: CalendarEvent) => {
    setEvents(prev => [...prev, e]);
    const { error } = await supabase.from('events').insert({
        id: e.id,
        title: e.title,
        description: e.description,
        start_time: e.start.toISOString(),
        end_time: e.end.toISOString(),
        category: e.category,
        location: e.location
    });
    if (error) console.error("Error adding event:", error);
  };

  const updateEvent = async (e: CalendarEvent) => {
    setEvents(prev => prev.map(ev => ev.id === e.id ? e : ev));
    const { error } = await supabase.from('events').update({
        title: e.title,
        description: e.description,
        start_time: e.start.toISOString(),
        end_time: e.end.toISOString(),
        category: e.category,
        location: e.location
    }).eq('id', e.id);
    if (error) console.error("Error updating event:", error);
  };

  const deleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(ev => ev.id !== id));
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) console.error("Error deleting event:", error);
  };

  const addEmployee = async (e: Employee) => {
    setEmployees(prev => [e, ...prev]);
    const { error } = await supabase.from('employees').insert({
        id: e.id,
        name: e.name,
        role: e.role,
        department: e.department,
        email: e.email,
        phone: e.phone,
        avatar: e.avatar,
        contract_type: e.contractType,
        admission_date: e.admissionDate,
        status: e.status,
        salary_base: e.salary.base,
        salary_currency: e.salary.currency,
        personal: e.personal,
        bank: e.bank
    });
    if (error) console.error("Error adding employee:", error);
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
      refreshData: fetchData,
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
