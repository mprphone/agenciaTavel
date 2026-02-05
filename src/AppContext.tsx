import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import {
  Client,
  Opportunity,
  Employee,
  Campaign,
  Supplier,
  AiDraft,
  ProposalOption,
  ServiceType,
  Task,
  OpportunityStatus,
  Attachment,
  PaymentMilestone,
  PaymentStatus,
  AuditLog,
  CommChannel,
} from './types';
import { DEFAULT_PIPELINE } from './constants';
import { TravelAPI } from './api';

type Stage = 'NOVO' | 'BRIEFING' | 'PROPOSTA' | 'NEGOCIAÇÃO' | 'FECHADO';

type StageCheck = { met: boolean; missing: string[] };

type StageMoveResult =
  | { ok: true }
  | { ok: false; reason: string; missing?: string[] };

interface AppContextType {
  clients: Client[];
  opportunities: Opportunity[];
  employees: Employee[];
  campaigns: Campaign[];
  suppliers: Supplier[];
  isLoading: boolean;

  addClient: (client: Client) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  addOpportunity: (opp: Opportunity) => Promise<void>;
  updateOpportunity: (id: string, updates: Partial<Opportunity>) => Promise<void>;
  moveOpportunityStage: (id: string, targetStage: Stage, meta?: { reason?: string }) => Promise<StageMoveResult>;

  addEmployee: (employee: Employee) => Promise<void>;
  generateProposals: (opportunity: Opportunity) => ProposalOption[];
  checkStageRequirements: (opp: Opportunity, targetStage: Stage) => StageCheck;

  analyzeWithAI: (opportunity: Opportunity) => Promise<string>;
  generateDraftWithAI: (opportunity: Opportunity, kind: AiDraft['type'], createdBy?: string) => Promise<AiDraft>;
  addAttachment: (oppId: string, attachment: Attachment) => Promise<void>;

  addCampaign: (campaign: Campaign) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  addSupplier: (supplier: Supplier) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const uid = () => Math.random().toString(36).slice(2, 9);

const daysFromNow = (d: number) => {
  const now = new Date();
  return new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();
};

const buildPaymentPlan = (opp: Opportunity): PaymentMilestone[] => {
  const total = Math.max(0, opp.limitValue || 0);
  const dep = opp.departureDate ? new Date(opp.departureDate) : null;

  const milestone = (label: string, amount: number, dueDateIso: string): PaymentMilestone => ({
    id: uid(),
    label,
    amount,
    dueDate: dueDateIso,
    status: PaymentStatus.MISSING,
    paidAmount: 0,
  });

  // Datas úteis: se houver partida, usar T-30 e T-15; senão usar +7/+21
  const d1 = daysFromNow(3);
  const d2 = dep ? new Date(dep.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() : daysFromNow(14);
  const d3 = dep ? new Date(dep.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString() : daysFromNow(28);

  const a1 = Math.round(total * 0.3);
  const a2 = Math.round(total * 0.4);
  const a3 = Math.max(0, total - a1 - a2);

  return [
    milestone('Sinal (30%)', a1, d1),
    milestone('2ª Prestação (40%)', a2, d2),
    milestone('Saldo (30%)', a3, d3),
  ];
};

const createAutoTasks = (opp: Opportunity, newStage: Stage): Task[] => {
  const tasks: Task[] = [...(opp.tasks || [])];
  const pushIfMissing = (title: string, dueDate: string, type: Task['type']) => {
    const exists = tasks.some(t => t.title === title && !t.isCompleted);
    if (!exists) tasks.push({ id: uid(), title, dueDate, isCompleted: false, type });
  };

  if (newStage === 'BRIEFING') {
    pushIfMissing('Completar briefing (datas, orçamento, motivo)', daysFromNow(1), 'other');
  }

  if (newStage === 'PROPOSTA') {
    pushIfMissing('Enviar proposta (link/app ou PDF)', daysFromNow(0), 'document');
    pushIfMissing('Follow-up 24h: confirmar receção e dúvidas', daysFromNow(1), 'follow-up');
    pushIfMissing('Follow-up 72h: decisão/ajustes', daysFromNow(3), 'follow-up');
  }

  if (newStage === 'NEGOCIAÇÃO') {
    pushIfMissing('Rever objeções (preço/datas/hotel) e criar versão 2', daysFromNow(1), 'other');
    pushIfMissing('Follow-up 24h: enviar alternativa/ajuste', daysFromNow(1), 'follow-up');
  }

  if (newStage === 'FECHADO') {
    pushIfMissing('Confirmar reservas e emitir vouchers', daysFromNow(0), 'other');
    pushIfMissing('Validar pagamentos e plano financeiro', daysFromNow(0), 'payment');
    pushIfMissing('Checklist pré-viagem (documentos, seguros, check-in)', daysFromNow(2), 'document');
  }

  return tasks;
};

const addHistory = (opp: Opportunity, action: string, user = 'Sistema'): AuditLog[] => {
  const history = [...(opp.history || [])];
  history.unshift({ id: uid(), user, action, timestamp: new Date().toISOString() });
  return history;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      try {
        const [c, o, e, camps, sups] = await Promise.all([
          TravelAPI.getClients(),
          TravelAPI.getOpportunities(),
          TravelAPI.getEmployees(),
          TravelAPI.getCampaigns(),
          TravelAPI.getSuppliers(),
        ]);
        setClients(c);
        setOpportunities(o);
        setEmployees(e);
        setCampaigns(camps);
        setSuppliers(sups);
      } catch (err) {
        console.error('Falha ao carregar dados da base de dados:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  // Motor de alertas automáticos (MVP): cria tarefas com base em prazos.
  const isAutoAlertRunning = useRef(false);

  const ensureDeadlineAlerts = (opp: Opportunity): Partial<Opportunity> | null => {
    const tasks = [...(opp.tasks || [])];
    const now = new Date();

    const pushTask = (title: string, dueDateIso: string, type: Task['type']) => {
      const exists = tasks.some(t => t.title === title && !t.isCompleted);
      if (!exists) tasks.push({ id: uid(), title, dueDate: dueDateIso, isCompleted: false, type });
    };

    // Proposta a expirar (quoteExpiry)
    if (opp.quoteExpiry && (opp.stage === 'PROPOSTA' || opp.stage === 'NEGOCIAÇÃO')) {
      const exp = new Date(opp.quoteExpiry);
      const diffHours = (exp.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 24 && diffHours > 0) {
        pushTask('Alerta: proposta expira em menos de 24h', opp.quoteExpiry, 'follow-up');
      }
      if (diffHours <= 0) {
        pushTask('Alerta: proposta expirada – confirmar novo preço/condições', now.toISOString(), 'follow-up');
      }
    }

    // Pagamentos próximos (até 48h)
    if (opp.paymentPlan?.length) {
      for (const m of opp.paymentPlan) {
        const due = new Date(m.dueDate);
        const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
        if ((m.status === PaymentStatus.MISSING || m.status === PaymentStatus.OVERDUE) && diffHours <= 48 && diffHours > 0) {
          pushTask(`Pagamento a vencer: ${m.label}`, m.dueDate, 'payment');
        }
        if ((m.status === PaymentStatus.MISSING || m.status === PaymentStatus.PARTIAL) && diffHours <= 0) {
          pushTask(`Pagamento em atraso: ${m.label}`, now.toISOString(), 'payment');
        }
      }
    }

    // Pré-viagem (T-2 dias)
    if (opp.departureDate && opp.status === OpportunityStatus.WON) {
      const dep = new Date(opp.departureDate);
      const diffHours = (dep.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 48 && diffHours > 0) {
        pushTask('Pré-viagem: confirmar documentos, check-in e vouchers', daysFromNow(0), 'document');
      }
    }

    // Só devolve update se houver mudanças reais
    const changed = tasks.length !== (opp.tasks || []).length;
    return changed ? { tasks } : null;
  };

  const runAutoAlerts = async () => {
    if (isAutoAlertRunning.current) return;
    isAutoAlertRunning.current = true;
    try {
      const updates: Array<{ id: string; patch: Partial<Opportunity> }> = [];
      for (const opp of opportunities) {
        const patch = ensureDeadlineAlerts(opp);
        if (patch) updates.push({ id: opp.id, patch });
      }

      if (updates.length) {
        for (const u of updates) {
          const updated = await TravelAPI.updateOpportunity(u.id, u.patch);
          setOpportunities(prev => prev.map(o => (o.id === u.id ? updated : o)));
        }
      }
    } catch (e) {
      console.error('Falha ao aplicar alertas automáticos:', e);
    } finally {
      isAutoAlertRunning.current = false;
    }
  };

  useEffect(() => {
    if (isLoading) return;
    // 1) Corre uma vez ao arrancar
    runAutoAlerts();
    // 2) E volta a correr periodicamente (MVP)
    const t = setInterval(() => {
      runAutoAlerts();
    }, 60 * 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const addClient = async (client: Client) => {
    const saved = await TravelAPI.saveClient(client);
    setClients(prev => [saved, ...prev]);
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const updated = await TravelAPI.updateClient(id, updates);
    setClients(prev => prev.map(c => (c.id === id ? updated : c)));
  };

  const addOpportunity = async (opp: Opportunity) => {
    const saved = await TravelAPI.saveOpportunity(opp);
    setOpportunities(prev => [saved, ...prev]);
  };

  const addAttachment = async (oppId: string, attachment: Attachment) => {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;
    const updatedAttachments = [...(opp.attachments || []), attachment];
    await updateOpportunity(oppId, { attachments: updatedAttachments });
  };

  const analyzeWithAI = async (opp: Opportunity): Promise<string> => {
    const apiKey = (process.env as any).API_KEY as string | undefined;
    const missing = checkStageRequirements(opp, 'BRIEFING').missing;
    const destination = opp.destination || opp.title;

    const fallback = () => {
      return `Sugestões para fechar:
1) Confirme prioridades (preço vs conforto vs experiência) e apresente 3 níveis (Eco/Premium/Luxo).
2) Envie 2–3 opções + uma recomendação clara ("eu escolheria a opção X por...").
3) Crie urgência real: valide prazos (disponibilidade/validação) e proponha uma decisão em 24–48h.

Gaps no briefing:
- ${missing.length ? missing.join('\n- ') : 'Briefing mínimo OK. Mesmo assim confirme flexibilidade de datas e preferências de hotel.'}

Upsell recomendado:
- Seguro com cobertura alargada + transfers/experiência local em ${destination}.`;
    };

    if (!apiKey) return fallback();

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Analise esta oportunidade de viagem:
Título: ${opp.title}
Destino: ${destination}
Briefing: ${opp.briefingNotes || '-'}
Orçamento: €${opp.limitValue}
Passageiros: ${opp.adults} adultos, ${opp.children} crianças
Propostas Atuais: ${opp.proposalOptions.map(o => o.title).join(', ') || '-'}

Dê 3 sugestões estratégicas para o consultor fechar a venda, identifique possíveis gaps no briefing e sugira um up-sell relevante. Responda em Português de Portugal.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      return response.text || fallback();
    } catch (error) {
      console.error('AI Error:', error);
      return fallback();
    }
  };

  const generateDraftWithAI = async (opp: Opportunity, kind: AiDraft['type'], createdBy = 'Sistema'): Promise<AiDraft> => {
    // Se não houver chave de API configurada, usamos um gerador local (templates) para o MVP.
    const apiKey = (process.env as any).API_KEY as string | undefined;

    const missingBriefing = checkStageRequirements(opp, 'BRIEFING').missing;
    const pax = (opp.adults || 0) + (opp.children || 0);
    const destination = opp.destination || opp.title;

    const buildLocal = (): string => {
      if (kind === 'perguntas_em_falta') {
        return `Perguntas/Dados em falta (para avançar sem riscos):\n\n- ${missingBriefing.length ? missingBriefing.join('\n- ') : 'Nenhum. Briefing mínimo completo.'}\n\nSugestão: confirmar flexibilidade de datas, preferências de hotel (zona/estrelas), escalas máximas e seguros.`;
      }

      if (kind === 'ideias') {
        return `3 ângulos de proposta para ${destination}:\n\n1) \"Eco inteligente\": foco em custo-benefício com serviços essenciais.\n2) \"Premium equilibrado\": melhor relação conforto/preço com hotel e voos mais convenientes.\n3) \"Luxo\": experiência diferenciada, hotéis premium e serviços privados.\n\nUpsell recomendado:\n- Seguro com cobertura mais ampla + escolha de lugares/bagagem.\n\nPerguntas rápidas ao cliente:\n- Datas são fixas ou flexíveis?\n- Preferem 1 cidade ou 2?\n- Hotel: 3*, 4* ou 5*?\n- Querem transfers/experiências incluídas?`;
      }

      if (kind === 'itinerario') {
        return `Itinerário sugerido (rascunho) – ${destination}\n\nDia 1: Chegada, check-in e passeio leve na zona.\nDia 2: Visita aos pontos principais + experiência local.\nDia 3: Dia livre / praia / compras / opcional de atividade.\nDia 4: Regresso (consoante horários).\n\nNota: ajusto o número de dias assim que existirem datas de partida/regresso confirmadas.`;
      }

      // texto_proposta
      return `Proposta de Viagem – ${destination}\n\nOlá ${opp.clientId ? '!' : '!'}\n\nCom base no seu briefing, preparamos uma proposta para ${destination} para ${pax || 'o'} passageiro(s), com orçamento estimado até €${(opp.limitValue || 0).toLocaleString('pt-PT')}.\n\nO que inclui:\n- Voos (ida/volta)\n- Alojamento\n- Opções de upgrade (seguro, transfers, atividades)\n\nPróximos passos:\n1) Indique a opção preferida (Eco/Premium/Luxo)\n2) Confirmar nomes e datas\n3) Sinal para garantir disponibilidade\n\nValidade: ${opp.quoteExpiry ? new Date(opp.quoteExpiry).toLocaleDateString('pt-PT') : '7 dias'}\n\nFico a aguardar a sua confirmação para avançarmos.`;
    };

    const promptForKind = () => {
      const base = `Contexto:\n- Título: ${opp.title}\n- Destino: ${destination}\n- Briefing: ${opp.briefingNotes || '-'}\n- Partida: ${opp.departureDate || '-'}\n- Regresso: ${opp.returnDate || '-'}\n- Orçamento: €${opp.limitValue || 0}\n- Passageiros: ${opp.adults} adultos, ${opp.children} crianças\n- Canal preferido: ${opp.preferredChannel}\n\nResponde em Português de Portugal. Não inventes preços específicos, voos ou hotéis reais. Se faltarem dados, faz perguntas e assume apenas um rascunho.`;
      if (kind === 'ideias') return `${base}\n\nGera 3 ideias de propostas (Eco/Premium/Luxo), 1 upsell relevante e 5 perguntas para fechar o briefing.`;
      if (kind === 'perguntas_em_falta') return `${base}\n\nLista apenas as perguntas/dados em falta para avançar e reduzir risco.`;
      if (kind === 'itinerario') return `${base}\n\nCria um itinerário dia-a-dia em bullets (rascunho), respeitando um estilo claro e vendedor.`;
      return `${base}\n\nEscreve o texto de uma proposta formal e curta (com secções: Resumo, Inclui/Não inclui, Próximos passos, Validade).`;
    };

    let content = '';
    if (!apiKey) {
      content = buildLocal();
    } else {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: promptForKind(),
        });
        content = response.text || buildLocal();
      } catch (error) {
        console.error('AI Error:', error);
        content = buildLocal();
      }
    }

    const draft: AiDraft = {
      id: uid(),
      type: kind,
      title:
        kind === 'ideias'
          ? 'Ideias de Proposta'
          : kind === 'texto_proposta'
          ? 'Texto de Proposta'
          : kind === 'itinerario'
          ? 'Itinerário (rascunho)'
          : 'Perguntas em Falta',
      content,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    const updatedDrafts = [draft, ...(opp.aiDrafts || [])];
    await updateOpportunity(opp.id, { aiDrafts: updatedDrafts });
    return draft;
  };

  const checkStageRequirements = (opp: Opportunity, targetStage: Stage): StageCheck => {
    const missing: string[] = [];
    const proposalStatus = opp.proposalStatus || (opp.proposalOptions?.length ? 'draft' : undefined);

    if (targetStage === 'BRIEFING') {
      if (!opp.departureDate) missing.push('Data sugerida (partida)');
      if ((opp.adults || 0) <= 0) missing.push('Nº de adultos');
      if ((opp.limitValue || 0) <= 0) missing.push('Orçamento estimado');
      if (!opp.tripReason) missing.push('Motivo da viagem');
    }

    if (targetStage === 'PROPOSTA') {
      const briefing = checkStageRequirements(opp, 'BRIEFING');
      if (!briefing.met) missing.push('Briefing completo');
      if (!opp.proposalOptions || opp.proposalOptions.length === 0) missing.push('Pelo menos 1 opção de proposta');
      if (!opp.quoteExpiry) missing.push('Validade da proposta');
    }

    if (targetStage === 'NEGOCIAÇÃO') {
      if (!opp.proposalOptions || opp.proposalOptions.length === 0) missing.push('Proposta enviada');
      if (proposalStatus !== 'finalized') missing.push('Proposta concluída');
      if (!opp.tasks?.some(t => t.type === 'follow-up')) missing.push('Follow-up planeado');
    }

    if (targetStage === 'FECHADO') {
      if (!opp.proposalOptions?.some(opt => opt.isAccepted)) missing.push('Uma opção marcada como ACEITE');
    }

    return { met: missing.length === 0, missing };
  };

  const updateOpportunity = async (id: string, updates: Partial<Opportunity>) => {
    const currentOpp = opportunities.find(o => o.id === id);
    if (!currentOpp) return;

    let finalUpdates: Partial<Opportunity> = { ...updates };

    // Se o utilizador mudar fase manualmente via updateOpportunity
    if (updates.stage && updates.stage !== currentOpp.stage) {
      const target = updates.stage as Stage;
      if (updates.tasks === undefined) {
        finalUpdates.tasks = createAutoTasks(currentOpp, target);
      }
      if (updates.history === undefined) {
        finalUpdates.history = addHistory(currentOpp, `Fase alterada: ${currentOpp.stage} → ${target}`);
      }

      const nextIndex = DEFAULT_PIPELINE.stages.indexOf(target);
      const currentIndex = DEFAULT_PIPELINE.stages.indexOf(currentOpp.stage);
      if (updates.temperature === undefined) {
        if (nextIndex > currentIndex) {
          finalUpdates.temperature = Math.min(100, (currentOpp.temperature || 0) + 15);
        } else if (nextIndex < currentIndex) {
          finalUpdates.temperature = Math.max(0, (currentOpp.temperature || 0) - 10);
        }
      }

      finalUpdates.lastInteractionAt = new Date().toISOString();
    }

    const updated = await TravelAPI.updateOpportunity(id, finalUpdates);
    setOpportunities(prev => prev.map(o => (o.id === id ? updated : o)));
  };

  const moveOpportunityStage = async (id: string, targetStage: Stage, meta?: { reason?: string }): Promise<StageMoveResult> => {
    const opp = opportunities.find(o => o.id === id);
    if (!opp) return { ok: false, reason: 'Oportunidade não encontrada.' };

    const check = checkStageRequirements(opp, targetStage);
    if (!check.met) {
      return { ok: false, reason: 'Faltam dados para avançar de fase.', missing: check.missing };
    }

    const stageUpdate: Partial<Opportunity> = {
      stage: targetStage,
      lastInteractionAt: new Date().toISOString(),
      tasks: createAutoTasks(opp, targetStage),
      history: addHistory(
        opp,
        meta?.reason
          ? `Fase alterada: ${opp.stage} → ${targetStage} (${meta.reason})`
          : `Fase alterada: ${opp.stage} → ${targetStage}`,
      ),
    };

    // Defaults úteis ao entrar em PROPOSTA
    if (targetStage === 'PROPOSTA' && !opp.quoteExpiry) {
      stageUpdate.quoteExpiry = daysFromNow(7);
      if (!opp.proposalStatus) stageUpdate.proposalStatus = 'draft';
    }

    // Ao fechar: estado + plano pagamentos (se não existir)
    if (targetStage === 'FECHADO') {
      stageUpdate.status = OpportunityStatus.WON;
      stageUpdate.temperature = 100;
      stageUpdate.paymentPlan = opp.paymentPlan?.length ? opp.paymentPlan : buildPaymentPlan(opp);
      stageUpdate.proposalStatus = 'finalized';
      stageUpdate.proposalFinalizedAt = opp.proposalFinalizedAt || new Date().toISOString();
    }

    await updateOpportunity(id, stageUpdate);
    return { ok: true };
  };

  const addEmployee = async (employee: Employee) => {
    const saved = await TravelAPI.saveEmployee(employee);
    setEmployees(prev => [...prev, saved]);
  };

  const addCampaign = async (campaign: Campaign) => {
    const saved = await TravelAPI.saveCampaign(campaign);
    setCampaigns(prev => [saved, ...prev]);
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    const updated = await TravelAPI.updateCampaign(id, updates);
    setCampaigns(prev => prev.map(c => (c.id === id ? updated : c)));
  };

  const addSupplier = async (supplier: Supplier) => {
    const saved = await TravelAPI.saveSupplier(supplier);
    setSuppliers(prev => [saved, ...prev]);
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const updated = await TravelAPI.updateSupplier(id, updates);
    setSuppliers(prev => prev.map(s => (s.id === id ? updated : s)));
  };

  const generateProposals = (opp: Opportunity): ProposalOption[] => {
    const budget = Math.max(opp.limitValue || 0, 2000);
    const levels: Array<'Eco' | 'Premium' | 'Luxo'> = ['Eco', 'Premium', 'Luxo'];

    return levels.map(lvl => {
      const multiplier = lvl === 'Eco' ? 0.82 : lvl === 'Premium' ? 1.0 : 1.35;
      const margin = lvl === 'Eco' ? 0.1 : lvl === 'Premium' ? 0.14 : 0.18;
      const estimatedSaleTarget = Math.round(budget * multiplier);
      const estimatedNetCost = Math.max(650, Math.round(estimatedSaleTarget / (1 + margin)));

      const components = [
        {
          id: uid(),
          type: ServiceType.FLIGHT,
          provider: lvl === 'Luxo' ? 'Companhia Full Service' : lvl === 'Premium' ? 'Companhia Regular Plus' : 'Companhia Regular',
          description: 'Voo ida e volta',
          cost: Math.round(estimatedNetCost * 0.38),
          margin,
        },
        {
          id: uid(),
          type: ServiceType.HOTEL,
          provider: lvl === 'Luxo' ? 'Hotel 5*' : lvl === 'Premium' ? 'Hotel 4*' : 'Hotel 3*',
          description: 'Estadia em hotel',
          cost: Math.round(estimatedNetCost * 0.4),
          margin,
        },
        {
          id: uid(),
          type: ServiceType.TRANSFER,
          provider: lvl === 'Luxo' ? 'Transfer privado' : 'Transfer partilhado',
          description: 'Transfer aeroporto-hotel',
          cost: Math.round(estimatedNetCost * 0.12),
          margin,
        },
        {
          id: uid(),
          type: ServiceType.INSURANCE,
          provider: lvl === 'Luxo' ? 'Seguro premium' : 'Seguro standard',
          description: 'Seguro de viagem',
          cost: Math.round(estimatedNetCost * 0.1),
          margin,
        },
      ];

      const totalPrice = Math.round(components.reduce((acc, component) => acc + (component.cost * (1 + component.margin)), 0));

      return {
        id: uid(),
        label: lvl,
        title: `${lvl === 'Eco' ? 'Opção Eco Inteligente' : lvl === 'Premium' ? 'Opção Premium Equilibrada' : 'Opção Luxo Signature'} - ${opp.title}`,
        totalPrice,
        description: lvl === 'Eco'
          ? 'Foco em eficiência de custo com os serviços essenciais.'
          : lvl === 'Premium'
          ? 'Equilíbrio entre conforto, conveniência e valor percebido.'
          : 'Experiência diferenciada com maior personalização e exclusividade.',
        components,
        inclusions: ['Voos', 'Alojamento', 'Transfer', 'Seguro de viagem'],
        justification: `Alternativa ${lvl.toLowerCase()} preparada para comparar valor e experiência de forma clara.`,
        qualityScore: lvl === 'Eco' ? 68 : lvl === 'Premium' ? 86 : 97,
        version: 1,
        isAccepted: false,
      };
    });
  };

  return (
    <AppContext.Provider
      value={{
        clients,
        opportunities,
        employees,
        campaigns,
        suppliers,
        isLoading,
        addClient,
        updateClient,
        addOpportunity,
        updateOpportunity,
        moveOpportunityStage,
        addEmployee,
        generateProposals,
        checkStageRequirements,
        analyzeWithAI,
        generateDraftWithAI,
        addAttachment,
        addCampaign,
        updateCampaign,
        addSupplier,
        updateSupplier,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
