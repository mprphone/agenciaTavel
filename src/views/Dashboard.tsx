
import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  CheckCircle, 
  Clock, 
  FileText, 
  ArrowUpRight, 
  AlertTriangle, 
  PlaneLanding, 
  CalendarCheck 
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Client } from '../types';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
        {trend && (
          <div className="flex items-center gap-1 text-green-600 text-[10px] font-bold">
            <TrendingUp size={12} /> {trend}
          </div>
        )}
      </div>
      <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-current/10`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { clients, opportunities } = useApp();
  
  const totalValue = opportunities.reduce((acc, opp) => acc + opp.limitValue, 0);
  const wonOpportunities = opportunities.filter(o => o.stage === 'GANHO').length;
  const proposalsSent = opportunities.filter(o => o.stage === 'PROPOSTA ENVIADA').length;

  const getPassportExpiry = (c: Client) => (
    c.document?.type === 'Passaporte' ? (c.document.expiry || c.passportExpiry) : c.passportExpiry
  );

  const expiringPassports = clients.filter(c => {
    const expiryValue = getPassportExpiry(c);
    if (!expiryValue) return false;
    const expiry = new Date(expiryValue);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 180; // Alerta se expira em menos de 6 meses
  });

  const returningTravelers = opportunities.filter(o => {
    if (!o.returnDate || o.stage !== 'GANHO') return false;
    const returnDate = new Date(o.returnDate);
    const today = new Date();
    return returnDate.getMonth() === today.getMonth();
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total em Pipeline" 
          value={`€${totalValue.toLocaleString()}`} 
          icon={Wallet} 
          color="bg-blue-600"
          trend="+12.5% vs mês anterior"
        />
        <StatCard 
          title="Clientes Ativos" 
          value={clients.length.toString()} 
          icon={Users} 
          color="bg-indigo-600"
          trend="+3 novos esta semana"
        />
        <StatCard 
          title="Propostas Enviadas" 
          value={proposalsSent.toString()} 
          icon={FileText} 
          color="bg-purple-600"
        />
        <StatCard 
          title="Vendas Ganhas" 
          value={wonOpportunities.toString()} 
          icon={CheckCircle} 
          color="bg-green-600"
          trend="Taxa de conversão: 24%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-800 tracking-tight">Atividade Recente</h3>
              <button className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline">
                Ver tudo <ArrowUpRight size={16} />
              </button>
            </div>
            
            <div className="space-y-6">
              {opportunities.slice(0, 4).map((opp) => (
                <div key={opp.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{opp.title}</p>
                      <p className="text-xs text-gray-500">Status: <span className="font-bold text-blue-600 uppercase text-[10px]">{opp.stage}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900">€{opp.limitValue.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(opp.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lifecycle Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-orange-500 rounded-lg text-white">
                      <AlertTriangle size={18} />
                   </div>
                   <h4 className="font-black text-orange-900 uppercase text-[11px] tracking-widest">Passaportes a Expirar</h4>
                </div>
                <div className="space-y-3">
                   {expiringPassports.length > 0 ? expiringPassports.map(c => (
                     <div key={c.id} className="flex justify-between items-center text-sm bg-white p-3 rounded-xl border border-orange-200">
                        <span className="font-bold text-gray-800">{c.name}</span>
                        <span className="text-orange-600 font-black text-xs">{new Date(getPassportExpiry(c)!).toLocaleDateString()}</span>
                     </div>
                   )) : (
                     <p className="text-orange-400 text-xs font-medium italic">Tudo em conformidade.</p>
                   )}
                </div>
             </div>

             <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-blue-500 rounded-lg text-white">
                      <PlaneLanding size={18} />
                   </div>
                   <h4 className="font-black text-blue-900 uppercase text-[11px] tracking-widest">Regressos este mês</h4>
                </div>
                <div className="space-y-3">
                   {returningTravelers.length > 0 ? returningTravelers.map(o => (
                     <div key={o.id} className="flex justify-between items-center text-sm bg-white p-3 rounded-xl border border-blue-200">
                        <span className="font-bold text-gray-800">{o.title}</span>
                        <span className="text-blue-600 font-black text-xs">{new Date(o.returnDate!).toLocaleDateString()}</span>
                     </div>
                   )) : (
                     <p className="text-blue-400 text-xs font-medium italic">Nenhum regresso previsto.</p>
                   )}
                </div>
             </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 sticky top-24">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2">
            <CalendarCheck size={20} /> Objetivos da Agência
          </h3>
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span>Volume de Vendas (Meta: €50k)</span>
                <span>75%</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full w-[75%] shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span>Novos Clientes (Meta: 20)</span>
                <span>40%</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full w-[40%] shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
              </div>
            </div>
            
            <div className="pt-8 border-t border-white/10 mt-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4">Próximos Aniversários</h4>
              <div className="space-y-4">
                {clients.slice(0, 2).map(c => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">
                      {new Date(c.birthDate).getDate()}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{c.name}</p>
                      <p className="text-[10px] opacity-60">Celebra em 12 dias</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
