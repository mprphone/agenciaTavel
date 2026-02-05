import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Clock3,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Star,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Supplier, SupplierCategory, SupplierIncident, SupplierUsage } from '../types';

type SupplierDraft = {
  id?: string;
  createdAt?: string;
  name: string;
  category: SupplierCategory;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactNotes: string;
  cancellationPolicy: string;
  paymentTerms: string;
  cutOff: string;
  internalRating: number;
  incidents: SupplierIncident[];
  usageHistory: SupplierUsage[];
};

const uid = () => Math.random().toString(36).slice(2, 9);
const categories: SupplierCategory[] = ['Hotel', 'Operadora', 'Guia', 'Transfer'];

const getTodayDateInput = () => new Date().toISOString().slice(0, 10);

const emptyDraft = (): SupplierDraft => ({
  name: '',
  category: 'Hotel',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  contactNotes: '',
  cancellationPolicy: '',
  paymentTerms: '',
  cutOff: '',
  internalRating: 4,
  incidents: [],
  usageHistory: [],
});

const SupplierCard: React.FC<{ supplier: Supplier; onEdit: () => void }> = ({ supplier, onEdit }) => {
  const usageHistory = supplier.usageHistory ?? [];
  const incidents = supplier.incidents ?? [];
  const lastUsage = usageHistory[0];
  const lastIncident = incidents[0];
  const categoryColors: Record<SupplierCategory, string> = {
    Hotel: 'bg-blue-50 text-blue-700 border-blue-200',
    Operadora: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Guia: 'bg-violet-50 text-violet-700 border-violet-200',
    Transfer: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-xl hover:border-blue-100 transition-all">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-black text-gray-900 truncate">{supplier.name}</h3>
          <span className={`mt-2 inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${categoryColors[supplier.category]}`}>
            {supplier.category}
          </span>
        </div>
        <button onClick={onEdit} className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition" title="Editar fornecedor">
          <Pencil size={16} />
        </button>
      </div>

      <div className="mt-5 space-y-2 text-sm">
        <p className="flex items-center gap-2 text-gray-600">
          <User size={14} className="text-gray-300" />
          {supplier.contactName || 'Sem contacto principal'}
        </p>
        <p className="flex items-center gap-2 text-gray-600">
          <Mail size={14} className="text-gray-300" />
          {supplier.contactEmail || 'Sem email'}
        </p>
        <p className="flex items-center gap-2 text-gray-600">
          <Phone size={14} className="text-gray-300" />
          {supplier.contactPhone || 'Sem telefone'}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Condições / Prazos</p>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            <b>Cancelamento:</b> {supplier.cancellationPolicy || '-'}
          </p>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            <b>Pagamento:</b> {supplier.paymentTerms || '-'}
          </p>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            <b>Cut-off:</b> {supplier.cutOff || '-'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Star
              key={`star-${supplier.id}-${idx}`}
              size={14}
              className={idx < supplier.internalRating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
            />
          ))}
          <span className="ml-1 text-xs font-black text-gray-600">{supplier.internalRating}/5</span>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
          incidents.length ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'
        }`}>
          {incidents.length ? `${incidents.length} incidentes` : 'Sem incidentes'}
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Histórico de Uso</p>
          {lastUsage ? (
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              <CalendarClock size={12} className="inline mr-1 text-blue-500" />
              {new Date(lastUsage.date).toLocaleDateString('pt-PT')} • {lastUsage.opportunityTitle || 'Sem oportunidade'} — {lastUsage.note}
            </p>
          ) : (
            <p className="text-xs text-gray-400 font-medium">Ainda sem histórico de uso registado.</p>
          )}
        {lastIncident && (
          <p className="text-xs text-red-600 font-semibold leading-relaxed">
            <AlertTriangle size={12} className="inline mr-1" />
            Último incidente: {lastIncident.description}
          </p>
        )}
      </div>
    </div>
  );
};

const SuppliersView: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Todos' | SupplierCategory>('Todos');
  const [draft, setDraft] = useState<SupplierDraft>(emptyDraft());
  const [incidentDate, setIncidentDate] = useState(getTodayDateInput());
  const [incidentSeverity, setIncidentSeverity] = useState<SupplierIncident['severity']>('Media');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [usageDate, setUsageDate] = useState(getTodayDateInput());
  const [usageOpportunity, setUsageOpportunity] = useState('');
  const [usageNote, setUsageNote] = useState('');

  const filteredSuppliers = useMemo(() => {
    return suppliers
      .filter(s => (categoryFilter === 'Todos' ? true : s.category === categoryFilter))
      .filter(s =>
        `${s.name} ${s.contactName || ''} ${s.contactEmail || ''} ${s.contactPhone || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const bTime = new Date(b.updatedAt || b.createdAt).getTime();
        const aTime = new Date(a.updatedAt || a.createdAt).getTime();
        return bTime - aTime;
      });
  }, [suppliers, categoryFilter, searchTerm]);

  const openCreate = () => {
    setDraft(emptyDraft());
    setIncidentDate(getTodayDateInput());
    setIncidentSeverity('Media');
    setIncidentDescription('');
    setUsageDate(getTodayDateInput());
    setUsageOpportunity('');
    setUsageNote('');
    setIsModalOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setDraft({
      id: supplier.id,
      createdAt: supplier.createdAt,
      name: supplier.name,
      category: supplier.category,
      contactName: supplier.contactName || '',
      contactEmail: supplier.contactEmail || '',
      contactPhone: supplier.contactPhone || '',
      contactNotes: supplier.contactNotes || '',
      cancellationPolicy: supplier.cancellationPolicy || '',
      paymentTerms: supplier.paymentTerms || '',
      cutOff: supplier.cutOff || '',
      internalRating: supplier.internalRating,
      incidents: [...(supplier.incidents || [])],
      usageHistory: [...(supplier.usageHistory || [])],
    });
    setIncidentDate(getTodayDateInput());
    setIncidentSeverity('Media');
    setIncidentDescription('');
    setUsageDate(getTodayDateInput());
    setUsageOpportunity('');
    setUsageNote('');
    setIsModalOpen(true);
  };

  const handleAddIncident = () => {
    if (!incidentDescription.trim()) return;
    const entry: SupplierIncident = {
      id: uid(),
      date: new Date(incidentDate || getTodayDateInput()).toISOString(),
      severity: incidentSeverity,
      description: incidentDescription.trim(),
    };
    setDraft(prev => ({ ...prev, incidents: [entry, ...prev.incidents] }));
    setIncidentDescription('');
    setIncidentSeverity('Media');
  };

  const handleAddUsage = () => {
    if (!usageNote.trim()) return;
    const entry: SupplierUsage = {
      id: uid(),
      date: new Date(usageDate || getTodayDateInput()).toISOString(),
      opportunityTitle: usageOpportunity.trim() || undefined,
      note: usageNote.trim(),
    };
    setDraft(prev => ({ ...prev, usageHistory: [entry, ...prev.usageHistory] }));
    setUsageOpportunity('');
    setUsageNote('');
  };

  const handleRemoveIncident = (id: string) => {
    setDraft(prev => ({ ...prev, incidents: prev.incidents.filter(i => i.id !== id) }));
  };

  const handleRemoveUsage = (id: string) => {
    setDraft(prev => ({ ...prev, usageHistory: prev.usageHistory.filter(h => h.id !== id) }));
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      alert('Indique o nome do fornecedor.');
      return;
    }

    const now = new Date().toISOString();
    const supplier: Supplier = {
      id: draft.id || uid(),
      name: draft.name.trim(),
      category: draft.category,
      contactName: draft.contactName.trim() || undefined,
      contactEmail: draft.contactEmail.trim() || undefined,
      contactPhone: draft.contactPhone.trim() || undefined,
      contactNotes: draft.contactNotes.trim() || undefined,
      cancellationPolicy: draft.cancellationPolicy.trim() || undefined,
      paymentTerms: draft.paymentTerms.trim() || undefined,
      cutOff: draft.cutOff.trim() || undefined,
      internalRating: Math.max(1, Math.min(5, draft.internalRating || 1)),
      incidents: [...draft.incidents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      usageHistory: [...draft.usageHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      createdAt: draft.createdAt || now,
      updatedAt: now,
    };

    if (draft.id) {
      await updateSupplier(draft.id, supplier);
    } else {
      await addSupplier(supplier);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Banco de Dados de Fornecedores</h1>
          <p className="text-gray-500 font-medium">Gestão de parceiros: contactos, condições, incidentes e histórico de uso.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black flex items-center gap-3 hover:bg-blue-700 shadow-2xl shadow-blue-200 transition active:scale-95 text-sm uppercase tracking-widest"
        >
          <Plus size={20} /> Novo Fornecedor
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por fornecedor ou contacto..."
            className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium shadow-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['Todos', ...categories] as Array<'Todos' | SupplierCategory>).map(category => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition ${
                categoryFilter === category
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => (
          <SupplierCard key={supplier.id} supplier={supplier} onEdit={() => openEdit(supplier)} />
        ))}
        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-20 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
            <Building2 size={42} className="mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest opacity-50">Sem fornecedores para este filtro</p>
            <p className="text-xs font-medium mt-1">Ajuste os filtros ou crie um novo fornecedor.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <form onSubmit={handleSaveSupplier} className="bg-white rounded-[2.5rem] max-w-5xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/70">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">{draft.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
                <p className="text-gray-400 text-sm font-medium">Registe contactos, condições, avaliação e histórico.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition">
                <X size={26} />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">Fornecedor</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nome</label>
                    <input
                      required
                      value={draft.name}
                      onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Categoria</label>
                    <select
                      value={draft.category}
                      onChange={e => setDraft(prev => ({ ...prev, category: e.target.value as SupplierCategory }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Avaliação Interna (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={draft.internalRating}
                      onChange={e => setDraft(prev => ({ ...prev, internalRating: Number(e.target.value) || 1 }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">Contactos</h3>
                  <input
                    value={draft.contactName}
                    onChange={e => setDraft(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="Pessoa de contacto"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <input
                    value={draft.contactEmail}
                    onChange={e => setDraft(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="Email"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <input
                    value={draft.contactPhone}
                    onChange={e => setDraft(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="Telefone"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <textarea
                    value={draft.contactNotes}
                    onChange={e => setDraft(prev => ({ ...prev, contactNotes: e.target.value }))}
                    placeholder="Notas de contacto (horário, canal preferido...)"
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Cancelamento</label>
                  <textarea
                    value={draft.cancellationPolicy}
                    onChange={e => setDraft(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Pagamento</label>
                  <textarea
                    value={draft.paymentTerms}
                    onChange={e => setDraft(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Cut-off</label>
                  <textarea
                    value={draft.cutOff}
                    onChange={e => setDraft(prev => ({ ...prev, cutOff: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Incidentes</h4>
                  <div className="space-y-2 mb-3">
                    <input
                      type="date"
                      value={incidentDate}
                      onChange={e => setIncidentDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <select
                      value={incidentSeverity}
                      onChange={e => setIncidentSeverity(e.target.value as SupplierIncident['severity'])}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                    </select>
                    <textarea
                      value={incidentDescription}
                      onChange={e => setIncidentDescription(e.target.value)}
                      rows={2}
                      placeholder="Descreva o incidente"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddIncident}
                      className="w-full bg-amber-500 text-white rounded-xl py-2 text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition"
                    >
                      Adicionar Incidente
                    </button>
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                    {draft.incidents.map(incident => (
                      <div key={incident.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {new Date(incident.date).toLocaleDateString('pt-PT')} • {incident.severity}
                          </p>
                          <p className="text-xs text-gray-700 font-medium mt-1">{incident.description}</p>
                        </div>
                        <button type="button" onClick={() => handleRemoveIncident(incident.id)} className="text-gray-300 hover:text-red-500 transition">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {!draft.incidents.length && <p className="text-xs text-gray-400 font-medium">Sem incidentes registados.</p>}
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Histórico de Uso</h4>
                  <div className="space-y-2 mb-3">
                    <input
                      type="date"
                      value={usageDate}
                      onChange={e => setUsageDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <input
                      value={usageOpportunity}
                      onChange={e => setUsageOpportunity(e.target.value)}
                      placeholder="Oportunidade / viagem"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <textarea
                      value={usageNote}
                      onChange={e => setUsageNote(e.target.value)}
                      rows={2}
                      placeholder="Resumo da utilização"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddUsage}
                      className="w-full bg-blue-600 text-white rounded-xl py-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition"
                    >
                      Adicionar Uso
                    </button>
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                    {draft.usageHistory.map(history => (
                      <div key={history.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <Clock3 size={10} className="inline mr-1" />
                            {new Date(history.date).toLocaleDateString('pt-PT')}
                          </p>
                          <p className="text-xs text-gray-700 font-semibold mt-1">{history.opportunityTitle || 'Sem oportunidade'}</p>
                          <p className="text-xs text-gray-600 font-medium">{history.note}</p>
                        </div>
                        <button type="button" onClick={() => handleRemoveUsage(history.id)} className="text-gray-300 hover:text-red-500 transition">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {!draft.usageHistory.length && <p className="text-xs text-gray-400 font-medium">Sem histórico de uso.</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t bg-gray-50/80 flex justify-end gap-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-500 font-black hover:bg-gray-200 rounded-2xl transition text-xs uppercase tracking-widest">
                Cancelar
              </button>
              <button type="submit" className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-2xl shadow-blue-200 transition text-xs uppercase tracking-widest">
                {draft.id ? 'Guardar Alterações' : 'Criar Fornecedor'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SuppliersView;
