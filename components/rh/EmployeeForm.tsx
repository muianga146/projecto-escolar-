
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const employeeSchema = z.object({
  personal: z.object({
    fullName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    dob: z.string().min(1, "Data de nascimento obrigatória"),
    biNumber: z.string().min(5, "Número de BI inválido"),
    nuit: z.string().min(9, "NUIT deve ter 9 dígitos").max(9),
    email: z.string().email("Email inválido"),
    phone: z.string().min(9, "Telefone inválido"),
  }),
  contract: z.object({
    department: z.string().min(1, "Selecione um departamento"),
    role: z.string().min(2, "Cargo é obrigatório"),
    contractType: z.enum(['Tempo Integral', 'Tempo Parcial', 'Prestador de Serviço']),
    admissionDate: z.string().min(1, "Data de admissão obrigatória"),
    baseSalary: z.string().refine((val) => Number(val) > 0, "Salário deve ser maior que 0"),
  }),
  bank: z.object({
    bankName: z.string().min(2, "Nome do banco obrigatório"),
    accountNumber: z.string().min(5, "Número de conta obrigatório"),
    nib: z.string().min(21, "NIB deve ter 21 dígitos"),
  }),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema> & { avatarBase64?: string };

interface EmployeeFormProps {
  onSuccess: (data: EmployeeFormValues) => void;
  onCancel: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSuccess, onCancel }) => {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      contract: { contractType: 'Tempo Integral' },
    }
  });

  const onSubmit = async (data: EmployeeFormValues) => {
    // Pass avatar along with data
    const finalData = { ...data, avatarBase64: avatarPreview || undefined };
    await new Promise(resolve => setTimeout(resolve, 500));
    onSuccess(finalData);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-20">
      
      {/* 1. Dados Pessoais */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
           <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">person</span>
          </div>
          <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">Dados Pessoais</h3>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
             {/* Avatar Upload */}
             <div className="flex flex-col items-center gap-3">
                <label className="relative group cursor-pointer">
                <div className={`size-28 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 transition-colors group-hover:border-primary ${avatarPreview ? 'border-solid border-primary' : ''}`}>
                    {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="size-full object-cover" />
                    ) : (
                    <div className="text-center text-neutral-gray p-2">
                        <span className="material-symbols-outlined text-2xl mb-1">add_a_photo</span>
                    </div>
                    )}
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 shadow-md group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xs">edit</span>
                </div>
                </label>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Nome Completo</label>
                    <input {...register('personal.fullName')} className="input-base" placeholder="Ex: Ricardo Mendes" />
                    {errors.personal?.fullName && <span className="text-xs text-warning">{errors.personal.fullName.message}</span>}
                </div>
                
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Email</label>
                    <input {...register('personal.email')} type="email" className="input-base" placeholder="email@seiva.mz" />
                    {errors.personal?.email && <span className="text-xs text-warning">{errors.personal.email.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Telefone</label>
                    <input {...register('personal.phone')} className="input-base" placeholder="+258..." />
                    {errors.personal?.phone && <span className="text-xs text-warning">{errors.personal.phone.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Nº BI</label>
                    <input {...register('personal.biNumber')} className="input-base" />
                    {errors.personal?.biNumber && <span className="text-xs text-warning">{errors.personal.biNumber.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">NUIT</label>
                    <input {...register('personal.nuit')} className="input-base" placeholder="123456789" />
                    {errors.personal?.nuit && <span className="text-xs text-warning">{errors.personal.nuit.message}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Data de Nascimento</label>
                    <input type="date" {...register('personal.dob')} className="input-base" />
                    {errors.personal?.dob && <span className="text-xs text-warning">{errors.personal.dob.message}</span>}
                </div>
             </div>
        </div>
      </section>

      {/* 2. Dados Contratuais */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
           <div className="size-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined">work</span>
          </div>
          <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">Dados Contratuais</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Departamento</label>
                <div className="relative">
                    <select {...register('contract.department')} className="input-base appearance-none">
                        <option value="">Selecione...</option>
                        <option value="Docentes">Docentes</option>
                        <option value="Administrativo">Administrativo</option>
                        <option value="Serviços Gerais">Serviços Gerais</option>
                        <option value="Segurança">Segurança</option>
                        <option value="Direção">Direção</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">expand_more</span>
                </div>
                 {errors.contract?.department && <span className="text-xs text-warning">{errors.contract.department.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Cargo</label>
                <input {...register('contract.role')} className="input-base" placeholder="Ex: Professor de História" />
                 {errors.contract?.role && <span className="text-xs text-warning">{errors.contract.role.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Tipo de Contrato</label>
                <div className="relative">
                    <select {...register('contract.contractType')} className="input-base appearance-none">
                        <option value="Tempo Integral">Tempo Integral</option>
                        <option value="Tempo Parcial">Tempo Parcial</option>
                        <option value="Prestador de Serviço">Prestador de Serviço</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">expand_more</span>
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Data de Admissão</label>
                <input type="date" {...register('contract.admissionDate')} className="input-base" />
                 {errors.contract?.admissionDate && <span className="text-xs text-warning">{errors.contract.admissionDate.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Salário Base (MT)</label>
                <input type="number" {...register('contract.baseSalary')} className="input-base" placeholder="0.00" />
                 {errors.contract?.baseSalary && <span className="text-xs text-warning">{errors.contract.baseSalary.message}</span>}
            </div>
        </div>
      </section>

      {/* 3. Dados Bancários */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
           <div className="size-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
            <span className="material-symbols-outlined">account_balance</span>
          </div>
          <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">Dados Bancários</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Banco</label>
                <input {...register('bank.bankName')} className="input-base" placeholder="Ex: Millennium Bim" />
                 {errors.bank?.bankName && <span className="text-xs text-warning">{errors.bank.bankName.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Número da Conta</label>
                <input {...register('bank.accountNumber')} className="input-base" />
                 {errors.bank?.accountNumber && <span className="text-xs text-warning">{errors.bank.accountNumber.message}</span>}
            </div>
            <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">NIB</label>
                <input {...register('bank.nib')} className="input-base" placeholder="0001..." />
                 {errors.bank?.nib && <span className="text-xs text-warning">{errors.bank.nib.message}</span>}
            </div>
        </div>
      </section>

      {/* Footer */}
      <div className="fixed bottom-0 right-0 w-full max-w-xl bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-end gap-3 z-50">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-neutral-gray hover:text-[#0d121b] transition-colors">Cancelar</button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
                 <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Processando...
                 </>
            ) : (
                'Salvar Colaborador'
            )}
          </button>
      </div>

      <style>{`
        .input-base {
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
            background-color: white;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            outline: none;
            transition: all 0.2s;
        }
        .dark .input-base {
            border-color: #374151;
            background-color: #1f2937;
            color: white;
        }
        .input-base:focus {
            ring: 2px solid #1152d4;
            border-color: transparent;
        }
      `}</style>
    </form>
  );
};
