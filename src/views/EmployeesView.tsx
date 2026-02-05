import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Mail,
  Phone,
  MoreVertical,
  Star,
  Briefcase,
  Clock3,
  Fingerprint,
  KeyRound,
  ListChecks,
  MapPin,
  Target,
  Trash2,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Employee, EmployeeObjective, EmployeeRole } from '../types';

const uid = () => Math.random().toString(36).slice(2, 9);

const statusColors: Record<Employee['status'], string> = {
  Ativo: 'bg-green-500',
  Inativo: 'bg-red-500',
  Ausente: 'bg-orange-500',
};

type EmployeeSheetTab = 'perfil' | 'operacao' | 'missao';

const toTaskText = (tasks: string[] = []) => tasks.join('\n');

const fromTaskText = (raw: string) =>
  raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

const createEmptyObjective = (): EmployeeObjective => ({
  id: uid(),
  title: '',
  metric: '',
  targetValue: 0,
  currentValue: 0,
  unit: '',
  dueDate: '',
});

const normalizeObjectives = (objectives: EmployeeObjective[]) =>
  objectives
    .map(objective => ({
      ...objective,
      title: objective.title.trim(),
      metric: objective.metric.trim(),
      targetValue: Number.isFinite(Number(objective.targetValue)) ? Number(objective.targetValue) : 0,
      currentValue: Number.isFinite(Number(objective.currentValue)) ? Number(objective.currentValue) : 0,
      unit: objective.unit?.trim() || undefined,
      dueDate: objective.dueDate || undefined,
    }))
    .filter(objective => objective.title || objective.metric || objective.targetValue > 0 || objective.currentValue > 0);

const EmployeeCard: React.FC<{ employee: Employee; onOpen: (employee: Employee) => void }> = ({ employee, onOpen }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-xl hover:border-blue-100 transition-all group">
    <div className="flex justify-between items-start mb-6">
      <div className="relative">
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.avatarSeed}`}
          className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 shadow-inner group-hover:scale-105 transition-transform"
          alt={employee.name}
        />
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-4 border-white rounded-full ${statusColors[employee.status]}`} />
      </div>
      <button
        onClick={() => onOpen(employee)}
        className="text-gray-300 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-xl transition"
        type="button"
        aria-label="Abrir ficha do funcionário"
      >
        <MoreVertical size={20} />
      </button>
    </div>

    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-gray-900 leading-tight">{employee.name}</h3>
        <p className="text-blue-600 text-xs font-black uppercase tracking-widest mt-1 flex items-center gap-1">
          <Briefcase size={12} /> {employee.role}
        </p>
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Mail size={14} className="text-gray-300" /> {employee.email}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Phone size={14} className="text-gray-300" /> {employee.phone || 'Sem telemóvel'}
        </div>
      </div>

      <div className="pt-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold text-gray-700">Senior</span>
        </div>
        <button
          onClick={() => onOpen(employee)}
          type="button"
          className="text-[10px] text-blue-600 font-black uppercase tracking-widest hover:text-blue-700 transition"
        >
          Abrir Ficha
        </button>
      </div>
    </div>
  </div>
);

const EmployeesView = () => {
  const { employees, addEmployee, updateEmployee } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeSheetTab, setActiveSheetTab] = useState<EmployeeSheetTab>('perfil');

  const [searchTerm, setSearchTerm] = useState('');
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [sheetSuccess, setSheetSuccess] = useState<string | null>(null);

  // Create form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(EmployeeRole.CONSULTANT);
  const [createWorkSchedule, setCreateWorkSchedule] = useState('');
  const [createWorkLocation, setCreateWorkLocation] = useState('');
  const [createAccessPassword, setCreateAccessPassword] = useState('');
  const [createPin, setCreatePin] = useState('');

  // Sheet form
  const [sheetName, setSheetName] = useState('');
  const [sheetEmail, setSheetEmail] = useState('');
  const [sheetPhone, setSheetPhone] = useState('');
  const [sheetRole, setSheetRole] = useState(EmployeeRole.CONSULTANT);
  const [sheetStatus, setSheetStatus] = useState<Employee['status']>('Ativo');
  const [sheetPrimaryTasks, setSheetPrimaryTasks] = useState('');
  const [sheetSecondaryTasks, setSheetSecondaryTasks] = useState('');
  const [sheetWorkSchedule, setSheetWorkSchedule] = useState('');
  const [sheetWorkLocation, setSheetWorkLocation] = useState('');
  const [sheetAccessPassword, setSheetAccessPassword] = useState('');
  const [sheetPin, setSheetPin] = useState('');
  const [sheetMission, setSheetMission] = useState('');
  const [sheetObjectives, setSheetObjectives] = useState<EmployeeObjective[]>([]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return employees;

    return employees.filter(employee => {
      const taskMatch = [...(employee.primaryTasks || []), ...(employee.secondaryTasks || [])].some(task =>
        task.toLowerCase().includes(term),
      );
      const objectiveMatch = (employee.measurableObjectives || []).some(objective =>
        `${objective.title} ${objective.metric}`.toLowerCase().includes(term),
      );

      return (
        employee.name.toLowerCase().includes(term) ||
        employee.role.toLowerCase().includes(term) ||
        (employee.workLocation || '').toLowerCase().includes(term) ||
        (employee.mission || '').toLowerCase().includes(term) ||
        taskMatch ||
        objectiveMatch
      );
    });
  }, [employees, searchTerm]);

  const resetCreateForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setRole(EmployeeRole.CONSULTANT);
    setCreateWorkSchedule('');
    setCreateWorkLocation('');
    setCreateAccessPassword('');
    setCreatePin('');
  };

  const openEmployeeSheet = (employee: Employee) => {
    setSelectedEmployee(employee);
    setActiveSheetTab('perfil');
    setSheetError(null);
    setSheetSuccess(null);

    setSheetName(employee.name);
    setSheetEmail(employee.email);
    setSheetPhone(employee.phone || '');
    setSheetRole(employee.role);
    setSheetStatus(employee.status);
    setSheetPrimaryTasks(toTaskText(employee.primaryTasks));
    setSheetSecondaryTasks(toTaskText(employee.secondaryTasks));
    setSheetWorkSchedule(employee.workSchedule || '');
    setSheetWorkLocation(employee.workLocation || '');
    setSheetAccessPassword(employee.accessPassword || '');
    setSheetPin(employee.timeClockPin || '');
    setSheetMission(employee.mission || '');
    setSheetObjectives((employee.measurableObjectives || []).map(objective => ({ ...objective })));
  };

  const closeEmployeeSheet = () => {
    setSelectedEmployee(null);
    setSheetError(null);
    setSheetSuccess(null);
  };

  const handleCreateEmployee = async (event: React.FormEvent) => {
    event.preventDefault();

    const newEmployee: Employee = {
      id: uid(),
      name,
      email,
      phone,
      role,
      status: 'Ativo',
      avatarSeed: name,
      joinedAt: new Date().toISOString(),
      primaryTasks: [],
      secondaryTasks: [],
      workSchedule: createWorkSchedule || undefined,
      workLocation: createWorkLocation || undefined,
      accessPassword: createAccessPassword || undefined,
      timeClockPin: createPin || undefined,
      timeClockEntries: [],
      mission: undefined,
      measurableObjectives: [],
    };

    await addEmployee(newEmployee);
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  const handleSaveEmployeeSheet = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedEmployee) return;

    const primaryTasks = fromTaskText(sheetPrimaryTasks);
    const secondaryTasks = fromTaskText(sheetSecondaryTasks);
    const objectives = normalizeObjectives(sheetObjectives);

    const updates: Partial<Employee> = {
      name: sheetName,
      email: sheetEmail,
      phone: sheetPhone,
      role: sheetRole,
      status: sheetStatus,
      avatarSeed: sheetName || selectedEmployee.avatarSeed,
      primaryTasks,
      secondaryTasks,
      workSchedule: sheetWorkSchedule || undefined,
      workLocation: sheetWorkLocation || undefined,
      accessPassword: sheetAccessPassword || undefined,
      timeClockPin: sheetPin || undefined,
      mission: sheetMission.trim() || undefined,
      measurableObjectives: objectives,
    };

    try {
      await updateEmployee(selectedEmployee.id, updates);
      setSelectedEmployee(prev =>
        prev
          ? {
              ...prev,
              ...updates,
              primaryTasks,
              secondaryTasks,
              mission: sheetMission.trim() || undefined,
              measurableObjectives: objectives,
            }
          : prev,
      );
      setSheetSuccess('Ficha da equipa atualizada com sucesso.');
      setSheetError(null);
    } catch (error) {
      console.error(error);
      setSheetError('Não foi possível guardar as alterações da ficha.');
      setSheetSuccess(null);
    }
  };

  const addObjective = () => {
    setSheetObjectives(prev => [...prev, createEmptyObjective()]);
  };

  const removeObjective = (objectiveId: string) => {
    setSheetObjectives(prev => prev.filter(objective => objective.id !== objectiveId));
  };

  const updateObjectiveField = <K extends keyof EmployeeObjective>(objectiveId: string, field: K, value: EmployeeObjective[K]) => {
    setSheetObjectives(prev =>
      prev.map(objective => (objective.id === objectiveId ? { ...objective, [field]: value } : objective)),
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Equipa da Agência</h1>
          <p className="text-gray-500 font-medium">Gestão da ficha da equipa, tarefas, missão e objetivos mensuráveis.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-200 transition active:scale-95"
        >
          <Plus size={22} /> Novo Consultor
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Procurar por nome, cargo, local, tarefa, missão ou objetivo..."
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(employee => (
          <EmployeeCard key={employee.id} employee={employee} onOpen={openEmployeeSheet} />
        ))}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateEmployee}
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
          >
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/80">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Adicionar à Equipa</h2>
                <p className="text-gray-400 text-sm font-medium">Crie uma nova ficha de funcionário.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition"
                aria-label="Fechar modal"
              >
                <Plus className="rotate-45" size={28} />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nome Completo</label>
                <input
                  required
                  value={name}
                  onChange={event => setName(event.target.value)}
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Corporativo</label>
                  <input
                    required
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    type="email"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Telemóvel</label>
                  <input
                    value={phone}
                    onChange={event => setPhone(event.target.value)}
                    type="tel"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Cargo / Função</label>
                <select
                  value={role}
                  onChange={event => setRole(event.target.value as EmployeeRole)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white"
                >
                  {Object.values(EmployeeRole).map(employeeRole => (
                    <option key={employeeRole} value={employeeRole}>
                      {employeeRole}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Horário</label>
                  <input
                    value={createWorkSchedule}
                    onChange={event => setCreateWorkSchedule(event.target.value)}
                    type="text"
                    placeholder="Ex: 09:00 - 18:00"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Local de Trabalho</label>
                  <input
                    value={createWorkLocation}
                    onChange={event => setCreateWorkLocation(event.target.value)}
                    type="text"
                    placeholder="Ex: Escritório Lisboa / Remoto"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Senha de Acesso</label>
                  <input
                    value={createAccessPassword}
                    onChange={event => setCreateAccessPassword(event.target.value)}
                    type="text"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">PIN Pica-Ponto</label>
                  <input
                    value={createPin}
                    onChange={event => setCreatePin(event.target.value)}
                    type="password"
                    maxLength={8}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t bg-gray-50/80 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-8 py-3 text-gray-500 font-black hover:bg-gray-200 rounded-2xl transition text-xs uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-2xl shadow-blue-200 transition text-xs uppercase tracking-widest"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSaveEmployeeSheet}
            className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
          >
            <div className="p-6 md:p-8 border-b bg-gray-50/80">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedEmployee.avatarSeed}`}
                    className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200"
                    alt={selectedEmployee.name}
                  />
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ficha da Equipa</h2>
                    <p className="text-sm text-gray-500">Editar dados, tarefas, missão e objetivos.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeEmployeeSheet}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition self-end md:self-auto"
                  aria-label="Fechar ficha"
                >
                  <Plus className="rotate-45" size={28} />
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSheetTab('perfil')}
                  className={`px-4 py-2 rounded-xl text-sm font-black transition flex items-center gap-2 ${
                    activeSheetTab === 'perfil' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <Briefcase size={16} /> Perfil
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSheetTab('operacao')}
                  className={`px-4 py-2 rounded-xl text-sm font-black transition flex items-center gap-2 ${
                    activeSheetTab === 'operacao'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <ListChecks size={16} /> Operação
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSheetTab('missao')}
                  className={`px-4 py-2 rounded-xl text-sm font-black transition flex items-center gap-2 ${
                    activeSheetTab === 'missao'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <Target size={16} /> Missão e Objetivos
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto space-y-6">
              {sheetError && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-700">{sheetError}</div>}
              {sheetSuccess && <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm font-semibold text-green-700">{sheetSuccess}</div>}

              {activeSheetTab === 'perfil' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nome Completo</label>
                    <input
                      required
                      value={sheetName}
                      onChange={event => setSheetName(event.target.value)}
                      type="text"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Corporativo</label>
                    <input
                      required
                      value={sheetEmail}
                      onChange={event => setSheetEmail(event.target.value)}
                      type="email"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Telemóvel</label>
                    <input
                      value={sheetPhone}
                      onChange={event => setSheetPhone(event.target.value)}
                      type="tel"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Cargo / Função</label>
                    <select
                      value={sheetRole}
                      onChange={event => setSheetRole(event.target.value as EmployeeRole)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white"
                    >
                      {Object.values(EmployeeRole).map(employeeRole => (
                        <option key={employeeRole} value={employeeRole}>
                          {employeeRole}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Estado</label>
                    <select
                      value={sheetStatus}
                      onChange={event => setSheetStatus(event.target.value as Employee['status'])}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Ausente">Ausente</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                </div>
              )}

              {activeSheetTab === 'operacao' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <ListChecks size={14} /> Tarefas Principais (1 por linha)
                      </label>
                      <textarea
                        value={sheetPrimaryTasks}
                        onChange={event => setSheetPrimaryTasks(event.target.value)}
                        rows={6}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                        placeholder="Ex: Gestão de clientes VIP"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <ListChecks size={14} /> Tarefas Secundárias (1 por linha)
                      </label>
                      <textarea
                        value={sheetSecondaryTasks}
                        onChange={event => setSheetSecondaryTasks(event.target.value)}
                        rows={6}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                        placeholder="Ex: Apoio em propostas"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock3 size={14} /> Horário de Trabalho
                      </label>
                      <input
                        value={sheetWorkSchedule}
                        onChange={event => setSheetWorkSchedule(event.target.value)}
                        type="text"
                        placeholder="Ex: Seg-Sex 09:00 - 18:00"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={14} /> Local de Trabalho
                      </label>
                      <input
                        value={sheetWorkLocation}
                        onChange={event => setSheetWorkLocation(event.target.value)}
                        type="text"
                        placeholder="Ex: Escritório Porto"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <KeyRound size={14} /> Senha de Acesso
                      </label>
                      <input
                        value={sheetAccessPassword}
                        onChange={event => setSheetAccessPassword(event.target.value)}
                        type="text"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Fingerprint size={14} /> PIN de Registo de Ponto
                      </label>
                      <input
                        value={sheetPin}
                        onChange={event => setSheetPin(event.target.value)}
                        type="password"
                        maxLength={8}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSheetTab === 'missao' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Missão do Funcionário</label>
                    <textarea
                      value={sheetMission}
                      onChange={event => setSheetMission(event.target.value)}
                      rows={4}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                      placeholder="Ex: Liderar a área de vendas corporate e garantir qualidade de atendimento premium."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-gray-900">Objetivos Quantificáveis e Mensuráveis</h3>
                      <p className="text-sm text-gray-500">Defina KPI, meta, valor atual e prazo para acompanhar evolução.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addObjective}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition"
                    >
                      <Plus size={14} className="inline mr-1" /> Novo Objetivo
                    </button>
                  </div>

                  {sheetObjectives.length === 0 ? (
                    <div className="p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                      Ainda não existem objetivos definidos para este funcionário.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sheetObjectives.map((objective, index) => {
                        const progress = objective.targetValue > 0
                          ? Math.max(0, Math.min(100, (objective.currentValue / objective.targetValue) * 100))
                          : 0;

                        return (
                          <div key={objective.id} className="p-5 rounded-2xl border border-gray-200 bg-white space-y-4">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Objetivo {index + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeObjective(objective.id)}
                                className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition"
                                aria-label="Remover objetivo"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Objetivo</label>
                                <input
                                  value={objective.title}
                                  onChange={event => updateObjectiveField(objective.id, 'title', event.target.value)}
                                  type="text"
                                  placeholder="Ex: Converter propostas em vendas"
                                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Indicador (KPI)</label>
                                <input
                                  value={objective.metric}
                                  onChange={event => updateObjectiveField(objective.id, 'metric', event.target.value)}
                                  type="text"
                                  placeholder="Ex: Taxa de fecho"
                                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Meta</label>
                                <input
                                  value={objective.targetValue}
                                  onChange={event => updateObjectiveField(objective.id, 'targetValue', Number(event.target.value) || 0)}
                                  type="number"
                                  step="0.01"
                                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Valor Atual</label>
                                <input
                                  value={objective.currentValue}
                                  onChange={event => updateObjectiveField(objective.id, 'currentValue', Number(event.target.value) || 0)}
                                  type="number"
                                  step="0.01"
                                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Unidade</label>
                                <input
                                  value={objective.unit || ''}
                                  onChange={event => updateObjectiveField(objective.id, 'unit', event.target.value)}
                                  type="text"
                                  placeholder="Ex: %, pts, vendas"
                                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Prazo</label>
                                <input
                                  value={objective.dueDate || ''}
                                  onChange={event => updateObjectiveField(objective.id, 'dueDate', event.target.value)}
                                  type="date"
                                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                                <span>Progresso</span>
                                <span>{progress.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 border-t bg-gray-50/80 flex justify-end gap-4">
              <button
                type="button"
                onClick={closeEmployeeSheet}
                className="px-8 py-3 text-gray-500 font-black hover:bg-gray-200 rounded-2xl transition text-xs uppercase tracking-widest"
              >
                Fechar
              </button>
              <button
                type="submit"
                className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-2xl shadow-blue-200 transition text-xs uppercase tracking-widest"
              >
                Guardar Ficha
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EmployeesView;
