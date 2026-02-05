
import React, { useMemo, useState } from 'react';
import { 
  Wallet, 
  Search, 
  Calendar, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  MoreVertical,
  Paperclip,
  TrendingUp,
  Download
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Opportunity, PaymentMilestone, PaymentStatus } from '../types';
import OpportunityDetailModal from './OpportunityDetailModal';

const PaymentBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const styles = {
    [PaymentStatus.PAID]: 'bg-green-100 text-green-700 border-green-200',
    [PaymentStatus.OVERDUE]: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
    [PaymentStatus.PARTIAL]: 'bg-blue-100 text-blue-700 border-blue-200',
    [PaymentStatus.MISSING]: 'bg-gray-100 text-gray-600 border-gray-200'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border tracking-tight ${styles[status]}`}>
      {status}
    </span>
  );
};

const PaymentsView = () => {
  const { opportunities, clients, updateOpportunity } = useApp();
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'recebimentos' | 'controlo'>('recebimentos');

  // Apenas oportunidades ganhas ou em negociação avançada costumam ter planos de pagamento
  const financialOpps = opportunities.filter(o => o.paymentPlan && o.paymentPlan.length > 0);
  
  const totalReceivable = financialOpps.reduce((acc, o) => 
    acc + o.paymentPlan.reduce((mAcc, m) => m.status !== PaymentStatus.PAID ? mAcc + (m.amount - m.paidAmount) : mAcc, 0)
  , 0);

  const totalOverdue = financialOpps.reduce((acc, o) => 
    acc + o.paymentPlan.reduce((mAcc, m) => m.status === PaymentStatus.OVERDUE ? mAcc + (m.amount - m.paidAmount) : mAcc, 0)
  , 0);

  const filtered = financialOpps.filter(o => {
    const clientName = clients.find(c => c.id === o.clientId)?.name || '';
    return o.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           clientName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const paymentRows = useMemo(() => (
    financialOpps.flatMap(opp => {
      const client = clients.find(c => c.id === opp.clientId);
      return opp.paymentPlan.map(milestone => ({
        opportunity: opp,
        milestone,
        clientName: client?.name || '—',
      }));
    })
  ), [financialOpps, clients]);

  const filteredRows = paymentRows.filter(row => {
    const term = searchTerm.toLowerCase();
    return row.opportunity.title.toLowerCase().includes(term) || row.clientName.toLowerCase().includes(term);
  });

  const updateMilestone = (oppId: string, milestoneId: string, updates: Partial<PaymentMilestone>) => {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;
    const nextPlan = opp.paymentPlan.map(m =>
      m.id === milestoneId ? { ...m, ...updates } : m
    );
    updateOpportunity(oppId, { paymentPlan: nextPlan });
  };

  const handleMarkPaid = (oppId: string, milestoneId: string, amount: number) => {
    updateMilestone(oppId, milestoneId, {
      status: PaymentStatus.PAID,
      paidAmount: amount,
      paidAt: new Date().toISOString(),
    });
  };

  const handleMarkMissing = (oppId: string, milestoneId: string) => {
    updateMilestone(oppId, milestoneId, {
      status: PaymentStatus.MISSING,
      paidAmount: 0,
      paidAt: undefined,
    });
  };

  const handleMarkOverdue = (oppId: string, milestoneId: string) => {
    updateMilestone(oppId, milestoneId, {
      status: PaymentStatus.OVERDUE,
    });
  };

  const handleMarkPartial = (oppId: string, milestone: (typeof paymentRows)[number]['milestone']) => {
    const raw = window.prompt('Valor recebido (€):', milestone.paidAmount ? String(milestone.paidAmount) : '');
    if (raw === null) return;
    const value = Number.parseFloat(raw.replace(',', '.'));
    if (!Number.isFinite(value) || value < 0) {
      alert('Indique um valor válido.');
      return;
    }
    if (value >= milestone.amount) {
      handleMarkPaid(oppId, milestone.id, milestone.amount);
      return;
    }
    if (value === 0) {
      handleMarkMissing(oppId, milestone.id);
      return;
    }
    updateMilestone(oppId, milestone.id, {
      status: PaymentStatus.PARTIAL,
      paidAmount: value,
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Área Financeira</h1>
          <p className="text-gray-500 font-medium">Controlo de recebimentos, marcos e reconciliação bancária.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-6 py-3 bg-white border border-gray-200 rounded-2xl font-black text-xs uppercase text-gray-600 hover:bg-gray-50 transition flex items-center gap-2">
             <Download size={18} /> Exportar Mapas
           </button>
           <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-blue-100 hover:bg-blue-700 transition flex items-center gap-2">
             <TrendingUp size={18} /> Metas Mensais
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Wallet size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total a Receber</p>
            <h3 className="text-3xl font-black text-gray-900">€{totalReceivable.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-red-50 p-8 rounded-3xl border border-red-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
            <AlertCircle size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Em Atraso (Overdue)</p>
            <h3 className="text-3xl font-black text-red-600">€{totalOverdue.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-green-50 p-8 rounded-3xl border border-green-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest leading-none mb-1">Liquidado este Mês</p>
            <h3 className="text-3xl font-black text-green-700">€12.450</h3>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('recebimentos')}
          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition ${
            activeTab === 'recebimentos'
              ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
              : 'bg-white text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Recebimentos
        </button>
        <button
          onClick={() => setActiveTab('controlo')}
          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition ${
            activeTab === 'controlo'
              ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
              : 'bg-white text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Controlo de Pagamentos
        </button>
      </div>

      {activeTab === 'recebimentos' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar por cliente ou viagem..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100">
                 <button className="px-4 py-2 bg-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Todos</button>
                 <button className="px-4 py-2 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-gray-600">Pendentes</button>
                 <button className="px-4 py-2 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-gray-600">Liquidados</button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Viagem / Cliente</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Marcos de Pagamento</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Total</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Próxima Data</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(opp => {
                  const client = clients.find(c => c.id === opp.clientId);
                  const nextMilestone = opp.paymentPlan.find(m => m.status !== PaymentStatus.PAID);
                  const totalOpp = opp.paymentPlan.reduce((acc, m) => acc + m.amount, 0);

                  return (
                    <tr 
                      key={opp.id} 
                      className="hover:bg-blue-50/30 transition-all cursor-pointer group"
                      onClick={() => setSelectedOpp(opp)}
                    >
                      <td className="px-8 py-6">
                        <div>
                          <p className="font-black text-gray-900 group-hover:text-blue-600 transition">{opp.title}</p>
                          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-tighter">{client?.name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center gap-1.5">
                          {opp.paymentPlan.map(m => (
                            <div 
                              key={m.id} 
                              title={`${m.label}: €${m.amount} (${m.status})`}
                              className={`w-3 h-3 rounded-full ${
                                m.status === PaymentStatus.PAID ? 'bg-green-500' : 
                                m.status === PaymentStatus.OVERDUE ? 'bg-red-500 animate-pulse' : 
                                m.status === PaymentStatus.PARTIAL ? 'bg-blue-500' : 'bg-gray-200'
                              }`}
                            ></div>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-gray-900">€{totalOpp.toLocaleString()}</p>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full mt-2 overflow-hidden max-w-[120px]">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${(opp.paymentPlan.filter(m => m.status === PaymentStatus.PAID).length / opp.paymentPlan.length) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {nextMilestone ? (
                          <div className="flex flex-col">
                             <span className={`text-xs font-black ${nextMilestone.status === PaymentStatus.OVERDUE ? 'text-red-600' : 'text-gray-900'}`}>
                               {new Date(nextMilestone.dueDate).toLocaleDateString()}
                             </span>
                             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{nextMilestone.label}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-black text-green-600 uppercase flex items-center gap-1">
                            <CheckCircle2 size={14} /> Liquidado
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex justify-end items-center gap-3">
                           <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition shadow-sm">
                             <Paperclip size={18} />
                           </button>
                           <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-200 transition">
                             <MoreVertical size={18} />
                           </button>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'controlo' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar por cliente ou viagem..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm"
              />
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {filteredRows.length} marcos encontrados
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {filteredRows.map(({ opportunity, milestone, clientName }) => (
              <div key={milestone.id} className="p-6 flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Viagem / Cliente</p>
                  <p className="text-lg font-black text-gray-900 mt-2">{opportunity.title}</p>
                  <p className="text-xs font-bold text-gray-400 uppercase mt-1">{clientName}</p>
                </div>
                <div className="w-full lg:w-72">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Marco</p>
                  <p className="text-sm font-bold text-gray-900 mt-2">{milestone.label}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs font-bold text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(milestone.dueDate).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><ArrowUpRight size={12} /> €{milestone.amount.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Pago: €{milestone.paidAmount?.toLocaleString() || 0}</p>
                </div>
                <div className="w-full lg:w-80">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</p>
                    <PaymentBadge status={milestone.status} />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => handleMarkPaid(opportunity.id, milestone.id, milestone.amount)}
                      className="px-3 py-2 rounded-xl bg-green-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition"
                    >
                      Pago
                    </button>
                    <button
                      onClick={() => handleMarkPartial(opportunity.id, milestone)}
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition"
                    >
                      Parcial
                    </button>
                    <button
                      onClick={() => handleMarkOverdue(opportunity.id, milestone.id)}
                      className="px-3 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition"
                    >
                      Em Atraso
                    </button>
                    <button
                      onClick={() => handleMarkMissing(opportunity.id, milestone.id)}
                      className="px-3 py-2 rounded-xl bg-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-300 transition"
                    >
                      Em Falta
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredRows.length === 0 && (
              <div className="p-10 text-center text-gray-400 text-sm font-bold uppercase tracking-widest">
                Nenhum marco de pagamento encontrado
              </div>
            )}
          </div>
        </div>
      )}

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

export default PaymentsView;
