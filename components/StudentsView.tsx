
import React, { useState, useMemo } from 'react';
import { Student, GradeLevel } from '../types';
import { StudentForm, StudentFormValues } from './students/StudentForm';
import { useSchoolData } from '../contexts/SchoolDataContext';

export const StudentsView: React.FC = () => {
  const { students, addStudent } = useSchoolData();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'guardians' | 'health'>('personal');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Filtering Logic ---
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const lowerTerm = searchTerm.toLowerCase();
    return students.filter(student => 
      student.name.toLowerCase().includes(lowerTerm) ||
      student.enrollmentId.toLowerCase().includes(lowerTerm) ||
      student.grade.toLowerCase().includes(lowerTerm)
    );
  }, [students, searchTerm]);

  // --- Actions ---

  const openSheet = (student: Student | null) => {
    if (!student) {
      setIsCreatingNew(true);
      setSelectedStudent(null);
    } else {
      setSelectedStudent(student);
      setActiveTab('personal');
      setIsCreatingNew(false);
    }
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setTimeout(() => {
        setSelectedStudent(null);
        setIsCreatingNew(false);
    }, 300);
  };

  const handleExportCSV = () => {
    const headers = ["ID Matrícula", "Nome", "Email", "Classe", "Status Financeiro", "Status Acadêmico", "Responsável"];
    const csvContent = [
      headers.join(","),
      ...filteredStudents.map(s => {
        const guardianName = s.guardians.financialResponsible === 'Father' ? s.guardians.father.name : s.guardians.mother.name;
        // Escape quotes and wrap strings in quotes to handle commas within data
        return [
          `"${s.enrollmentId}"`,
          `"${s.name}"`,
          `"${s.email}"`,
          `"${s.grade}"`,
          `"${s.financialStatus}"`,
          `"${s.status}"`,
          `"${guardianName}"`
        ].join(",");
      })
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'alunos-seiva-data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddNewStudent = (formData: StudentFormValues) => {
    const newStudent: Student = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.personal.fullName,
        email: `${formData.personal.fullName.split(' ')[0].toLowerCase()}@student.seiva.mz`,
        // Use the uploaded base64 avatar if present, otherwise fallback to UI Avatars
        avatar: formData.avatarBase64 || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.personal.fullName)}&background=random`,
        enrollmentId: `#${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        grade: formData.academic.grade as GradeLevel,
        balance: 0,
        status: 'active',
        financialStatus: 'pending',
        paidMonths: [],
        personal: {
            dob: formData.personal.dob,
            gender: formData.personal.gender === 'masculino' ? 'M' : 'F',
            nationality: formData.personal.nationality,
            biNumber: formData.personal.documentId,
            address: formData.personal.address,
            city: 'Maputo' // Defaulting for now
        },
        academic: {
            enrollmentDate: formData.academic.enrollmentDate,
            prevSchool: '',
            submittedDocs: []
        },
        guardians: {
            father: { 
                name: formData.guardians.fatherName || '', 
                phone: formData.guardians.fatherPhone || '', 
                email: '', 
                profession: '' 
            },
            mother: { 
                name: formData.guardians.motherName, 
                phone: formData.guardians.motherPhone, 
                email: '', 
                profession: '' 
            },
            emergency: { 
                name: formData.guardians.motherName, 
                relation: 'Mãe', 
                phone: formData.guardians.motherPhone 
            },
            financialResponsible: formData.guardians.financialResp === 'pai' ? 'Father' : formData.guardians.financialResp === 'mae' ? 'Mother' : 'Other'
        },
        health: {
            bloodType: formData.health.bloodType,
            allergies: formData.health.allergies || '',
            conditions: '',
            notes: ''
        }
    };

    addStudent(newStudent);
    closeSheet();
    
    // Show Toast
    setToastMessage(`Aluno ${newStudent.name} matriculado com sucesso!`);
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

      {/* 1. Header & Stats */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0d121b] dark:text-white">Gestão de Alunos</h2>
            <div className="flex items-center gap-2 text-sm text-neutral-gray mt-1">
              <span>Home</span>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span>Alunos</span>
            </div>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={handleExportCSV}
                className="px-4 py-2 text-sm font-medium text-neutral-gray bg-white dark:bg-surface-dark border border-[#e7ebf3] dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
             >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Exportar CSV
             </button>
             <button 
                onClick={() => openSheet(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-sm"
             >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Nova Matrícula
             </button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard label="Total de Alunos" value={students.length.toString()} icon="groups" color="text-primary" />
            <StatCard label="Novas Matrículas" value={students.filter(s => new Date(s.academic.enrollmentDate).getMonth() === new Date().getMonth()).length.toString()} sub="Este Mês" icon="person_add" color="text-success" />
        </div>
      </div>

      {/* 2. Toolbar & Filters */}
      <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-[#e7ebf3] dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
         <div className="relative w-full sm:w-96">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-gray text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Buscar por nome, matrícula ou classe..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background-light dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 border focus:border-primary rounded-lg text-sm transition-all outline-none"
            />
         </div>
         <div className="flex w-full sm:w-auto gap-3 overflow-x-auto pb-1 sm:pb-0">
            <select className="px-3 py-2 bg-background-light dark:bg-gray-800 rounded-lg text-sm border-transparent focus:border-primary outline-none cursor-pointer min-w-[140px]">
                <option value="">Todas as Classes</option>
                <option value="6a">6ª Classe</option>
                <option value="1a">1ª Classe</option>
            </select>
            <select className="px-3 py-2 bg-background-light dark:bg-gray-800 rounded-lg text-sm border-transparent focus:border-primary outline-none cursor-pointer min-w-[140px]">
                <option value="">Status: Todos</option>
                <option value="active">Ativo</option>
                <option value="suspended">Suspenso</option>
            </select>
         </div>
      </div>

      {/* 3. The Data Table */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-[#e7ebf3] dark:border-gray-700 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#e7ebf3] dark:border-gray-800">
                        <th className="py-4 px-6 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Aluno</th>
                        <th className="py-4 px-6 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Matrícula</th>
                        <th className="py-4 px-6 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Classe</th>
                        <th className="py-4 px-6 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Responsável</th>
                        <th className="py-4 px-6 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Status Financeiro</th>
                        <th className="py-4 px-6 text-xs font-semibold text-neutral-gray uppercase tracking-wider">Status Acadêmico</th>
                        <th className="py-4 px-6 text-xs font-semibold text-neutral-gray uppercase tracking-wider text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#e7ebf3] dark:divide-gray-800">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                            <tr 
                                key={student.id} 
                                onClick={() => openSheet(student)}
                                className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                            >
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <img src={student.avatar} alt={student.name} className="size-10 rounded-full object-cover border border-gray-100 dark:border-gray-700" />
                                        <div>
                                            <p className="text-sm font-semibold text-[#0d121b] dark:text-white">{student.name}</p>
                                            <p className="text-xs text-neutral-gray">{student.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-sm font-medium text-neutral-gray">{student.enrollmentId}</td>
                                <td className="py-4 px-6 text-sm text-[#0d121b] dark:text-white">{student.grade}</td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2 group/guardian">
                                        <span className="text-sm text-[#0d121b] dark:text-white">{student.guardians.financialResponsible === 'Father' ? student.guardians.father.name : student.guardians.mother.name}</span>
                                        <span 
                                            className="material-symbols-outlined text-neutral-gray text-[16px] opacity-0 group-hover/guardian:opacity-100 transition-opacity" 
                                            title={student.guardians.father.phone}
                                        >
                                            call
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <StatusBadge status={student.financialStatus} type="financial" />
                                </td>
                                <td className="py-4 px-6">
                                    <StatusBadge status={student.status} type="academic" />
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-neutral-gray transition-colors">
                                        <span className="material-symbols-outlined">more_horiz</span>
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7} className="py-12 text-center text-neutral-gray">
                                <div className="flex flex-col items-center gap-2">
                                    <span className="material-symbols-outlined text-4xl opacity-50">search_off</span>
                                    <p>Nenhum aluno encontrado.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* 4. Slide-over Sheet Details */}
      {isSheetOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                onClick={closeSheet}
              ></div>
              
              {/* Panel */}
              <div className="relative w-full max-w-xl bg-surface-light dark:bg-surface-dark shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                  {/* Sheet Header */}
                  <div className="p-6 border-b border-[#e7ebf3] dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-4">
                        {!isCreatingNew && selectedStudent ? (
                            <img src={selectedStudent.avatar} alt="Avatar" className="size-16 rounded-full border-2 border-white dark:border-gray-700 shadow-sm object-cover" />
                        ) : (
                            <div className="size-16 rounded-full bg-primary/10 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm">
                                <span className="material-symbols-outlined text-3xl text-primary dark:text-gray-400">{isCreatingNew ? 'person_add' : 'person'}</span>
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-[#0d121b] dark:text-white">
                                {isCreatingNew ? 'Nova Matrícula' : selectedStudent?.name}
                            </h2>
                            <p className="text-sm text-neutral-gray">
                                {isCreatingNew ? 'Preencha os dados do novo estudante' : `Matrícula: ${selectedStudent?.enrollmentId} • ${selectedStudent?.grade}`}
                            </p>
                        </div>
                      </div>
                      <button onClick={closeSheet} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                          <span className="material-symbols-outlined text-neutral-gray">close</span>
                      </button>
                  </div>

                  {/* Render Student Form OR Tabs for Existing Student */}
                  {isCreatingNew ? (
                    <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                        <StudentForm onSuccess={handleAddNewStudent} onCancel={closeSheet} />
                    </div>
                  ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex border-b border-[#e7ebf3] dark:border-gray-800 px-6 gap-6">
                            {['personal', 'academic', 'guardians', 'health'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === tab 
                                        ? 'border-primary text-primary' 
                                        : 'border-transparent text-neutral-gray hover:text-[#0d121b] dark:hover:text-white'
                                    }`}
                                >
                                    {tab === 'personal' && 'Dados Pessoais'}
                                    {tab === 'academic' && 'Acadêmico'}
                                    {tab === 'guardians' && 'Encarregados'}
                                    {tab === 'health' && 'Saúde & Obs'}
                                </button>
                            ))}
                        </div>

                        {/* Sheet Content (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {selectedStudent && (
                                <div className="space-y-6">
                                    {activeTab === 'personal' && <PersonalTab student={selectedStudent} />}
                                    {activeTab === 'academic' && <AcademicTab student={selectedStudent} />}
                                    {activeTab === 'guardians' && <GuardiansTab student={selectedStudent} />}
                                    {activeTab === 'health' && <HealthTab student={selectedStudent} />}
                                </div>
                            )}
                        </div>

                         {/* Sheet Footer */}
                         <div className="p-6 border-t border-[#e7ebf3] dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                            <button onClick={closeSheet} className="px-4 py-2 text-sm font-medium text-neutral-gray hover:text-[#0d121b] transition-colors">Cancelar</button>
                            <button className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark shadow-sm transition-colors">
                                Salvar Alterações
                            </button>
                        </div>
                    </>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

// --- Sub-components for Cleanliness ---

const StatCard: React.FC<{ label: string; value: string; sub?: string; icon: string; color: string }> = ({ label, value, sub, icon, color }) => (
    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-[#e7ebf3] dark:border-gray-700 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-sm text-neutral-gray font-medium">{label}</p>
            <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-[#0d121b] dark:text-white">{value}</span>
                {sub && <span className="text-xs text-neutral-gray">{sub}</span>}
            </div>
        </div>
        <div className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-800 ${color}`}>
            <span className="material-symbols-outlined">{icon}</span>
        </div>
    </div>
);

const StatusBadge: React.FC<{ status: string; type: 'financial' | 'academic' }> = ({ status, type }) => {
    let classes = '';
    let label = '';

    if (type === 'financial') {
        switch(status) {
            case 'paid': classes = 'bg-success/10 text-success border-success/20'; label = 'Em dia'; break;
            case 'late': classes = 'bg-warning/10 text-warning border-warning/20'; label = 'Inadimplente'; break;
            case 'pending': classes = 'bg-yellow-100 text-yellow-700 border-yellow-200'; label = 'Pendente'; break;
        }
    } else {
        switch(status) {
            case 'active': classes = 'bg-success/10 text-success border-success/20'; label = 'Ativo'; break;
            case 'suspended': classes = 'bg-gray-100 text-gray-600 border-gray-200'; label = 'Suspenso'; break;
            case 'transferred': classes = 'bg-blue-50 text-blue-600 border-blue-100'; label = 'Transferido'; break;
        }
    }

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${classes}`}>
            {label}
        </span>
    );
};

// --- Tab Components ---

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">{label}</label>
        <input 
            type="text" 
            defaultValue={value} 
            className="w-full px-3 py-2 bg-background-light dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-[#0d121b] dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
        />
    </div>
);

const PersonalTab: React.FC<{ student: Student }> = ({ student }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Nome Completo" value={student.name} />
        <Field label="Data de Nascimento" value={student.personal.dob} />
        <Field label="Gênero" value={student.personal.gender === 'M' ? 'Masculino' : 'Feminino'} />
        <Field label="Nacionalidade" value={student.personal.nationality} />
        <Field label="Nº BI / Passaporte" value={student.personal.biNumber} />
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Endereço Residencial" value={student.personal.address} />
            <Field label="Cidade" value={student.personal.city} />
        </div>
    </div>
);

const AcademicTab: React.FC<{ student: Student }> = ({ student }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Classe Atual" value={student.grade} />
            <Field label="Data de Matrícula" value={student.academic.enrollmentDate} />
            <Field label="Escola Anterior" value={student.academic.prevSchool} />
        </div>
        <div>
            <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider block mb-3">Documentos Entregues</label>
            <div className="flex flex-wrap gap-3">
                {['Certificado', 'Fotos', 'BI', 'Atestado Médico'].map((doc) => (
                    <label key={doc} className="flex items-center gap-2 p-3 border border-[#e7ebf3] dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <input 
                            type="checkbox" 
                            defaultChecked={student.academic.submittedDocs.includes(doc)}
                            className="text-primary rounded focus:ring-primary"
                        />
                        <span className="text-sm font-medium">{doc}</span>
                    </label>
                ))}
            </div>
        </div>
    </div>
);

const GuardiansTab: React.FC<{ student: Student }> = ({ student }) => (
    <div className="space-y-8">
        <div>
            <h4 className="text-sm font-bold text-primary mb-4 border-b border-gray-100 pb-2">Pai</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome" value={student.guardians.father.name} />
                <Field label="Profissão" value={student.guardians.father.profession} />
                <Field label="Telefone" value={student.guardians.father.phone} />
                <Field label="Email" value={student.guardians.father.email} />
            </div>
        </div>
        <div>
            <h4 className="text-sm font-bold text-primary mb-4 border-b border-gray-100 pb-2">Mãe</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome" value={student.guardians.mother.name} />
                <Field label="Profissão" value={student.guardians.mother.profession} />
                <Field label="Telefone" value={student.guardians.mother.phone} />
                <Field label="Email" value={student.guardians.mother.email} />
            </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900/20">
             <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-500 mb-2">Contato de Emergência</h4>
             <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-sm">{student.guardians.emergency.name} ({student.guardians.emergency.relation})</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#0d121b] dark:text-white">
                    <span className="material-symbols-outlined text-[18px]">call</span>
                    {student.guardians.emergency.phone}
                </div>
             </div>
        </div>
    </div>
);

const HealthTab: React.FC<{ student: Student }> = ({ student }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Tipo Sanguíneo" value={student.health.bloodType} />
            <Field label="Alergias" value={student.health.allergies} />
        </div>
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Condições Especiais</label>
            <textarea 
                defaultValue={student.health.conditions} 
                className="w-full px-3 py-2 bg-background-light dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none min-h-[80px]"
            />
        </div>
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-neutral-gray uppercase tracking-wider">Observações Internas</label>
            <textarea 
                defaultValue={student.health.notes} 
                className="w-full px-3 py-2 bg-background-light dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none min-h-[100px]"
            />
        </div>
    </div>
);
