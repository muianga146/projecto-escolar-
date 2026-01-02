
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AVAILABLE_GRADES, CLASS_LETTERS, ACADEMIC_SHIFTS } from '../../lib/constants';

// --- Zod Schema ---
const studentFormSchema = z.object({
  personal: z.object({
    fullName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    dob: z.string().refine((val) => val !== '', "Data de nascimento é obrigatória"),
    gender: z.enum(['masculino', 'feminino']),
    documentId: z.string().min(2, "Nº de documento inválido"),
    nationality: z.string().min(2, "Nacionalidade obrigatória"),
    address: z.string().min(5, "Endereço completo é obrigatório"),
  }),
  academic: z.object({
    year: z.string(),
    grade: z.string().refine((val) => AVAILABLE_GRADES.includes(val as any), "Classe inválida"),
    classLetter: z.string().min(1, "Selecione uma turma"),
    shift: z.string().min(1, "Selecione um turno"),
    enrollmentDate: z.string(),
  }),
  guardians: z.object({
    fatherName: z.string().optional(),
    fatherPhone: z.string().optional(),
    motherName: z.string().min(3, "Nome da mãe é obrigatório"),
    motherPhone: z.string().min(8, "Contato válido é obrigatório"),
    financialResp: z.enum(['pai', 'mae', 'outro']),
    financialEmail: z.string().email("Email inválido para faturamento"),
  }),
  health: z.object({
    bloodType: z.string(),
    allergies: z.string().optional(),
  }),
});

export type StudentFormValues = z.infer<typeof studentFormSchema> & { avatarBase64?: string };

interface StudentFormProps {
  onSuccess: (data: StudentFormValues) => void;
  onCancel: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({ onSuccess, onCancel }) => {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      personal: { nationality: 'mocambicana', gender: 'masculino' },
      academic: { year: new Date().getFullYear().toString(), grade: '1ª Classe', shift: 'manha', enrollmentDate: new Date().toISOString().split('T')[0] },
      guardians: { financialResp: 'pai' },
      health: { bloodType: 'O+' },
    },
  });

  const onSubmit = async (data: StudentFormValues) => {
    // Pass the base64 image along with data
    const finalData = { ...data, avatarBase64: avatarPreview || undefined };
    await new Promise((resolve) => setTimeout(resolve, 800));
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
      
      {/* --- Section 1: Dados do Aluno --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">person</span>
          </div>
          <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">Dados do Aluno</h3>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <label className="relative group cursor-pointer">
              <div className={`size-32 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 transition-colors group-hover:border-primary ${avatarPreview ? 'border-solid border-primary' : ''}`}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="size-full object-cover" />
                ) : (
                  <div className="text-center text-neutral-gray p-2">
                    <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                    <p className="text-[10px] uppercase font-bold">Foto</p>
                  </div>
                )}
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 shadow-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-sm">edit</span>
              </div>
            </label>
          </div>

          {/* Personal Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <FormItem label="Nome Completo" error={errors.personal?.fullName?.message} fullWidth>
              <Input {...register('personal.fullName')} placeholder="Ex: Cleyton Muianga" />
            </FormItem>

            <FormItem label="Data de Nascimento" error={errors.personal?.dob?.message}>
              <Input type="date" {...register('personal.dob')} />
            </FormItem>

            <FormItem label="Gênero" error={errors.personal?.gender?.message}>
              <Select {...register('personal.gender')}>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </Select>
            </FormItem>

            <FormItem label="Documento (BI/Cédula)" error={errors.personal?.documentId?.message}>
              <Input {...register('personal.documentId')} placeholder="Ex: 110023004B" />
            </FormItem>

            <FormItem label="Nacionalidade" error={errors.personal?.nationality?.message}>
              <Select {...register('personal.nationality')}>
                <option value="mocambicana">Moçambicana</option>
                <option value="estrangeira">Estrangeira</option>
              </Select>
            </FormItem>

            <FormItem label="Endereço Completo" error={errors.personal?.address?.message} fullWidth>
              <textarea 
                {...register('personal.address')}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px]"
                placeholder="Av. Julius Nyerere, nº 123, Bairro Polana..."
              />
            </FormItem>
          </div>
        </div>
      </section>

      {/* --- Section 2: Informação Acadêmica --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
           <div className="size-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined">school</span>
          </div>
          <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">Informação Acadêmica</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Ano Letivo">
            <Select {...register('academic.year')}>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </Select>
          </FormItem>

          <FormItem label="Classe (Nível)" error={errors.academic?.grade?.message}>
            <Select {...register('academic.grade')}>
              {AVAILABLE_GRADES.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
              ))}
            </Select>
          </FormItem>

          <FormItem label="Turma" error={errors.academic?.classLetter?.message}>
            <Select {...register('academic.classLetter')}>
              <option value="">Selecione...</option>
              {CLASS_LETTERS.map(letter => (
                  <option key={letter} value={letter}>Turma {letter}</option>
              ))}
            </Select>
          </FormItem>

          <FormItem label="Turno" error={errors.academic?.shift?.message}>
            <Select {...register('academic.shift')}>
                {ACADEMIC_SHIFTS.map(shift => (
                    <option key={shift.value} value={shift.value}>{shift.label}</option>
                ))}
            </Select>
          </FormItem>

          <FormItem label="Data de Matrícula">
            <Input type="date" {...register('academic.enrollmentDate')} />
          </FormItem>
        </div>
      </section>

      {/* --- Section 3: Encarregados (Critical) --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
           <div className="size-8 rounded-lg bg-yellow-100 text-yellow-700 flex items-center justify-center">
            <span className="material-symbols-outlined">family_restroom</span>
          </div>
          <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">Dados dos Encarregados</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
            {/* Father */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-neutral-gray uppercase">Pai</h4>
                <FormItem label="Nome do Pai">
                    <Input {...register('guardians.fatherName')} />
                </FormItem>
                <FormItem label="Contato">
                    <Input {...register('guardians.fatherPhone')} placeholder="+258..." />
                </FormItem>
            </div>
            
            {/* Mother */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-neutral-gray uppercase">Mãe</h4>
                <FormItem label="Nome da Mãe" error={errors.guardians?.motherName?.message}>
                    <Input {...register('guardians.motherName')} />
                </FormItem>
                <FormItem label="Contato" error={errors.guardians?.motherPhone?.message}>
                    <Input {...register('guardians.motherPhone')} placeholder="+258..." />
                </FormItem>
            </div>

            {/* Financial Resp */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
                <FormItem label="Responsável Financeiro">
                    <Select {...register('guardians.financialResp')}>
                        <option value="pai">Pai</option>
                        <option value="mae">Mãe</option>
                        <option value="outro">Outro</option>
                    </Select>
                </FormItem>
                <FormItem label="Email para Faturas" error={errors.guardians?.financialEmail?.message}>
                    <Input {...register('guardians.financialEmail')} type="email" placeholder="exemplo@email.com" />
                </FormItem>
            </div>
        </div>
      </section>

      {/* --- Section 4: Saúde --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
           <div className="size-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
            <span className="material-symbols-outlined">medical_services</span>
          </div>
          <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">Saúde e Observações</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem label="Grupo Sanguíneo">
                <Select {...register('health.bloodType')}>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                </Select>
            </FormItem>
            <FormItem label="Alergias / Condições">
                <Input {...register('health.allergies')} placeholder="Ex: Rinite, Alergia a Amendoim" />
            </FormItem>
        </div>
      </section>

      {/* --- Sticky Footer Actions --- */}
      <div className="fixed bottom-0 right-0 w-full max-w-xl bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-end gap-3 z-50">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-neutral-gray hover:text-[#0d121b] transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
                <>
                    <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                    Salvando...
                </>
            ) : (
                <>
                    <span className="material-symbols-outlined text-sm">save</span>
                    Salvar Matrícula
                </>
            )}
          </button>
      </div>
    </form>
  );
};

// --- Reusable UI Wrappers ---

const FormItem: React.FC<{ label: string; error?: string; children: React.ReactNode; fullWidth?: boolean }> = ({ label, error, children, fullWidth }) => (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'md:col-span-2' : ''}`}>
        <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">{label}</label>
        {children}
        {error && <span className="text-xs font-medium text-warning animate-in slide-in-from-left-1">{error}</span>}
    </div>
);

// Forward Ref for Inputs to work with React Hook Form
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
    <input 
        ref={ref}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
        {...props}
    />
));
Input.displayName = "Input";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>((props, ref) => (
    <div className="relative">
        <select 
            ref={ref}
            className="w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            {...props}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">
            expand_more
        </span>
    </div>
));
Select.displayName = "Select";
