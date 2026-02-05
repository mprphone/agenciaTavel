
import React, { useState } from 'react';
import { 
  Compass, Search, Plane, Hotel, Car, MapPin, 
  CheckCircle2, AlertTriangle, MessageSquare, 
  Calendar, FileText, ChevronRight, User, Clock,
  MoreVertical, ShieldCheck, LifeBuoy
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Opportunity, ServiceType, OpportunityStatus } from '../types';
import OpportunityDetailModal from './OpportunityDetailModal';

const OperationsView = () => {
  const { opportunities, clients } = useApp();
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const activeTrips = opportunities.filter(o => 
    o.status === OpportunityStatus.WON && 
    o.departureDate && 
    new Date(o.departureDate) >= new Date(new Date().setMonth(new Date().getMonth() - 1))
  );

  const filtered = activeTrips.filter(o => {
    const clientName = clients.find(c => c.id === o.clientId)?.name || '';
    return o.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           clientName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Operação & Acompanhamento</h1>
          <p className="text-gray-500 font-medium">Controlo de partidas, itinerários e suporte 24h.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase border border-red-100 flex items-center gap-2 hover:bg-red-100 transition animate-pulse">
             <LifeBuoy size={18} /> Casos Críticos (2)
           </button>
           <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-blue-100 hover:bg-blue-700 transition">
             Relatório Operacional
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
           <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                 <div className="relative w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar por viajante ou destino..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm shadow-sm"
                    />
                 </div>
                 <div className="flex bg-white rounded-xl p-1 border border-gray-100 shadow-sm">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">Ativas</button>
                    <button className="px-4 py-2 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-gray-600">Próximas</button>
                    <button className="px-4 py-2 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-gray-600">Concluídas</button>
                 </div>
              </div>

              <div className="divide-y divide-gray-50">
                 {filtered.map(opp => {
                    const client = clients.find(c => c.id === opp.clientId);
                    const checklistProgress = (opp.checklist.filter(c => c.isCompleted).length / opp.checklist.length) * 100;
                    
                    return (
                      <div key={opp.id} onClick={() => setSelectedOpp(opp)} className="p-8 hover:bg-blue-50/30 transition-all cursor-pointer group flex items-center justify-between gap-8">
                         <div className="flex items-center gap-6 flex-1">
                            <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                               <MapPin size={28} />
                            </div>
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${opp.tripType === 'Corporate' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {opp.tripType || 'Lazer'}
                                  </span>
                                  <span className="text-gray-300 text-[10px] font-black">•</span>
                                  <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Partida em {new Date(opp.departureDate!).toLocaleDateString()}</span>
                               </div>
                               <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition">{opp.title}</h3>
                               <p className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-1"><User size={12} className="text-blue-500" /> {client?.name}</p>
                            </div>
                         </div>

                         <div className="flex flex-col items-end gap-3 min-w-[200px]">
                            <div className="w-full">
                               <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                  <span>Checklist Pré-Viagem</span>
                                  <span className={checklistProgress === 100 ? 'text-green-600' : 'text-blue-600'}>{Math.round(checklistProgress)}%</span>
                               </div>
                               <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                                  <div className={`h-full transition-all duration-1000 ${checklistProgress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${checklistProgress}%` }}></div>
                               </div>
                            </div>
                            <div className="flex items-center gap-2">
                               {opp.itinerary.length > 0 && <span className="flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg"><Calendar size={10} /> {opp.itinerary.length} Itens</span>}
                               {opp.supportCases.some(s => s.status === 'open') && <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg animate-pulse"><AlertTriangle size={10} /> Suporte Ativo</span>}
                            </div>
                         </div>

                         <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                      </div>
                    );
                 })}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Canal de Suporte Viajante</h4>
              <div className="space-y-4">
                 <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                       <MessageSquare size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Novo Caso #S992</p>
                       <p className="text-xs font-bold text-gray-800 leading-tight">Voo de regresso TK1756 cancelado em Istambul.</p>
                       <p className="text-[9px] text-gray-400 mt-2 font-black uppercase tracking-tighter">Viajante: Marco Rebelo</p>
                    </div>
                 </div>
                 
                 <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-4 opacity-70">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                       <CheckCircle2 size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resolvido • Hoje 09:12</p>
                       <p className="text-xs font-bold text-gray-500 leading-tight">Pedido de upgrade de quarto no Gran Melia Arusha.</p>
                    </div>
                 </div>
              </div>
              <button className="w-full mt-6 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-gray-800 transition">Ver Central de Apoio</button>
           </div>

           <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-200">
              <h4 className="text-xs font-black uppercase tracking-widest mb-6 opacity-70">Regras de Automação</h4>
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                    <p className="text-xs font-bold">Lembrete Check-in (T-24h)</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                    <p className="text-xs font-bold">Inquérito Qualidade (T+2d)</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <p className="text-xs font-bold opacity-70 italic">Alerta de Atraso Voo (Beta)</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {selectedOpp && (
        <OpportunityDetailModal 
          opportunity={selectedOpp} 
          client={clients.find(c => c.id === selectedOpp.clientId)}
          onClose={() => setSelectedOpp(null)} 
        />
      )}
    </div>
  );
};

export default OperationsView;
