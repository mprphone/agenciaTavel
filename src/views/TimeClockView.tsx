import React, { useMemo, useState } from 'react';
import {
  Search,
  Clock3,
  LogIn,
  LogOut,
  Fingerprint,
  Users2,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Employee, EmployeeTimeClockEntry } from '../types';

const uid = () => Math.random().toString(36).slice(2, 9);

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isToday = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const getLatestEntry = (employee: Employee) => {
  const entries = [...(employee.timeClockEntries || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return entries[0];
};

const TimeClockView = () => {
  const { employees, updateEmployee } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [pinAttempt, setPinAttempt] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return employees;

    return employees.filter(employee => {
      const roleMatch = employee.role.toLowerCase().includes(term);
      return employee.name.toLowerCase().includes(term) || roleMatch;
    });
  }, [employees, searchTerm]);

  const selectedEmployee = useMemo(
    () => employees.find(employee => employee.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId],
  );

  const selectedEntries = useMemo(
    () => [...(selectedEmployee?.timeClockEntries || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [selectedEmployee],
  );

  const todayEntries = useMemo(
    () =>
      employees
        .flatMap(employee =>
          (employee.timeClockEntries || []).map(entry => ({
            ...entry,
            employeeId: employee.id,
            employeeName: employee.name,
          })),
        )
        .filter(entry => isToday(entry.timestamp))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [employees],
  );

  const onShiftCount = useMemo(() => {
    return employees.reduce((total, employee) => {
      const latest = getLatestEntry(employee);
      return latest?.type === 'entrada' ? total + 1 : total;
    }, 0);
  }, [employees]);

  const handlePunch = async (type: EmployeeTimeClockEntry['type']) => {
    if (!selectedEmployee) {
      setErrorMessage('Selecione um funcionário para registar o ponto.');
      setSuccessMessage(null);
      return;
    }

    const configuredPin = (selectedEmployee.timeClockPin || '').trim();
    if (!configuredPin) {
      setErrorMessage('Este funcionário ainda não tem PIN configurado na ficha.');
      setSuccessMessage(null);
      return;
    }

    if (pinAttempt.trim() !== configuredPin) {
      setErrorMessage('PIN inválido.');
      setSuccessMessage(null);
      return;
    }

    const latest = getLatestEntry(selectedEmployee);
    if (type === 'entrada' && latest?.type === 'entrada') {
      setErrorMessage('Já existe uma entrada ativa. Registe a saída antes de nova entrada.');
      setSuccessMessage(null);
      return;
    }

    if (type === 'saida' && (!latest || latest.type === 'saida')) {
      setErrorMessage('Não existe entrada ativa para registar saída.');
      setSuccessMessage(null);
      return;
    }

    const newEntry: EmployeeTimeClockEntry = {
      id: uid(),
      type,
      timestamp: new Date().toISOString(),
      source: 'pin',
    };

    const updatedEntries = [...(selectedEmployee.timeClockEntries || []), newEntry];

    try {
      await updateEmployee(selectedEmployee.id, { timeClockEntries: updatedEntries });
      setPinAttempt('');
      setErrorMessage(null);
      setSuccessMessage(
        type === 'entrada'
          ? `Entrada registada para ${selectedEmployee.name}.`
          : `Saída registada para ${selectedEmployee.name}.`,
      );
    } catch (error) {
      console.error(error);
      setErrorMessage('Não foi possível registar o ponto.');
      setSuccessMessage(null);
    }
  };

  const selectedLatestEntry = selectedEmployee ? getLatestEntry(selectedEmployee) : null;
  const selectedOnShift = selectedLatestEntry?.type === 'entrada';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pica-Ponto</h1>
        <p className="text-gray-500 font-medium">Registo rápido de entrada e saída sem abrir a ficha de funcionários.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Funcionários</p>
          <p className="text-3xl font-black text-gray-900 mt-2">{employees.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Em Serviço</p>
          <p className="text-3xl font-black text-green-600 mt-2">{onShiftCount}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Registos Hoje</p>
          <p className="text-3xl font-black text-blue-600 mt-2">{todayEntries.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-gray-50/60 space-y-4">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Users2 size={18} /> Equipa
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                type="text"
                placeholder="Procurar funcionário..."
                className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="max-h-[480px] overflow-y-auto divide-y divide-gray-100">
            {filteredEmployees.map(employee => {
              const latest = getLatestEntry(employee);
              const onShift = latest?.type === 'entrada';

              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => {
                    setSelectedEmployeeId(employee.id);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setPinAttempt('');
                  }}
                  className={`w-full px-5 py-4 text-left hover:bg-blue-50/40 transition ${
                    selectedEmployeeId === employee.id ? 'bg-blue-50/70' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-gray-900">{employee.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{employee.role}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                        onShift ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {onShift ? <CheckCircle2 size={12} /> : <Circle size={12} />} {onShift ? 'Em serviço' : 'Fora'}
                    </span>
                  </div>
                </button>
              );
            })}
            {filteredEmployees.length === 0 && (
              <div className="p-6 text-sm text-gray-400">Nenhum funcionário encontrado.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Clock3 size={18} /> Registo de Ponto
          </h2>

          {!selectedEmployee ? (
            <div className="p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
              Selecione um funcionário para registar entrada ou saída.
            </div>
          ) : (
            <>
              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/70">
                <p className="text-sm font-black text-gray-900">{selectedEmployee.name}</p>
                <p className="text-xs text-gray-500">{selectedEmployee.role}</p>
                <p className={`mt-3 text-xs font-black uppercase tracking-wider ${selectedOnShift ? 'text-green-700' : 'text-gray-600'}`}>
                  {selectedOnShift ? 'Estado atual: Em serviço' : 'Estado atual: Fora de serviço'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Fingerprint size={14} /> PIN
                </label>
                <input
                  value={pinAttempt}
                  onChange={event => setPinAttempt(event.target.value)}
                  type="password"
                  placeholder="Introduza o PIN"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handlePunch('entrada')}
                  className="px-4 py-3 rounded-xl bg-green-600 text-white font-black text-xs uppercase tracking-widest hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <LogIn size={16} /> Entrada
                </button>
                <button
                  type="button"
                  onClick={() => handlePunch('saida')}
                  className="px-4 py-3 rounded-xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition flex items-center justify-center gap-2"
                >
                  <LogOut size={16} /> Saída
                </button>
              </div>

              {errorMessage && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-700">{errorMessage}</div>}
              {successMessage && (
                <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm font-semibold text-green-700">{successMessage}</div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Últimos Registos</p>
                <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
                  {selectedEntries.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-gray-400">Sem registos para este funcionário.</div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[200px] overflow-y-auto">
                      {selectedEntries.map(entry => (
                        <div key={entry.id} className="px-4 py-3 flex items-center justify-between">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-lg ${
                              entry.type === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {entry.type === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                          <span className="text-xs font-semibold text-gray-600">{formatDateTime(entry.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/60">
          <h3 className="text-lg font-black text-gray-900">Movimentos de Hoje</h3>
        </div>
        {todayEntries.length === 0 ? (
          <div className="px-6 py-8 text-sm text-gray-400">Ainda não existem registos de ponto hoje.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {todayEntries.map(entry => (
              <div key={`${entry.employeeId}-${entry.id}`} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-gray-900">{entry.employeeName}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(entry.timestamp)}</p>
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-lg ${
                    entry.type === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {entry.type === 'entrada' ? 'Entrada' : 'Saída'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeClockView;
