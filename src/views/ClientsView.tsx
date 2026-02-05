
import React, { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, Mail, Phone, Calendar, Tag as TagIcon, Search, Eye } from 'lucide-react';
import { useApp } from '../AppContext';
import { Client, CommChannel } from '../types';
import ClientDetailModal from './ClientDetailModal';
import { useLocation, useNavigate } from 'react-router-dom';

const ClientsView = () => {
  const { clients, addClient } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Form states
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientBirth, setNewClientBirth] = useState('');
  const [newClientChannels, setNewClientChannels] = useState<CommChannel[]>([]);
  const [newClientTags, setNewClientTags] = useState('');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleChannel = (channel: CommChannel) => {
    setNewClientChannels(prev => 
      prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
    );
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new') === '1') {
      setIsModalOpen(true);
      params.delete('new');
      navigate(
        {
          pathname: location.pathname,
          search: params.toString() ? `?${params.toString()}` : '',
        },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, navigate]);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) return;

    const client: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: newClientName,
      email: newClientEmail,
      phone: newClientPhone,
      birthDate: newClientBirth || new Date().toISOString(),
      commChannels: newClientChannels,
      family: [],
      tags: newClientTags.split(',').map(t => t.trim()).filter(t => t !== ''),
      createdAt: new Date().toISOString()
    };

    addClient(client);
    setIsModalOpen(false);
    // Reset form
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientBirth('');
    setNewClientChannels([]);
    setNewClientTags('');
  };

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Base de Clientes</h1>
          <p className="text-gray-500">Gestão centralizada de passageiros e agregados familiares.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition shadow-lg shadow-blue-200 active:scale-95"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      <div className="flex gap-4 items-center mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome, email ou telemóvel..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
          />
        </div>
        <div className="flex border rounded-xl bg-white shadow-sm overflow-hidden">
          <button className="px-4 py-2 border-r hover:bg-gray-50 text-sm font-medium bg-gray-50">Todos</button>
          <button className="px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-400">Favoritos</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xl shadow-gray-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome do Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contacto Directo</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Preferência</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tags</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredClients.map((client) => (
                <tr 
                  key={client.id} 
                  className="hover:bg-blue-50/30 transition cursor-pointer group"
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-lg group-hover:scale-110 transition shadow-sm">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-700 transition">{client.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Nasc: {new Date(client.birthDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} className="text-gray-300" /> {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} className="text-gray-300" /> {client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-1 flex-wrap">
                      {client.commChannels.slice(0, 2).map(channel => (
                        <span key={channel} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100 uppercase">
                          {channel}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-1 flex-wrap">
                      {client.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-medium rounded-lg border border-gray-100">
                          <TagIcon size={10} /> {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Ver Ficha">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition" onClick={(e) => { e.stopPropagation(); }}>
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedClient && (
        <ClientDetailModal 
          client={selectedClient} 
          onClose={() => setSelectedClientId(null)} 
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateClient} className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">Registar Novo Cliente</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome Completo</label>
                  <input 
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    type="text" 
                    placeholder="Nome do titular" 
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Directo</label>
                  <input 
                    required
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    type="email" 
                    placeholder="exemplo@email.com" 
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Telemóvel</label>
                  <input 
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    type="tel" 
                    placeholder="+351 000 000 000" 
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data de Nascimento</label>
                  <input 
                    value={newClientBirth}
                    onChange={(e) => setNewClientBirth(e.target.value)}
                    type="date" 
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Canais Preferenciais</label>
                <div className="grid grid-cols-4 gap-3">
                  {Object.values(CommChannel).map(channel => (
                    <label 
                      key={channel} 
                      className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition group ${newClientChannels.includes(channel) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-blue-50 hover:border-blue-200'}`}
                    >
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={newClientChannels.includes(channel)}
                        onChange={() => toggleChannel(channel)}
                      />
                      <span className="text-sm font-medium">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Etiquetas / Segmentação</label>
                <input 
                  value={newClientTags}
                  onChange={(e) => setNewClientTags(e.target.value)}
                  type="text" 
                  placeholder="Luxo, Aventura, Família..." 
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition" 
                />
                <p className="text-[10px] text-gray-400">Separe as etiquetas por vírgulas.</p>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition">Cancelar</button>
              <button type="submit" className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition active:scale-95">Criar Ficha de Cliente</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClientsView;
