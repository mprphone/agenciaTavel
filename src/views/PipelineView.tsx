
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Clock,
  DollarSign,
  User,
  LayoutGrid,
  Thermometer,
  TrendingUp,
  X,
  CheckCircle2,
} from 'lucide-react';
import { DEFAULT_PIPELINE } from '../constants';
import { Opportunity, OpportunityStatus, CommChannel } from '../types';
import OpportunityDetailModal from './OpportunityDetailModal';
import { useApp } from '../AppContext';

const OpportunityCard: React.FC<{ opp: Opportunity; onClick: () => void }> = ({ opp, onClick }) => {
  const { clients } = useApp();
  const client = clients.find(c => c.id === opp.clientId);
  const isStale = (new Date().getTime() - new Date(opp.lastInteractionAt).getTime()) > (48 * 60 * 60 * 1000);
  const hasAcceptedProposal = opp.proposalOptions.some(opt => opt.isAccepted);

  return (
    <div 
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('opportunityId', opp.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`bg-white p-5 rounded-[2rem] border transition-all duration-300 cursor-grab active:cursor-grabbing group relative overflow-hidden ${
        hasAcceptedProposal ? 'border-emerald-400 shadow-lg shadow-emerald-50' :
        isStale ? 'border-amber-200 shadow-md' : 'border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-xl'
      }`}
    >
      {hasAcceptedProposal && (
        <div className="absolute top-0 right-0 bg-green-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase flex items-center gap-1 z-10">
          <CheckCircle2 size={10} /> Proposta Aceite
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1 pr-6">
          <h4 className="font-black text-gray-900 group-hover:text-blue-600 transition truncate leading-tight tracking-tight">{opp.title}</h4>
          <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
            <User size={10} className="text-blue-500" /> {client?.name || 'Cliente s/ nome'}
          </span>
        </div>
        <div className={`text-[10px] font-black ${opp.temperature > 70 ? 'text-red-500' : 'text-blue-500'}`}>
          {opp.temperature}%
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
          <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Valor Venda</span>
          <span className="text-sm font-black text-gray-900">€{opp.limitValue.toLocaleString()}</span>
        </div>
        <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
          <span className="text-[8px] font-black text-blue-400 uppercase block mb-1">Pax</span>
          <span className="text-sm font-black text-blue-700">{opp.adults}A + {opp.children}C</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex -space-x-2">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${opp.owner}`} 
            className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
            title={`Responsável: ${opp.owner}`} 
          />
          {opp.comments.length > 0 && (
            <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center text-[9px] font-black">
              +{opp.comments.length}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black text-gray-300 uppercase">
          <Clock size={12} /> {new Date(opp.lastInteractionAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{
  label: string;
  value: string;
  helper?: string;
  icon: React.ElementType;
  tone: string;
}> = ({ label, value, helper, icon: Icon, tone }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tone}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {helper && <p className="text-[10px] text-gray-400 font-semibold mt-1">{helper}</p>}
    </div>
  </div>
);

const PipelineView = () => {
  const { opportunities, clients, employees, campaigns, addOpportunity, moveOpportunityStage } = useApp();
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Encontrar a oportunidade selecionada a partir do ID para garantir que temos os dados mais frescos
  const selectedOpp = opportunities.find(o => o.id === selectedOppId) || null;

  // Form states
  const [newOppTitle, setNewOppTitle] = useState('');
  const [newOppClientId, setNewOppClientId] = useState('');
  const [newOppOwner, setNewOppOwner] = useState('');
  const [newOppCampaignId, setNewOppCampaignId] = useState('');
  const [newOppValue, setNewOppValue] = useState('');
  const [newOppDeparture, setNewOppDeparture] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [briefing, setBriefing] = useState('');
  const [tripReason, setTripReason] = useState('Lazer');

  const activeOpps = opportunities.filter(o => o.status !== OpportunityStatus.LOST && o.status !== OpportunityStatus.ABANDONED);
  const totalValue = activeOpps.reduce((acc, o) => acc + (o.limitValue || 0), 0);
  const wonOpps = opportunities.filter(o => o.status === OpportunityStatus.WON);
  const hotOpps = activeOpps.filter(o => o.temperature >= 70);

  const summaryCards = [
    {
      label: 'Oportunidades Ativas',
      value: activeOpps.length.toString(),
      helper: `${opportunities.length} no total`,
      icon: LayoutGrid,
      tone: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Valor em Pipeline',
      value: `€${Math.round(totalValue).toLocaleString('pt-PT')}`,
      helper: 'Estimado',
      icon: DollarSign,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Leads Quentes',
      value: hotOpps.length.toString(),
      helper: 'Temperatura ≥ 70%',
      icon: Thermometer,
      tone: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Vendas Ganhas',
      value: wonOpps.length.toString(),
      helper: 'Fechadas',
      icon: TrendingUp,
      tone: 'bg-purple-50 text-purple-600',
    },
  ];

  const handleCreateOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOppTitle || !newOppClientId || !newOppOwner) {
      alert("Por favor, preencha o título, cliente e consultor responsável.");
      return;
    }

    const val = parseFloat(newOppValue) || 0;
    
    const baseOpp: Opportunity = {
      id: Math.random().toString(36).substr(2, 9),
      title: newOppTitle,
      clientId: newOppClientId,
      campaignId: newOppCampaignId || undefined,
      pipelineId: DEFAULT_PIPELINE.id,
      stage: DEFAULT_PIPELINE.stages[0],
      status: OpportunityStatus.OPEN,
      limitValue: val,
      estimatedMargin: val * 0.15,
      adults: adults,
      children: children,
      owner: newOppOwner,
      followers: [],
      tags: [],
      createdAt: new Date().toISOString(),
      lastInteractionAt: new Date().toISOString(),
      departureDate: newOppDeparture || undefined,
      temperature: 50,
      preferredChannel: CommChannel.EMAIL,
      tripReason: tripReason,
      tripType: tripReason === 'Corporate' ? 'Corporate' : 'Lazer',
      proposalStatus: undefined,
      proposalFinalizedAt: undefined,
      proposalSentAt: undefined,
      supplierBookings: [],
      proposalOptions: [],
      comments: [],
      history: [{ id: Math.random().toString(36).substr(2, 5), user: newOppOwner, action: 'Lead criado no sistema', timestamp: new Date().toISOString() }],
      paymentPlan: [],
      itinerary: [],
      checklist: [
        { id: 'ch1', label: 'Validar Passaportes', isCompleted: false, isRequired: true },
        { id: 'ch2', label: 'Seguro de Viagem', isCompleted: false, isRequired: true }
      ],
      supportCases: [],
      tasks: [],
      briefingNotes: briefing,
      attachments: []
    };

    addOpportunity(baseOpp);
    setIsModalOpen(false);
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const opportunityId = e.dataTransfer.getData('opportunityId');
    if (opportunityId) {
      moveOpportunityStage(opportunityId, stage as any);
    }
    setDragOverStage(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] gap-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Tracking Comercial</h1>
            <p className="text-gray-500 font-medium">Gestão de briefing, propostas e negociação ativa.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/clients?new=1"
              className="px-6 py-3 rounded-[2rem] border border-blue-200 text-blue-700 font-black flex items-center gap-2 hover:bg-blue-50 transition text-xs uppercase tracking-widest"
            >
              <Plus size={16} /> Novo Cliente
            </Link>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black flex items-center gap-3 hover:bg-blue-700 shadow-2xl shadow-blue-200 transition active:scale-95 text-sm uppercase tracking-widest"
            >
              <Plus size={20} /> Nova Oportunidade
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map(card => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pipeline</p>
            <p className="text-sm font-bold text-gray-900">Arraste oportunidades para mudar de fase</p>
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Atualizado em {new Date().toLocaleDateString('pt-PT')}
          </div>
        </div>

        <div className="flex-1 flex gap-3 lg:gap-4 overflow-x-auto pb-6 custom-scrollbar items-start">
        {DEFAULT_PIPELINE.stages.map(stage => {
          const stageOpps = opportunities.filter(o => o.stage === stage && (stage === 'FECHADO' || o.status !== OpportunityStatus.LOST));
          const isOver = dragOverStage === stage;
          const stageValue = stageOpps.reduce((acc, o) => acc + (o.limitValue || 0), 0);

          return (
            <div 
              key={stage} 
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage); }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => handleDrop(e, stage)}
              className={`kanban-column flex flex-col h-full flex-1 min-w-[210px] max-w-[270px] bg-gray-50/70 rounded-[2rem] p-4 lg:p-5 border-2 transition-all duration-300 ${isOver ? 'border-blue-500 bg-blue-50/60' : 'border-transparent'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">{stage}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-2xl font-black text-gray-900">{stageOpps.length}</span>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">€{stageValue.toLocaleString('pt-PT')}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
                {stageOpps.length > 0 ? stageOpps.map(opp => (
                  <OpportunityCard key={opp.id} opp={opp} onClick={() => setSelectedOppId(opp.id)} />
                )) : (
                  <div className="text-[10px] text-gray-300 font-bold text-center py-10 uppercase tracking-widest">Vazio</div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {selectedOpp && (
        <OpportunityDetailModal 
          opportunity={selectedOpp} 
          client={clients.find(c => c.id === selectedOpp.clientId)}
          onClose={() => setSelectedOppId(null)} 
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateOpportunity} className="bg-white rounded-[2.5rem] max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/80">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Novo Lead de Viagem</h2>
                <p className="text-gray-400 text-sm font-medium">A oportunidade será criada na coluna <b>NOVO</b>.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition">
                 <X size={28} />
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Título da Viagem</label>
                  <input required value={newOppTitle} onChange={e => setNewOppTitle(e.target.value)} type="text" placeholder="Ex: Safari Verão 2025" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Consultor Responsável</label>
                  <select required value={newOppOwner} onChange={e => setNewOppOwner(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white">
                    <option value="">Quem irá tratar deste lead?</option>
                    {employees.map(e => <option key={e.id} value={e.name}>{e.name} ({e.role})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Cliente Principal</label>
                  <select required value={newOppClientId} onChange={e => setNewOppClientId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white">
                    <option value="">Selecionar cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Motivo</label>
                  <select value={tripReason} onChange={e => setTripReason(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white">
                    <option>Lazer</option>
                    <option>Lua de Mel</option>
                    <option>Corporate</option>
                    <option>Aniversário</option>
                    <option>Aventura</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Pacote da Agência (opcional)</label>
                <select value={newOppCampaignId} onChange={e => setNewOppCampaignId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white">
                  <option value="">— Sem pacote —</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 font-medium">Serve para associar este lead a um pacote fechado ou campanha ativa.</p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Adultos</label>
                  <input type="number" min="1" value={adults} onChange={e => setAdults(parseInt(e.target.value) || 1)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Crianças</label>
                  <input type="number" min="0" value={children} onChange={e => setChildren(parseInt(e.target.value) || 0)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Budget (€)</label>
                   <input value={newOppValue} onChange={e => setNewOppValue(e.target.value)} type="number" placeholder="0.00" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Previsão Partida</label>
                <input value={newOppDeparture} onChange={e => setNewOppDeparture(e.target.value)} type="date" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Notas de Briefing</label>
                <textarea 
                  value={briefing} 
                  onChange={e => setBriefing(e.target.value)}
                  placeholder="Ex: Cliente prefere voos diretos, hotel com kids club..." 
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                ></textarea>
              </div>

              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-sm font-black text-blue-900 leading-tight">Fluxo comercial</p>
                <p className="text-[10px] text-blue-600 font-bold uppercase mt-0.5">A proposta será criada depois, no botão "Criar Proposta" dentro da oportunidade.</p>
              </div>
            </div>
            <div className="p-8 border-t bg-gray-50/80 flex justify-end gap-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-500 font-black hover:bg-gray-200 rounded-2xl transition text-xs uppercase tracking-widest">Descartar</button>
              <button type="submit" className="px-12 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-2xl shadow-blue-200 transition text-xs uppercase tracking-widest">Registar Lead</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PipelineView;
