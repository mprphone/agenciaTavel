import React, { useMemo, useState } from 'react';
import { Plus, Target, Calendar, User, TrendingUp, MapPin, Plane, Hotel, Clock, Tag, Car } from 'lucide-react';
import { useApp } from '../AppContext';
import { Campaign, OpportunityStatus } from '../types';

const uid = () => Math.random().toString(36).slice(2, 9);

const CampaignsView: React.FC = () => {
  const { campaigns, opportunities, employees, addCampaign } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [packageType, setPackageType] = useState<Campaign['packageType']>('Campanha');
  const [travelType, setTravelType] = useState('');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('');
  const [hotel, setHotel] = useState('');
  const [flight, setFlight] = useState('');
  const [transfer, setTransfer] = useState('');
  const [targetSales, setTargetSales] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [owner, setOwner] = useState('');

  const statsByCampaign = useMemo(() => {
    const map: Record<string, { won: number; open: number; valueWon: number }> = {};
    for (const c of campaigns) {
      map[c.id] = { won: 0, open: 0, valueWon: 0 };
    }
    for (const o of opportunities) {
      if (!o.campaignId || !map[o.campaignId]) continue;
      if (o.status === OpportunityStatus.WON) {
        map[o.campaignId].won += 1;
        map[o.campaignId].valueWon += o.limitValue || 0;
      } else if (o.status === OpportunityStatus.OPEN) {
        map[o.campaignId].open += 1;
      }
    }
    return map;
  }, [campaigns, opportunities]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Indique um nome para o pacote.');
      return;
    }
    const daysCount = parseInt(days || '0', 10);
    if (!travelType.trim() || !destination.trim() || !hotel.trim() || !flight.trim() || !Number.isFinite(daysCount) || daysCount <= 0) {
      alert('Preencha tipo de viagem, local, nº de dias, hotel e voo.');
      return;
    }
    const tsParsed = parseInt(targetSales || '', 10);
    const targetSalesValue = Number.isFinite(tsParsed) && tsParsed > 0 ? tsParsed : undefined;

    const campaign: Campaign = {
      id: uid(),
      name: name.trim(),
      description: description.trim() || undefined,
      packageType: packageType || undefined,
      travelType: travelType.trim(),
      destination: destination.trim(),
      days: daysCount,
      hotel: hotel.trim(),
      flight: flight.trim(),
      transfer: transfer.trim() || undefined,
      startAt: startAt || undefined,
      endAt: endAt || undefined,
      targetSales: targetSalesValue,
      owner: owner || undefined,
      status: 'Ativa',
      createdAt: new Date().toISOString(),
    };

    await addCampaign(campaign);
    setIsModalOpen(false);
    setName('');
    setDescription('');
    setPackageType('Campanha');
    setTravelType('');
    setDestination('');
    setDays('');
    setHotel('');
    setFlight('');
    setTransfer('');
    setTargetSales('');
    setStartAt('');
    setEndAt('');
    setOwner('');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Pacotes de Ofertas</h1>
          <p className="text-gray-500 font-medium">Crie pacotes de campanha ou pacotes fechados com tipo de viagem, local, nº de dias, hotel, voo e transfer.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black flex items-center gap-3 hover:bg-blue-700 shadow-2xl shadow-blue-200 transition active:scale-95 text-sm uppercase tracking-widest"
        >
          <Plus size={20} /> Novo Pacote
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {campaigns.map(c => {
          const s = statsByCampaign[c.id] || { won: 0, open: 0, valueWon: 0 };
          const targetSalesValue = c.targetSales || 0;
          const pct = targetSalesValue > 0 ? Math.min(100, Math.round((s.won / targetSalesValue) * 100)) : 0;
          const badgeStyle = c.packageType === 'Fechado'
            ? 'text-gray-700 bg-gray-100 border-gray-200'
            : 'text-blue-700 bg-blue-50 border-blue-200';
          return (
            <div key={c.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-gray-900 truncate">{c.name}</h3>
                  {c.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description}</p>}
                </div>
                <div className={`flex items-center gap-2 text-xs font-black px-3 py-1 rounded-full uppercase border ${badgeStyle}`}>
                  <Tag size={14} /> {c.packageType || 'Campanha'}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs font-bold text-gray-600">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2">
                  <MapPin size={14} className="text-blue-600" /> {c.destination || 'Destino'}
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2">
                  <Clock size={14} className="text-blue-600" /> {c.days ? `${c.days} dias` : 'Duração'}
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2">
                  <Hotel size={14} className="text-blue-600" /> {c.hotel || 'Hotel'}
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2">
                  <Plane size={14} className="text-blue-600" /> {c.flight || 'Voo'}
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2">
                  <Car size={14} className="text-blue-600" /> {c.transfer || 'Transfer'}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {targetSalesValue > 0 ? (
                  <>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-3 bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                      <span className="flex items-center gap-2"><TrendingUp size={14} /> Progresso</span>
                      <span className="text-gray-900 font-black">{pct}%</span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sem meta definida</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-black uppercase">Vendas Ganhas</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{s.won}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-2">€{Math.round(s.valueWon).toLocaleString('pt-PT')}</p>
                </div>
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-[10px] text-blue-400 font-black uppercase">Em Curso</p>
                  <p className="text-2xl font-black text-blue-700 mt-1">{s.open}</p>
                  <p className="text-[10px] text-blue-400 font-bold mt-2">Leads associados</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-6 text-[10px] font-black uppercase">
                {(c.startAt || c.endAt) && (
                  <span className="flex items-center gap-1 text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">
                    <Calendar size={12} /> {c.startAt ? new Date(c.startAt).toLocaleDateString('pt-PT') : '—'} → {c.endAt ? new Date(c.endAt).toLocaleDateString('pt-PT') : '—'}
                  </span>
                )}
                {c.owner && (
                  <span className="flex items-center gap-1 text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                    <User size={12} /> {c.owner}
                  </span>
                )}
                {c.travelType && (
                  <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
                    <Target size={12} /> {c.travelType}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[200]">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Novo Pacote de Oferta</h2>
                <p className="text-sm text-gray-500 font-medium">Define o pacote com tipo de viagem, local, nº de dias, hotel, voo e transfer.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase">Nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Pacote Verão 2026 – Ilhas"
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="O que estamos a promover e porquê (curto)."
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Tipo de Pacote</label>
                  <select
                    value={packageType || 'Campanha'}
                    onChange={(e) => setPackageType(e.target.value as Campaign['packageType'])}
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Campanha">Campanha</option>
                    <option value="Fechado">Fechado</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Tipo de Viagem</label>
                  <input
                    value={travelType}
                    onChange={(e) => setTravelType(e.target.value)}
                    placeholder="Ex.: Praia, Lua de Mel, Circuito"
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Local (Destino)</label>
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Ex.: Barcelona, Lisboa, Caribe"
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Nº de Dias</label>
                  <input
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    type="number"
                    min={1}
                    placeholder="Ex.: 7"
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Hotel</label>
                  <input
                    value={hotel}
                    onChange={(e) => setHotel(e.target.value)}
                    placeholder="Ex.: Hotel X 4*"
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Voo</label>
                  <input
                    value={flight}
                    onChange={(e) => setFlight(e.target.value)}
                    placeholder="Ex.: TAP direto Lisboa ↔ Roma"
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="text-xs font-black text-gray-500 uppercase">Transfer (opcional)</label>
                  <input
                    value={transfer}
                    onChange={(e) => setTransfer(e.target.value)}
                    placeholder="Ex.: Transfer privado aeroporto-hotel"
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Meta (vendas) opcional</label>
                  <input
                    value={targetSales}
                    onChange={(e) => setTargetSales(e.target.value)}
                    type="number"
                    min={1}
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Início</label>
                  <input
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    type="date"
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Fim</label>
                  <input
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    type="date"
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase">Responsável</label>
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">—</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.name}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-2xl font-black text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsView;
