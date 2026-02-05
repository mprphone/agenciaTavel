
import React, { useState } from 'react';
import { Plus, Search, Mail, Phone, Shield, MoreVertical, Star, Briefcase } from 'lucide-react';
import { useApp } from '../AppContext';
import { Employee, EmployeeRole } from '../types';

// Use React.FC to properly handle React internal props like 'key' in JSX
const EmployeeCard: React.FC<{ employee: Employee }> = ({ employee }) => {
  const statusColors = {
    'Ativo': 'bg-green-500',
    'Inativo': 'bg-red-500',
    'Ausente': 'bg-orange-500'
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-xl hover:border-blue-100 transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className="relative">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.avatarSeed}`} 
            className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 shadow-inner group-hover:scale-105 transition-transform" 
            alt={employee.name} 
          />
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-4 border-white rounded-full ${statusColors[employee.status]}`}></div>
        </div>
        <button className="text-gray-300 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-xl transition">
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
            <Phone size={14} className="text-gray-300" /> {employee.phone}
          </div>
        </div>

        <div className="pt-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-gray-700">Senior</span>
          </div>
          <p className="text-[10px] text-gray-300 font-bold uppercase">Entrou em {new Date(employee.joinedAt).getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

const EmployeesView = () => {
  const { employees, addEmployee } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(EmployeeRole.CONSULTANT);

  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmp: Employee = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      phone,
      role,
      status: 'Ativo',
      avatarSeed: name,
      joinedAt: new Date().toISOString()
    };
    addEmployee(newEmp);
    setIsModalOpen(false);
    setName(''); setEmail(''); setPhone('');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Equipa da Agência</h1>
          <p className="text-gray-500 font-medium">Gestão de consultores e permissões de acesso.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
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
            placeholder="Procurar por nome ou cargo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(emp => (
          <EmployeeCard key={emp.id} employee={emp} />
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/80">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Adicionar à Equipa</h2>
                <p className="text-gray-400 text-sm font-medium">Crie uma nova conta de acesso.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition">
                 <Plus className="rotate-45" size={28} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nome Completo</label>
                <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Corporativo</label>
                  <input required value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Telemóvel</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Cargo / Função</label>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value as EmployeeRole)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white"
                >
                  {Object.values(EmployeeRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="p-8 border-t bg-gray-50/80 flex justify-end gap-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-500 font-black hover:bg-gray-200 rounded-2xl transition text-xs uppercase tracking-widest">Cancelar</button>
              <button type="submit" className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-2xl shadow-blue-200 transition text-xs uppercase tracking-widest">Convidar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EmployeesView;
