
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PAYMENT_METHODS } from '../../lib/constants';
import { useSchoolData } from '../../contexts/SchoolDataContext';
import { ACADEMIC_MONTHS } from '../../lib/utils';

// --- Zod Schema ---
const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  studentId: z.string().optional(), // Used for auto-fill logic
  payerName: z.string().min(3, "Nome do pagador/beneficiário é obrigatório"),
  description: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Valor deve ser positivo"),
  category: z.string().min(1, "Selecione uma categoria"),
  paymentMethod: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: "Selecione a forma de pagamento" })
  }),
  date: z.string().refine((val) => val !== '', "Data é obrigatória"),
  isRecurring: z.boolean().optional(),
  attachment: z.any().optional(),
  selectedMonths: z.array(z.string()).optional(), // New field for tuition months
}).superRefine((data, ctx) => {
  // Business Rule: Expense requires attachment
  if (data.type === 'expense') {
    if (!data.attachment || data.attachment.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "É obrigatório anexar o comprovativo para saídas.",
        path: ["attachment"],
      });
    }
  }
});

export type TransactionFormValues = z.infer<typeof transactionSchema> & { attachmentBase64?: string };

interface TransactionFormProps {
  onSuccess: (data: TransactionFormValues) => void;
  onCancel: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, onCancel }) => {
  const { students } = useSchoolData(); // Access global student data
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [attachmentBase64, setAttachmentBase64] = React.useState<string | null>(null);

  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue,
    formState: { errors, isSubmitting } 
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'income',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      payerName: '',
      description: '',
      amount: '',
      selectedMonths: [],
    }
  });

  const transactionType = watch('type');
  const selectedStudentId = watch('studentId');
  const category = watch('category');
  const selectedMonths = watch('selectedMonths');

  // --- Auto-Fill Logic ---
  useEffect(() => {
    if (transactionType === 'income' && selectedStudentId) {
      const student = students.find(s => s.id === selectedStudentId);
      if (student) {
        // 1. Determine Payer Name based on Financial Guardian
        let guardianName = '';
        if (student.guardians.financialResponsible === 'Father') {
            guardianName = student.guardians.father.name;
        } else if (student.guardians.financialResponsible === 'Mother') {
            guardianName = student.guardians.mother.name;
        } else {
            guardianName = student.guardians.emergency.name; // Fallback
        }
        setValue('payerName', guardianName);

        // 2. Auto-set Category to Mensalidade if empty
        if (!category) {
            setValue('category', 'Mensalidade');
        }
      }
    }
  }, [selectedStudentId, transactionType, students, setValue, category]);

  // --- Dynamic Description Logic (Months) ---
  useEffect(() => {
    if (transactionType === 'income' && selectedStudentId && category === 'Mensalidade') {
        const student = students.find(s => s.id === selectedStudentId);
        if (student) {
            if (selectedMonths && selectedMonths.length > 0) {
                // Capitalize months
                const formattedMonths = selectedMonths
                    .map(m => m.charAt(0).toUpperCase() + m.slice(1))
                    .join(', ');
                setValue('description', `Mensalidade: ${formattedMonths} - Aluno: ${student.name}`);
            } else {
                setValue('description', `Mensalidade Ref. ao aluno: ${student.name}`);
            }
        }
    }
  }, [selectedMonths, selectedStudentId, transactionType, category, students, setValue]);

  // Dynamic Categories
  const incomeCategories = ['Mensalidade', 'Uniforme', 'Matrícula', 'Material Escolar', 'Transporte', 'Doação'];
  const expenseCategories = ['Salários', 'Manutenção', 'Água/Luz', 'Internet', 'Material de Limpeza', 'Marketing', 'Aluguel', 'Impostos'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
      
      // Convert to Base64
      const reader = new FileReader();
      reader.onloadend = () => {
          setAttachmentBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFileName(null);
      setAttachmentBase64(null);
    }
  };

  const onSubmit = async (data: TransactionFormValues) => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
    // Pass the base64 string up
    onSuccess({ ...data, attachmentBase64: attachmentBase64 || undefined });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
      
      {/* Type Toggle Cards */}
      <div className="grid grid-cols-2 gap-4">
        <label className={`
          relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all
          ${transactionType === 'income' 
            ? 'border-success bg-success/5 text-success' 
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-neutral-gray'}
        `}>
          <input type="radio" value="income" {...register('type')} className="sr-only" />
          <span className="material-symbols-outlined text-3xl mb-1">trending_up</span>
          <span className="font-bold text-sm">Entrada</span>
        </label>

        <label className={`
          relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all
          ${transactionType === 'expense' 
            ? 'border-warning bg-warning/5 text-warning' 
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-neutral-gray'}
        `}>
          <input type="radio" value="expense" {...register('type')} className="sr-only" />
          <span className="material-symbols-outlined text-3xl mb-1">trending_down</span>
          <span className="font-bold text-sm">Saída</span>
        </label>
      </div>

      <div className="space-y-4">
        
        {/* Student Selector (Only for Income) */}
        {transactionType === 'income' && (
          <div className="flex flex-col gap-1.5 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
             <label className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">school</span>
                Vincular Aluno (Auto-preenchimento)
             </label>
             <div className="relative">
                <select 
                    {...register('studentId')}
                    className="w-full appearance-none rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                    <option value="">Selecione um aluno para preencher...</option>
                    {students.map(student => (
                        <option key={student.id} value={student.id}>
                            {student.name} ({student.grade})
                        </option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-blue-400 text-lg">expand_more</span>
             </div>
          </div>
        )}

        {/* Payer Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">
             {transactionType === 'income' ? 'Recebido De (Pagador)' : 'Pago Para (Beneficiário)'} <span className="text-warning">*</span>
          </label>
          <input 
            {...register('payerName')}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder={transactionType === 'income' ? "Nome do Encarregado" : "Nome do Fornecedor"}
          />
          {errors.payerName && <span className="text-xs text-warning animate-in slide-in-from-left-1">{errors.payerName.message}</span>}
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Categoria <span className="text-warning">*</span></label>
            <div className="relative">
                <select 
                    {...register('category')}
                    className="w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                    <option value="">Selecione...</option>
                    {(transactionType === 'income' ? incomeCategories : expenseCategories).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">expand_more</span>
            </div>
            {errors.category && <span className="text-xs text-warning animate-in slide-in-from-left-1">{errors.category.message}</span>}
        </div>

        {/* Month Selector (Smart Logic) */}
        {transactionType === 'income' && category === 'Mensalidade' && selectedStudentId && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
                <label className="text-xs font-bold text-neutral-gray uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    Meses a Pagar
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ACADEMIC_MONTHS.map((month) => {
                        const isPaid = students.find(s => s.id === selectedStudentId)?.paidMonths.includes(month);
                        return (
                            <label 
                                key={month} 
                                className={`
                                    flex items-center gap-2 p-2 rounded-lg border text-sm cursor-pointer transition-all
                                    ${isPaid 
                                        ? 'bg-green-50 border-green-100 text-green-700 opacity-60 cursor-not-allowed' 
                                        : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 hover:border-primary'}
                                `}
                            >
                                {isPaid ? (
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                ) : (
                                    <input 
                                        type="checkbox" 
                                        value={month} 
                                        {...register('selectedMonths')}
                                        className="rounded text-primary focus:ring-primary size-4" 
                                    />
                                )}
                                <span className="capitalize">{month}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Descrição <span className="text-warning">*</span></label>
          <input 
            {...register('description')}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="Ex: Mensalidade Outubro"
          />
          {errors.description && <span className="text-xs text-warning animate-in slide-in-from-left-1">{errors.description.message}</span>}
        </div>

        {/* Amount & Date Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Valor (MT) <span className="text-warning">*</span></label>
            <input 
              type="number"
              step="0.01"
              {...register('amount')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="0.00"
            />
            {errors.amount && <span className="text-xs text-warning animate-in slide-in-from-left-1">{errors.amount.message}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Data <span className="text-warning">*</span></label>
            <input 
              type="date"
              {...register('date')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Payment Method Row */}
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Forma de Pagamento <span className="text-warning">*</span></label>
            <div className="relative">
                <select 
                    {...register('paymentMethod')}
                    className="w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                    <option value="">Selecione...</option>
                    {PAYMENT_METHODS.map(method => (
                        <option key={method} value={method}>{method}</option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">expand_more</span>
            </div>
            {errors.paymentMethod && <span className="text-xs text-warning animate-in slide-in-from-left-1">{errors.paymentMethod.message}</span>}
        </div>

        {/* File Upload (Conditional UI) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider flex justify-between">
            Comprovativo / Fatura
            {transactionType === 'expense' ? (
                <span className="text-warning text-[10px] font-bold uppercase">Obrigatório para Saídas</span>
            ) : (
                <span className="text-neutral-gray/70 text-[10px] uppercase">Opcional</span>
            )}
          </label>
          
          <div className="relative group">
            <input 
                type="file" 
                {...register('attachment')}
                onChange={(e) => {
                    register('attachment').onChange(e);
                    handleFileChange(e);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                accept="image/*,.pdf"
            />
            <div className={`
                border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-all overflow-hidden relative
                ${errors.attachment 
                    ? 'border-warning bg-warning/5' 
                    : 'border-gray-300 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800'}
            `}>
                 {/* Image Preview if available */}
                 {attachmentBase64 && attachmentBase64.startsWith('data:image') ? (
                    <img src={attachmentBase64} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                 ) : null}

                 <span className={`material-symbols-outlined text-3xl mb-2 relative z-10 ${errors.attachment ? 'text-warning' : 'text-neutral-gray'}`}>
                    {fileName ? 'check_circle' : 'cloud_upload'}
                 </span>
                 <p className={`text-xs font-medium relative z-10 ${errors.attachment ? 'text-warning' : 'text-[#0d121b] dark:text-white'}`}>
                    {fileName || "Clique ou arraste para anexar"}
                 </p>
                 <p className="text-[10px] text-neutral-gray mt-1 relative z-10">PDF, PNG ou JPG (Máx. 5MB)</p>
            </div>
          </div>
          {errors.attachment && (
              <div className="flex items-center gap-1 text-warning animate-in slide-in-from-left-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span className="text-xs font-bold">{errors.attachment.message as string}</span>
              </div>
          )}
        </div>

        {/* Recurring Checkbox */}
        <label className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
            <input type="checkbox" {...register('isRecurring')} className="rounded text-primary focus:ring-primary" />
            <div className="flex flex-col">
                <span className="text-sm font-medium text-[#0d121b] dark:text-white">Repetir Mensalmente</span>
                <span className="text-xs text-neutral-gray">Cria uma recorrência automática desta transação.</span>
            </div>
        </label>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 right-0 w-full max-w-xl bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-end gap-3 z-50">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-neutral-gray hover:text-[#0d121b] transition-colors">Cancelar</button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`px-6 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors flex items-center gap-2 ${transactionType === 'income' ? 'bg-success hover:bg-green-700' : 'bg-warning hover:bg-red-700'} disabled:opacity-50`}
          >
            {isSubmitting ? (
                 <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Processando...
                 </>
            ) : (
                 <>
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Confirmar Transação
                 </>
            )}
          </button>
      </div>
    </form>
  );
};
