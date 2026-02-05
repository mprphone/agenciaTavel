import React, { useState } from 'react';
import {
  X,
  Mail,
  Phone,
  Calendar,
  Users as UsersIcon,
  Tag as TagIcon,
  Plus,
  Trash2,
  ShieldCheck,
  MapPin,
  History,
  Upload,
  FileText,
  Paperclip,
  Globe,
  HeartPulse,
  Plane,
  Hotel,
  Wallet,
  AlertTriangle,
  BadgeCheck,
  UserRound,
  Languages,
} from 'lucide-react';
import { Client, CommChannel, Attachment } from '../types';
import { useApp } from '../AppContext';
import { STORAGE_BUCKETS, uploadFileToBucket } from '../storage';

interface Props {
  client: Client;
  onClose: () => void;
}

type TabId = 'perfil' | 'documentos' | 'preferencias' | 'financeiro' | 'viagens' | 'suporte';

const ClientDetailModal: React.FC<Props> = ({ client, onClose }) => {
  const { updateClient } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('perfil');

  const resolvedPassportExpiry = client.document?.type === 'Passaporte'
    ? client.document?.expiry || client.passportExpiry
    : client.passportExpiry;

  const resolvedDocumentType = client.document?.type || (resolvedPassportExpiry ? 'Passaporte' : undefined);
  const resolvedDocumentExpiry = client.document?.expiry || resolvedPassportExpiry;
  const expiryLabel = resolvedDocumentType === 'Passaporte' ? 'Validade Passaporte' : 'Validade Documento';

  const isPassportExpiring = resolvedPassportExpiry
    ? new Date(resolvedPassportExpiry) < new Date(new Date().setMonth(new Date().getMonth() + 6))
    : false;

  const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : 'Não registado');

  const displayValue = (value: React.ReactNode) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-gray-400 font-semibold">Não registado</span>;
    }
    return value;
  };

  const renderChips = (items?: string[], emptyLabel = 'Não registado') => {
    if (!items || items.length === 0) {
      return <p className="text-xs text-gray-400 font-medium">{emptyLabel}</p>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <span
            key={item}
            className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 uppercase tracking-tight"
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  const renderList = (items?: string[], emptyLabel = 'Sem registos') => {
    if (!items || items.length === 0) {
      return <p className="text-xs text-gray-400 font-medium italic">{emptyLabel}</p>;
    }
    return (
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item} className="text-sm font-medium text-gray-700 flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-blue-600"></span>
            {item}
          </li>
        ))}
      </ul>
    );
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { path, publicUrl } = await uploadFileToBucket({
        bucket: STORAGE_BUCKETS.documents,
        file,
        pathPrefix: `clients/${client.id}`,
      });

      const newAttachment: Attachment = {
        id: Math.random().toString(36).slice(2, 7),
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        url: publicUrl,
        bucket: STORAGE_BUCKETS.documents,
        path,
        uploadedAt: new Date().toISOString(),
      };

      await updateClient(client.id, { documents: [...(client.documents || []), newAttachment] });
    } catch (error) {
      console.error('Falha ao carregar documento:', error);
      alert('Não foi possível carregar o documento.');
    } finally {
      e.target.value = '';
    }
  };

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'perfil', label: 'Perfil' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'preferencias', label: 'Preferências' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'viagens', label: 'Viagens' },
    { id: 'suporte', label: 'Suporte' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center bg-blue-600 text-white rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-md">
              {client.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{client.name}</h2>
                {client.shortName && (
                  <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-white/20 rounded-full">
                    {client.shortName}
                  </span>
                )}
              </div>
              <p className="text-blue-100 flex items-center gap-1 text-sm">
                <Calendar size={14} /> Cliente desde {new Date(client.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar Details */}
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Essencial</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Mail size={18} className="text-blue-500" />
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Email</p>
                      <p className="text-sm font-medium truncate">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone size={18} className="text-green-500" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Telemóvel</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{client.phone}</p>
                        {client.commChannels.includes(CommChannel.WHATSAPP) && (
                          <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            WhatsApp
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Languages size={18} className="text-indigo-500" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Canal & Idioma</p>
                      <p className="text-sm font-medium">
                        {client.preferredChannel || 'Não registado'}{client.preferredLanguage ? ` • ${client.preferredLanguage}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <MapPin size={18} className="text-orange-500" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Localidade / País</p>
                      <p className="text-sm font-medium">{client.location || 'Não registado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Calendar size={18} className="text-purple-500" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Data de Nascimento</p>
                      <p className="text-sm font-medium">{formatDate(client.birthDate)}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${isPassportExpiring ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                    <ShieldCheck size={18} className={isPassportExpiring ? 'text-red-500' : 'text-green-500'} />
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">{expiryLabel}</p>
                      <p className={`text-sm font-bold ${isPassportExpiring ? 'text-red-600' : 'text-green-700'}`}>
                        {resolvedPassportExpiry ? formatDate(resolvedPassportExpiry) : 'Não registado'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Canais Preferenciais</h3>
                <div className="flex flex-wrap gap-2">
                  {client.commChannels.map(channel => (
                    <span key={channel} className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 uppercase tracking-tighter">
                      {channel}
                    </span>
                  ))}
                  {client.commChannels.length === 0 && (
                    <span className="text-xs text-gray-400">Não registado</span>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Etiquetas</h3>
                <div className="flex flex-wrap gap-2">
                  {client.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-[10px] font-black rounded-lg border border-gray-200 uppercase tracking-tight shadow-sm">
                      <TagIcon size={12} /> {tag}
                    </span>
                  ))}
                  {client.tags.length === 0 && (
                    <span className="text-xs text-gray-400">Sem etiquetas</span>
                  )}
                </div>
              </section>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-wrap gap-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'perfil' && (
                <div className="space-y-6">
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <UserRound size={14} className="text-blue-600" /> Identificação
                      </h4>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Nome completo</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{client.name}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Nome curto</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.shortName)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Nacionalidade</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.nationality)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Data de nascimento</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{formatDate(client.birthDate)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Localidade / País</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.location)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <BadgeCheck size={14} className="text-indigo-600" /> Contacto & Idioma
                      </h4>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Canal preferido</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferredChannel)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Idioma</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferredLanguage)}</p>
                        </div>
                        <div className="pt-3">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Canais preferenciais</p>
                          {renderChips(client.commChannels)}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Agregado Familiar */}
                  <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <UsersIcon size={16} className="text-blue-600" /> Agregado Familiar
                      </h3>
                      <button className="text-blue-600 hover:bg-blue-100 p-2 rounded-xl transition">
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {client.family.length > 0 ? client.family.map((member, i) => {
                        const meta = [
                          member.relationship,
                          member.birthDate ? `Nasc. ${formatDate(member.birthDate)}` : (member.age ? `${member.age} anos` : null),
                          member.documentType ? `${member.documentType}${member.documentNumber ? ` ${member.documentNumber}` : ''}` : null,
                        ].filter(Boolean).join(' • ');
                        return (
                          <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-bold">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-800">{member.name}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-black">{meta || 'Sem detalhes'}</p>
                                {member.preferences && (
                                  <p className="text-[10px] text-gray-500 mt-1">{member.preferences}</p>
                                )}
                              </div>
                            </div>
                            <button className="text-gray-300 hover:text-red-500 transition">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      }) : (
                        <div className="col-span-2 text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl text-gray-300 text-sm font-medium">
                          Nenhum familiar registado.
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Viaja frequentemente com */}
                  <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <UsersIcon size={16} className="text-indigo-600" /> Viaja frequentemente com
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {client.travelCompanions && client.travelCompanions.length > 0 ? client.travelCompanions.map((companion, i) => (
                        <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 font-bold">
                              {companion.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{companion.name}</p>
                              <p className="text-[10px] text-gray-400 uppercase font-black">
                                {[
                                  companion.relationship,
                                  companion.birthDate ? `Nasc. ${formatDate(companion.birthDate)}` : null,
                                  companion.documentType ? `${companion.documentType}${companion.documentNumber ? ` ${companion.documentNumber}` : ''}` : null,
                                ].filter(Boolean).join(' • ') || 'Sem detalhes'}
                              </p>
                              {companion.preferences && (
                                <p className="text-[10px] text-gray-500 mt-1">{companion.preferences}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-2 text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl text-gray-300 text-sm font-medium">
                          Sem acompanhantes frequentes.
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'documentos' && (
                <div className="space-y-6">
                  <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={16} className="text-blue-600" /> Documento Principal
                      </h3>
                      {resolvedPassportExpiry && (
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isPassportExpiring ? 'text-red-600' : 'text-green-600'}`}>
                          {isPassportExpiring ? 'A expirar' : 'Válido'}
                        </span>
                      )}
                    </div>
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Tipo</p>
                        <p className="text-sm font-bold text-gray-900 text-right">{displayValue(resolvedDocumentType)}</p>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Número</p>
                        <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.document?.number)}</p>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Validade</p>
                        <p className="text-sm font-bold text-gray-900 text-right">{displayValue(resolvedDocumentExpiry ? formatDate(resolvedDocumentExpiry) : undefined)}</p>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Nacionalidade</p>
                        <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.nationality)}</p>
                      </div>
                    </div>
                  </section>

                  <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[11px] text-amber-800 font-medium">
                    Nota GDPR: evita guardar scans/fotos sem necessidade. Se guardares, usa permissões e define prazo de retenção.
                  </section>

                  <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <Paperclip size={16} className="text-indigo-600" /> Documentos Anexados
                      </h3>
                      <label className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:bg-blue-700 transition shadow-lg shadow-blue-100">
                        <Upload size={14} /> Anexar
                        <input type="file" className="hidden" onChange={handleDocumentUpload} accept=".pdf,image/*" />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(client.documents || []).map(doc => (
                        <div key={doc.id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition">
                          <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                              <FileText size={20} />
                            </div>
                            <button className="text-gray-300 hover:text-red-500 transition">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="font-bold text-gray-900 truncate text-sm">{doc.name}</p>
                          <div className="flex justify-between items-center mt-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase">{doc.size}</span>
                            <button className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">Abrir</button>
                          </div>
                        </div>
                      ))}
                      {(client.documents || []).length === 0 && (
                        <div className="col-span-full py-16 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-white">
                          <Paperclip size={40} className="mb-4 opacity-10" />
                          <p className="text-sm font-bold uppercase tracking-widest opacity-40">Sem documentos anexados</p>
                          <p className="text-xs font-medium mt-1">Anexe CC, passaportes ou vistos quando necessário.</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'preferencias' && (
                <div className="space-y-6">
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <Globe size={16} className="text-blue-600" /> Estilo & Ritmo
                      </h3>
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Estilo</p>
                          {renderChips(client.preferences?.styles)}
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Ritmo</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferences?.pace)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Escalas</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferences?.stopoverTolerance)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Horários</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferences?.preferredTimes)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <Hotel size={16} className="text-indigo-600" /> Hotel
                      </h3>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Estrelas</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferences?.hotel?.stars)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Pequeno-almoço</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferences?.hotel?.breakfast)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Localização</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferences?.hotel?.location)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Cama</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferences?.hotel?.bed)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Acessibilidade</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferences?.hotel?.accessibility)}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <Plane size={16} className="text-blue-600" /> Voo
                      </h3>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Low-cost</p>
                          <p className="text-sm font-bold text-gray-900 text-right">
                            {displayValue(
                              client.preferences?.flight?.lowCostOk === undefined
                                ? undefined
                                : client.preferences.flight.lowCostOk ? 'Sim' : 'Não'
                            )}
                          </p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Bagagem</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferences?.flight?.baggage)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Assentos</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferences?.flight?.seats)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Companhias preferidas</p>
                          {renderChips(client.preferences?.flight?.preferredAirlines, 'Não registado')}
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Evitar</p>
                          {renderChips(client.preferences?.flight?.avoidAirlines, 'Não registado')}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <Wallet size={16} className="text-indigo-600" /> Orçamento
                      </h3>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Range típico</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferences?.budgetRange)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Sensibilidade preço</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferences?.priceSensitivity)}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                      <HeartPulse size={16} className="text-red-500" /> Saúde, Alimentação & Restrições
                    </h3>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Restrições alimentares</p>
                        {renderChips(client.health?.dietary)}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Mobilidade</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.health?.mobilityNotes)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Medicação/Condições</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.health?.medicalNotes)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Seguro</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.health?.insurancePreference)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800">
                      Notas sensíveis devem ter acesso limitado e consentimento explícito.
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'financeiro' && (
                <div className="space-y-6">
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <Wallet size={16} className="text-blue-600" /> Faturação (Corporate)
                      </h3>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">NIF</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.corporate?.taxId)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Nome na fatura</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.corporate?.invoiceName)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Morada</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.corporate?.billingAddress)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Empresa</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.corporate?.companyName)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Centro de custo</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.corporate?.costCenter)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <Wallet size={16} className="text-indigo-600" /> Resumo financeiro
                      </h3>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Orçamento típico</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferences?.budgetRange)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Sensibilidade</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.preferences?.priceSensitivity)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Valor total</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.loyalty?.totalValue)}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'viagens' && (
                <div className="space-y-6">
                  <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                      <History size={16} className="text-blue-600" /> Histórico & Destinos Preferidos
                    </h3>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Histórico</p>
                        <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.loyalty?.history)}</p>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Destinos preferidos</p>
                        <div className="text-right">{renderChips(client.loyalty?.favoriteDestinations, 'Não registado')}</div>
                      </div>
                    </div>
                  </section>

                  {/* Activity Timeline */}
                  <section>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <History size={16} /> Linha do Tempo de Viagens
                    </h3>
                    <div className="relative pl-6 border-l-2 border-gray-100 space-y-10">
                      <div className="relative">
                        <div className="absolute -left-8.5 top-0 w-5 h-5 bg-blue-600 border-4 border-white rounded-full shadow-sm"></div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm ml-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black text-blue-600 uppercase">Reserva Ativa • Ago 2024</span>
                            <span className="text-xs font-bold text-gray-400">Pendente</span>
                          </div>
                          <h4 className="font-bold text-gray-900">Safari na Tanzânia e Zanzibar</h4>
                          <p className="text-xs text-gray-500 mt-1">Status: À espera de regresso em 15/08</p>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-8.5 top-0 w-5 h-5 bg-gray-200 border-4 border-white rounded-full shadow-sm"></div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 ml-4 opacity-60">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase">Viagem Concluída • Mar 2023</span>
                          </div>
                          <h4 className="font-bold text-gray-900">Cruzeiro no Mediterrâneo</h4>
                          <p className="text-xs text-gray-500 mt-1">Gasto total: €4,200 • 2 Passageiros</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'suporte' && (
                <div className="space-y-6">
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={16} className="text-orange-600" /> Segurança & Emergência
                      </h3>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Contacto de emergência</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.emergency?.name)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Telefone</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.emergency?.phone)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Canal preferido</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.emergency?.preferredChannel)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <BadgeCheck size={16} className="text-blue-600" /> Satisfação & Notas
                      </h3>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">NPS</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.loyalty?.nps)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Notas consultor</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.loyalty?.consultantNotes)}</p>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Motivo de perda</p>
                          <p className="text-sm font-bold text-gray-900 text-right">{displayValue(client.loyalty?.lossReason)}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-600" /> Operação & Risco
                    </h3>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Observações importantes</p>
                        <p className="text-sm font-medium text-gray-700">{displayValue(client.operations?.importantNotes)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Pendências</p>
                        {renderList(client.operations?.pendingItems, 'Sem pendências')}
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Alertas automáticos</p>
                        {renderList(client.operations?.autoAlerts, 'Sem alertas automáticos')}
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-between items-center">
          <button className="text-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-widest">Eliminar Ficha</button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition text-sm">Fechar</button>
            <button className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 shadow-xl shadow-blue-200 transition active:scale-95 text-sm">Editar Perfil</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailModal;
