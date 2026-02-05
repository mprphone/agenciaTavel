
import React, { useEffect, useMemo, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  X, Send, FileText, Sparkles, Loader2, CheckCircle, Clock, 
  Users, Baby, TrendingUp, CreditCard, ChevronRight, 
  MessageCircle, History, ExternalLink, ShieldCheck, ArrowRight,
  PlusCircle, Edit3, Trash2, Wallet, Paperclip, AlertTriangle,
  Receipt, Plane, Hotel, Car, Compass, LifeBuoy, CheckSquare,
  Ticket, Info, Download, Upload, Paperclip as PaperclipIcon, Star,
  Briefcase, Lock, ChevronDown, CheckCircle2, AlertCircle, Circle,
  Thermometer, Plus
} from 'lucide-react';
import { Opportunity, Client, ProposalOption, ProposalComment, OpportunityStatus, PaymentStatus, ServiceType, Attachment, ProposalComponent, Task, SupplierBooking } from '../types';
import { useApp } from '../AppContext';
import { AGENCY_PROFILE, DEFAULT_PIPELINE } from '../constants';
import { STORAGE_BUCKETS, uploadFileToBucket } from '../storage';

interface Props {
  opportunity: Opportunity;
  client?: Client;
  onClose: () => void;
}

const normalizePipelineStage = (stage: string, status: OpportunityStatus) => {
  if (stage === 'Carteira' || stage === 'Proposta Enviada' || stage === '1º Follow up' || stage === '2º Follow up' || stage === 'Ganho' || stage === 'Perdido') {
    return stage;
  }
  if (stage === 'NOVO' || stage === 'BRIEFING') return 'Carteira';
  if (stage === 'PROPOSTA') return 'Proposta Enviada';
  if (stage === 'NEGOCIAÇÃO') return '1º Follow up';
  if (stage === 'FECHADO') return status === OpportunityStatus.LOST ? 'Perdido' : 'Ganho';
  return 'Carteira';
};

const OpportunityDetailModal: React.FC<Props> = ({ opportunity, client, onClose }) => {
  const { updateOpportunity, moveOpportunityStage, checkStageRequirements, analyzeWithAI, generateDraftWithAI, addAttachment, suppliers, updateSupplier } = useApp();
  const [activeTab, setActiveTab] = useState<string>('proposals');
  const [newMessage, setNewMessage] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // States for adding a new item to a proposal level
  const [isAddingItem, setIsAddingItem] = useState<string | null>(null); // Stores the level ID
  const [newItemType, setNewItemType] = useState<ServiceType>(ServiceType.HOTEL);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [newItemProvider, setNewItemProvider] = useState('');
  const [newNegotiationTaskTitle, setNewNegotiationTaskTitle] = useState('');
  const [newNegotiationTaskDate, setNewNegotiationTaskDate] = useState('');
  const [clientRequestText, setClientRequestText] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierServiceType, setSupplierServiceType] = useState<ServiceType>(ServiceType.HOTEL);
  const [supplierServiceDescription, setSupplierServiceDescription] = useState('');
  const [supplierContractedAmount, setSupplierContractedAmount] = useState('');
  const [invoicePreviewName, setInvoicePreviewName] = useState('');
  const [isReadingInvoice, setIsReadingInvoice] = useState(false);
  const [isCreatingOption, setIsCreatingOption] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState<ProposalOption['label']>('Eco');
  const [newOptionTitle, setNewOptionTitle] = useState('');
  const [newOptionDescription, setNewOptionDescription] = useState('');
  const proposalLevels: Array<'Eco' | 'Premium' | 'Luxo'> = ['Eco', 'Premium', 'Luxo'];
  const summaryFocusMap: Record<ProposalOption['label'], string> = {
    Eco: 'Eficiência',
    Conforto: 'Equilíbrio',
    Premium: 'Conforto',
    Luxo: 'Exclusividade',
  };
  const summaryFocus = summaryFocusMap[newOptionLabel] || 'Equilíbrio';

  const currentPipelineStage = normalizePipelineStage(opportunity.stage, opportunity.status);
  const isFollowUpStage = currentPipelineStage === '1º Follow up' || currentPipelineStage === '2º Follow up';
  const isClosedStage = currentPipelineStage === 'Ganho' || currentPipelineStage === 'Perdido';
  const currentStageIndex = DEFAULT_PIPELINE.stages.indexOf(currentPipelineStage);
  const nextStage = DEFAULT_PIPELINE.stages[currentStageIndex + 1];
  const { met, missing } = nextStage
    ? checkStageRequirements(opportunity, nextStage as any)
    : { met: true, missing: [] as string[] };
  const needsEmailForNegotiation = nextStage === '1º Follow up' && !opportunity.proposalSentAt;
  const canAdvanceStage = met && !needsEmailForNegotiation;
  const proposalWorkflowStatus: 'idle' | 'draft' | 'finalized' = opportunity.proposalStatus
    ? opportunity.proposalStatus
    : opportunity.proposalOptions.length > 0
    ? 'draft'
    : 'idle';
  const proposalIsFinalized = proposalWorkflowStatus === 'finalized';
  const proposalIsEditable = !proposalIsFinalized || isFollowUpStage;
  const hasAcceptedProposal = opportunity.proposalOptions.some(option => option.isAccepted);
  const acceptedOption = opportunity.proposalOptions.find(option => option.isAccepted);
  const isClosedWon = currentPipelineStage === 'Ganho' && opportunity.status === OpportunityStatus.WON;
  const showSuppliersBoard = isClosedWon && hasAcceptedProposal;
  const supplierBookings = opportunity.supplierBookings || [];
  const totalPax = (opportunity.adults || 0) + (opportunity.children || 0);
  const travelDays = useMemo(() => {
    if (!opportunity.departureDate || !opportunity.returnDate) return null;
    const departure = new Date(opportunity.departureDate);
    const returning = new Date(opportunity.returnDate);
    const diff = returning.getTime() - departure.getTime();
    if (Number.isNaN(diff) || diff < 0) return null;
    return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
  }, [opportunity.departureDate, opportunity.returnDate]);

  const orderedOptions = useMemo(() => {
    const rank: Record<ProposalOption['label'], number> = {
      Eco: 0,
      Conforto: 1,
      Premium: 2,
      Luxo: 3,
    };
    return [...opportunity.proposalOptions].sort((a, b) => rank[a.label] - rank[b.label]);
  }, [opportunity.proposalOptions]);

  const recalculateTotal = (components: ProposalComponent[]) =>
    components.reduce((acc, c) => acc + (c.cost * (1 + c.margin)), 0);

  const daysFromNow = (days: number) => {
    const now = new Date();
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
  };

  const buildDefaultPaymentPlan = () => {
    const total = Math.max(0, opportunity.limitValue || 0);
    const departure = opportunity.departureDate ? new Date(opportunity.departureDate) : null;

    const milestone = (label: string, amount: number, dueDateIso: string) => ({
      id: Math.random().toString(36).substr(2, 5),
      label,
      amount,
      dueDate: dueDateIso,
      status: PaymentStatus.MISSING,
      paidAmount: 0,
    });

    const d1 = daysFromNow(3);
    const d2 = departure ? new Date(departure.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() : daysFromNow(14);
    const d3 = departure ? new Date(departure.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString() : daysFromNow(28);

    const a1 = Math.round(total * 0.3);
    const a2 = Math.round(total * 0.4);
    const a3 = Math.max(0, total - a1 - a2);

    return [
      milestone('Sinal (30%)', a1, d1),
      milestone('2ª Prestação (40%)', a2, d2),
      milestone('Saldo (30%)', a3, d3),
    ];
  };

  const createEmptyProposalOption = (label: ProposalOption['label'], title?: string, description?: string): ProposalOption => {
    const nextVersion =
      Math.max(0, ...opportunity.proposalOptions.filter(opt => opt.label === label).map(opt => opt.version || 0)) + 1;

    return {
      id: Math.random().toString(36).substr(2, 5),
      label,
      title: title?.trim() || `Proposta ${label} ${nextVersion} - ${opportunity.title}`,
      totalPrice: 0,
      description: description?.trim() || 'Proposta em branco para construção personalizada.',
      components: [],
      inclusions: [],
      justification: 'Construída manualmente com base no briefing do cliente.',
      qualityScore: 0,
      isAccepted: false,
      version: nextVersion,
    };
  };

  const normalizeServiceType = (value?: string): ServiceType => {
    const normalized = (value || '').toLowerCase();
    if (normalized.includes('voo') || normalized.includes('flight')) return ServiceType.FLIGHT;
    if (normalized.includes('hotel') || normalized.includes('aloj')) return ServiceType.HOTEL;
    if (normalized.includes('transfer')) return ServiceType.TRANSFER;
    if (normalized.includes('seguro') || normalized.includes('insurance')) return ServiceType.INSURANCE;
    if (normalized.includes('atividade') || normalized.includes('activity')) return ServiceType.ACTIVITY;
    return ServiceType.HOTEL;
  };

  const parseAmount = (value?: string | number): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return undefined;
    const normalized = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const getOptionColors = (label: ProposalOption['label']) => {
    if (label === 'Luxo') {
      return {
        surface: 'bg-amber-50/50 border-amber-200',
        badge: 'text-amber-700 border-amber-200 bg-white',
        header: 'bg-amber-50/40',
      };
    }
    if (label === 'Premium' || label === 'Conforto') {
      return {
        surface: 'bg-blue-50/50 border-blue-200',
        badge: 'text-blue-700 border-blue-200 bg-white',
        header: 'bg-blue-50/40',
      };
    }
    return {
      surface: 'bg-gray-50/70 border-gray-200',
      badge: 'text-gray-600 border-gray-200 bg-white',
      header: 'bg-gray-50/40',
    };
  };

  useEffect(() => {
    if (!isCreatingOption) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCreatingOption(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreatingOption]);

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeWithAI(opportunity);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleGenerateDraft = async (kind: any) => {
    setIsGeneratingDraft(true);
    try {
      await generateDraftWithAI(opportunity, kind, opportunity.owner || 'Consultor');
      // muda para o separador de IA para o utilizador ver o resultado
      setActiveTab('ai');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { path, publicUrl } = await uploadFileToBucket({
        bucket: STORAGE_BUCKETS.documents,
        file,
        pathPrefix: `opportunities/${opportunity.id}/docs`,
      });

      const newAttachment: Attachment = {
        id: Math.random().toString(36).substr(2, 5),
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        url: publicUrl,
        bucket: STORAGE_BUCKETS.documents,
        path,
        uploadedAt: new Date().toISOString(),
      };
      await addAttachment(opportunity.id, newAttachment);
    } catch (error) {
      console.error('Falha ao anexar ficheiro:', error);
      alert('Não foi possível carregar o ficheiro.');
    } finally {
      e.target.value = '';
    }
  };

  const appendHistory = (action: string) => {
    const now = new Date().toISOString();
    return [
      { id: Math.random().toString(36).substr(2, 5), user: opportunity.owner || 'Sistema', action, timestamp: now },
      ...(opportunity.history || []),
    ];
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleFinalizeProposal = async () => {
    if (!opportunity.proposalOptions.length) {
      alert('Crie pelo menos uma alternativa antes de finalizar.');
      return;
    }

    const shouldSendNow = !opportunity.proposalSentAt && !isFollowUpStage && !isClosedStage;
    if (shouldSendNow && !client?.email) {
      alert('Este cliente não tem email registado.');
      return;
    }

    setIsSendingEmail(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 700));
      const now = new Date().toISOString();
      const sentAt = shouldSendNow ? now : opportunity.proposalSentAt;

      await updateOpportunity(opportunity.id, {
        proposalStatus: 'finalized',
        proposalFinalizedAt: now,
        proposalSentAt: sentAt,
        lastInteractionAt: now,
        ...(shouldSendNow ? { stage: '1º Follow up' } : {}),
        history: appendHistory(
          shouldSendNow
            ? `Proposta finalizada e enviada por email para ${client?.email}. Estado avançado para 1º Follow up`
            : isFollowUpStage
            ? 'Revisão da proposta finalizada durante negociação'
            : 'Proposta finalizada'
        ),
      });

      setTimeout(() => handleExportPDF(), 150);
      setActiveTab('proposals');
      if (shouldSendNow) {
        alert(`Proposta enviada para ${client?.email} e oportunidade avançada para 1º Follow up.`);
      }
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleAddItem = (optId: string) => {
    if (!proposalIsEditable) return;
    if (!newItemDesc || !newItemCost) return;

    const newComponent: ProposalComponent = {
      id: Math.random().toString(36).substr(2, 5),
      type: newItemType,
      provider: newItemProvider || 'Pendente',
      description: newItemDesc,
      cost: parseFloat(newItemCost),
      margin: 0.15
    };

    const updatedOptions = opportunity.proposalOptions.map(opt => {
      if (opt.id === optId) {
        const updatedComponents = [...opt.components, newComponent];
        const newTotal = recalculateTotal(updatedComponents);
        return { 
          ...opt, 
          components: updatedComponents,
          totalPrice: newTotal
        };
      }
      return opt;
    });

    updateOpportunity(opportunity.id, { proposalOptions: updatedOptions });
    setIsAddingItem(null);
    setNewItemDesc('');
    setNewItemCost('');
    setNewItemProvider('');
  };

  const handleRemoveItem = (optId: string, itemId: string) => {
    if (!proposalIsEditable) return;
    const updatedOptions = opportunity.proposalOptions.map(opt => {
      if (opt.id === optId) {
        const updatedComponents = opt.components.filter(c => c.id !== itemId);
        const newTotal = recalculateTotal(updatedComponents);
        return { 
          ...opt, 
          components: updatedComponents,
          totalPrice: newTotal
        };
      }
      return opt;
    });
    updateOpportunity(opportunity.id, { proposalOptions: updatedOptions });
  };

  const handleAcceptProposal = (optId: string) => {
    const updatedOptions = opportunity.proposalOptions.map(o => ({
      ...o,
      isAccepted: o.id === optId
    }));
    updateOpportunity(opportunity.id, { proposalOptions: updatedOptions });
  };

  const handleCreateLevelOption = (level: 'Eco' | 'Premium' | 'Luxo') => {
    if (!proposalIsEditable) return;
    const newOption = createEmptyProposalOption(level);
    const isEarlyStage = currentPipelineStage === 'Carteira';
    updateOpportunity(opportunity.id, {
      proposalOptions: [...opportunity.proposalOptions, newOption],
      proposalStatus: 'draft',
      proposalFinalizedAt: undefined,
      ...(isEarlyStage ? { stage: 'Proposta Enviada' } : {}),
    });
  };

  const handleCreateCustomOption = () => {
    if (!proposalIsEditable) return;

    const optionTitle = newOptionTitle.trim();
    const optionDescription = newOptionDescription.trim();
    if (!optionTitle) {
      alert('Dê um título à proposta para a criar.');
      return;
    }

    const newOption = createEmptyProposalOption(newOptionLabel, optionTitle, optionDescription);
    const isEarlyStage = currentPipelineStage === 'Carteira';
    updateOpportunity(opportunity.id, {
      proposalOptions: [...opportunity.proposalOptions, newOption],
      proposalStatus: 'draft',
      proposalFinalizedAt: undefined,
      ...(isEarlyStage ? { stage: 'Proposta Enviada' } : {}),
    });

    setNewOptionTitle('');
    setNewOptionDescription('');
    setNewOptionLabel('Eco');
    setIsCreatingOption(false);
  };

  const handleEditProposalOptionMeta = (optId: string) => {
    if (!proposalIsEditable) return;
    const option = opportunity.proposalOptions.find(opt => opt.id === optId);
    if (!option) return;

    const nextTitle = window.prompt('Novo título da proposta:', option.title);
    if (nextTitle === null) return;
    const nextDescription = window.prompt('Descrição curta da proposta:', option.description);
    if (nextDescription === null) return;

    const updatedOptions = opportunity.proposalOptions.map(opt =>
      opt.id === optId
        ? {
            ...opt,
            title: nextTitle.trim() || opt.title,
            description: nextDescription.trim() || opt.description,
          }
        : opt
    );
    updateOpportunity(opportunity.id, { proposalOptions: updatedOptions });
  };

  const handleRemoveProposalOption = (optId: string) => {
    if (!proposalIsEditable) return;
    if (!window.confirm('Remover esta proposta?')) return;

    const updatedOptions = opportunity.proposalOptions.filter(opt => opt.id !== optId);
    updateOpportunity(opportunity.id, {
      proposalOptions: updatedOptions,
      proposalStatus: updatedOptions.length ? opportunity.proposalStatus : 'draft',
      history: appendHistory('Proposta removida da negociação'),
    });
  };

  const handleInsertProposal = () => {
    const shouldMoveToProposal = currentPipelineStage === 'Carteira';
    updateOpportunity(opportunity.id, {
      proposalStatus: 'draft',
      proposalFinalizedAt: undefined,
      proposalSentAt: undefined,
      ...(shouldMoveToProposal ? { stage: 'Proposta Enviada' } : {}),
      ...(shouldMoveToProposal && !opportunity.quoteExpiry ? { quoteExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() } : {}),
    });
    setIsCreatingOption(true);
    setActiveTab('proposals');
  };

  const handleReopenProposal = () => {
    updateOpportunity(opportunity.id, {
      proposalStatus: 'draft',
      proposalFinalizedAt: undefined,
      history: appendHistory('Proposta reaberta para edição'),
    });
  };

  const handleCloseAsAccepted = async () => {
    if (!hasAcceptedProposal) {
      alert('Marque primeiro a opção aceite pelo cliente.');
      return;
    }
    if (!window.confirm('Confirmar fecho da oportunidade como ACEITE?')) return;
    const now = new Date().toISOString();
    await updateOpportunity(opportunity.id, {
      stage: 'Ganho',
      status: OpportunityStatus.WON,
      temperature: 100,
      proposalStatus: 'finalized',
      proposalFinalizedAt: opportunity.proposalFinalizedAt || now,
      paymentPlan: opportunity.paymentPlan?.length ? opportunity.paymentPlan : buildDefaultPaymentPlan(),
      lastInteractionAt: now,
      history: appendHistory(`Proposta aceite (${acceptedOption?.label || 'opção selecionada'}). Oportunidade fechada como ganha.`),
    });
    setActiveTab('proposals');
  };

  const handleCloseAsRejected = async () => {
    if (!window.confirm('Confirmar fecho da oportunidade como NÃO ACEITE?')) return;
    const now = new Date().toISOString();
    await updateOpportunity(opportunity.id, {
      stage: 'Perdido',
      status: OpportunityStatus.LOST,
      temperature: 10,
      tasks: [],
      lostReason: 'Proposta não aceite pelo cliente',
      proposalOptions: opportunity.proposalOptions.map(option => ({ ...option, isAccepted: false })),
      lastInteractionAt: now,
      history: appendHistory('Proposta não aceite. Oportunidade fechada como perdida.'),
    });
    setActiveTab('proposals');
  };

  const handleToggleChecklistItem = (itemId: string) => {
    const updatedChecklist = (opportunity.checklist || []).map(item =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    updateOpportunity(opportunity.id, {
      checklist: updatedChecklist,
      lastInteractionAt: new Date().toISOString(),
    });
  };

  const handleCreateNegotiationTask = (kind: 'reminder' | 'alert') => {
    if (!newNegotiationTaskTitle.trim()) return;
    const dueDate = newNegotiationTaskDate
      ? new Date(newNegotiationTaskDate).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 5),
      title: `${kind === 'alert' ? 'Alerta' : 'Lembrete'}: ${newNegotiationTaskTitle.trim()}`,
      dueDate,
      isCompleted: false,
      type: kind === 'alert' ? 'other' : 'follow-up',
    };

    updateOpportunity(opportunity.id, {
      tasks: [...(opportunity.tasks || []), newTask],
      history: appendHistory(`${kind === 'alert' ? 'Alerta' : 'Lembrete'} criado: ${newNegotiationTaskTitle.trim()}`),
    });

    setNewNegotiationTaskTitle('');
    setNewNegotiationTaskDate('');
  };

  const handleAttachClientRequest = () => {
    if (!clientRequestText.trim()) return;
    const now = new Date().toISOString();
    const requestText = clientRequestText.trim();
    const attachment: Attachment = {
      id: Math.random().toString(36).substr(2, 5),
      name: `pedido-cliente-${new Date().toISOString().slice(0, 10)}.txt`,
      type: 'text/plain',
      size: `${Math.max(1, Math.ceil(requestText.length / 1024))} KB`,
      url: '#',
      uploadedAt: now,
    };

    const comment: ProposalComment = {
      id: Math.random().toString(36).substr(2, 5),
      author: client?.name || 'Cliente',
      role: 'client',
      text: `Pedido do cliente: ${requestText}`,
      timestamp: now,
    };

    updateOpportunity(opportunity.id, {
      attachments: [...(opportunity.attachments || []), attachment],
      comments: [...(opportunity.comments || []), comment],
      history: appendHistory('Pedido do cliente anexado para negociação de extras'),
    });
    setClientRequestText('');
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') return reject(new Error('Falha ao processar imagem.'));
        resolve(result.split(',')[1] || '');
      };
      reader.onerror = () => reject(new Error('Falha ao processar imagem.'));
      reader.readAsDataURL(file);
    });

  const appendSupplierBooking = async (booking: Omit<SupplierBooking, 'id' | 'createdAt'>) => {
    const createdAt = new Date().toISOString();
    const newBooking: SupplierBooking = {
      id: Math.random().toString(36).substr(2, 5),
      createdAt,
      ...booking,
    };

    await updateOpportunity(opportunity.id, {
      supplierBookings: [...supplierBookings, newBooking],
      lastInteractionAt: createdAt,
      history: appendHistory(`Fornecedor associado: ${newBooking.supplierName} (${newBooking.serviceType})`),
    });

    if (booking.supplierId) {
      const supplier = suppliers.find(item => item.id === booking.supplierId);
      if (supplier) {
        await updateSupplier(supplier.id, {
          usageHistory: [
            {
              id: Math.random().toString(36).substr(2, 5),
              date: createdAt,
              opportunityTitle: opportunity.title,
              note: `${newBooking.serviceType}: ${newBooking.serviceDescription}`,
            },
            ...(supplier.usageHistory || []),
          ],
          updatedAt: createdAt,
        });
      }
    }
  };

  const handleAddSupplierBookingManual = async () => {
    const selectedSupplier = suppliers.find(item => item.id === selectedSupplierId);
    const supplierName = selectedSupplier?.name || '';
    if (!supplierName || !supplierServiceDescription.trim()) {
      alert('Selecione o fornecedor e descreva o serviço contratado.');
      return;
    }

    await appendSupplierBooking({
      supplierId: selectedSupplier?.id,
      supplierName,
      serviceType: supplierServiceType,
      serviceDescription: supplierServiceDescription.trim(),
      contractedAmount: parseAmount(supplierContractedAmount),
      source: 'manual',
    });

    setSupplierServiceDescription('');
    setSupplierContractedAmount('');
    setInvoicePreviewName('');
  };

  const handleAddSupplierBookingFromInvoice = async () => {
    const selectedSupplier = suppliers.find(item => item.id === selectedSupplierId);
    const supplierName = selectedSupplier?.name || '';
    if (!supplierName || !supplierServiceDescription.trim()) {
      alert('Após ler a fatura, confirme fornecedor e descrição do serviço.');
      return;
    }

    await appendSupplierBooking({
      supplierId: selectedSupplier?.id,
      supplierName,
      serviceType: supplierServiceType,
      serviceDescription: supplierServiceDescription.trim(),
      contractedAmount: parseAmount(supplierContractedAmount),
      source: 'invoice',
    });

    setSupplierServiceDescription('');
    setSupplierContractedAmount('');
    setInvoicePreviewName('');
  };

  const parseInvoiceJson = (raw: string): {
    supplierName?: string;
    serviceDescription?: string;
    serviceType?: ServiceType;
    amount?: number;
  } => {
    const cleaned = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return {};

    try {
      const parsed = JSON.parse(match[0]) as {
        supplierName?: string;
        serviceDescription?: string;
        serviceType?: string;
        amount?: string | number;
      };
      return {
        supplierName: parsed.supplierName?.trim(),
        serviceDescription: parsed.serviceDescription?.trim(),
        serviceType: normalizeServiceType(parsed.serviceType),
        amount: parseAmount(parsed.amount),
      };
    } catch {
      return {};
    }
  };

  const handleReadInvoicePhoto = async (file?: File) => {
    if (!file) return;
    setIsReadingInvoice(true);
    setInvoicePreviewName(file.name);
    try {
      const apiKey = (process.env as any).API_KEY as string | undefined;
      let supplierName = '';
      let serviceDescription = '';
      let serviceType = ServiceType.HOTEL;
      let amount: number | undefined;

      if (apiKey) {
        const base64 = await fileToBase64(file);
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            {
              inlineData: {
                mimeType: file.type || 'image/jpeg',
                data: base64,
              },
            },
            {
              text: [
                'Lê esta imagem de fatura e extrai apenas os campos principais.',
                'Responde APENAS em JSON sem texto adicional.',
                'Formato obrigatório: {"supplierName":"","serviceDescription":"","serviceType":"Voo|Alojamento|Transfer|Atividade|Seguro","amount":0}',
                'Se algum campo não existir, devolve string vazia.',
              ].join(' '),
            },
          ],
        });

        const extracted = parseInvoiceJson(response.text || '');
        supplierName = extracted.supplierName || '';
        serviceDescription = extracted.serviceDescription || '';
        serviceType = extracted.serviceType || ServiceType.HOTEL;
        amount = extracted.amount;
      }

      if (!supplierName) {
        const fallbackName = file.name.replace(/\.[^.]+$/, '').split(/[-_]/)[0];
        supplierName = fallbackName || '';
      }
      if (!serviceDescription) {
        serviceDescription = 'Serviço extraído da fatura';
      }

      const matchedSupplier = suppliers.find(item =>
        item.name.toLowerCase().includes(supplierName.toLowerCase()) ||
        supplierName.toLowerCase().includes(item.name.toLowerCase())
      );

      if (matchedSupplier) setSelectedSupplierId(matchedSupplier.id);
      setSupplierServiceType(serviceType);
      setSupplierServiceDescription(serviceDescription);
      setSupplierContractedAmount(amount ? String(amount) : '');
    } catch (error) {
      console.error('Falha ao ler fatura:', error);
      alert('Não foi possível interpretar a fatura automaticamente. Pode preencher manualmente.');
    } finally {
      setIsReadingInvoice(false);
    }
  };

  const handleInvoicePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const createdAt = new Date().toISOString();
    try {
      const { path, publicUrl } = await uploadFileToBucket({
        bucket: STORAGE_BUCKETS.photos,
        file,
        pathPrefix: `opportunities/${opportunity.id}/invoices`,
      });

      const attachment: Attachment = {
        id: Math.random().toString(36).substr(2, 5),
        name: file.name,
        type: file.type || 'image/jpeg',
        size: `${(file.size / 1024).toFixed(1)} KB`,
        url: publicUrl,
        bucket: STORAGE_BUCKETS.photos,
        path,
        uploadedAt: createdAt,
      };

      await addAttachment(opportunity.id, attachment);
    } catch (error) {
      console.error('Falha ao carregar fatura:', error);
      alert('Não foi possível carregar a imagem da fatura.');
    }
    await handleReadInvoicePhoto(file);
  };

  const handleRemoveSupplierBooking = async (bookingId: string) => {
    const updated = supplierBookings.filter(booking => booking.id !== bookingId);
    await updateOpportunity(opportunity.id, {
      supplierBookings: updated,
      history: appendHistory('Fornecedor removido do quadro operacional'),
    });
  };

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case ServiceType.FLIGHT: return <Plane size={14} />;
      case ServiceType.HOTEL: return <Hotel size={14} />;
      case ServiceType.TRANSFER: return <Car size={14} />;
      case ServiceType.ACTIVITY: return <Compass size={14} />;
      case ServiceType.INSURANCE: return <ShieldCheck size={14} />;
      default: return <Info size={14} />;
    }
  };

  const summaryPalette = getOptionColors(newOptionLabel);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4 print:p-0">
      <div className="bg-white rounded-[2.5rem] w-full max-w-7xl shadow-2xl flex flex-col h-[90vh] overflow-hidden animate-in zoom-in duration-300 print:h-auto print:rounded-none print:shadow-none print:max-w-none print:overflow-visible">
        
        {/* Header - Hidden in Print */}
        <div className="p-8 border-b bg-gray-50/50 print:hidden">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <Compass size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{opportunity.title}</h2>
                <p className="text-gray-500 text-sm font-medium">Consultor: <span className="text-gray-900 font-bold">{opportunity.owner}</span> • Cliente: <span className="text-blue-600 font-bold">{client?.name}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={handleExportPDF} className="px-6 py-3 hover:bg-gray-200 rounded-xl transition text-gray-600 border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                 <FileText size={18} /> Exportar PDF
               </button>
               <button onClick={onClose} className="p-3 hover:bg-gray-200 rounded-full transition text-gray-400">
                 <X size={24} />
               </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {DEFAULT_PIPELINE.stages.map((stage, idx) => {
              const isActive = stage === currentPipelineStage;
              const isPast = DEFAULT_PIPELINE.stages.indexOf(stage) < currentStageIndex;
              return (
                <React.Fragment key={stage}>
                  <div className={`flex flex-col items-center gap-2 flex-1 relative`}>
                    <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${isPast ? 'bg-green-500' : isActive ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-blue-600' : isPast ? 'text-green-600' : 'text-gray-400'}`}>{stage}</span>
                  </div>
                  {idx < DEFAULT_PIPELINE.stages.length - 1 && <div className="w-4"></div>}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Action Bar - Hidden in Print */}
        {nextStage && (
          <div className={`px-8 py-4 flex items-center justify-between border-b print:hidden ${canAdvanceStage ? 'bg-green-50/50' : 'bg-amber-50/50'}`}>
            <div className="flex items-center gap-3">
              {canAdvanceStage ? <CheckCircle2 size={18} className="text-green-500" /> : <AlertCircle size={18} className="text-amber-500" />}
              <p className="text-xs font-bold text-gray-700">
                {canAdvanceStage
                  ? `Pronto para ${nextStage}`
                  : needsEmailForNegotiation
                  ? 'Finalize a proposta e envie o email ao cliente para avançar para 1º Follow up.'
                  : `Falta: ${missing.join(', ')}`}
              </p>
            </div>
            {canAdvanceStage && (
              <button onClick={() => moveOpportunityStage(opportunity.id, nextStage as any)} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition shadow-lg shadow-green-100">
                Mover para {nextStage} <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}

        {/* Tabs - Hidden in Print */}
        <div className="flex border-b px-8 bg-white print:hidden">
          <button onClick={() => setActiveTab('proposals')} className={`flex items-center gap-2 px-8 py-5 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'proposals' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <Sparkles size={18} /> Briefing & Propostas
          </button>
          <button onClick={() => setActiveTab('ai')} className={`flex items-center gap-2 px-8 py-5 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'ai' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <Star size={18} /> Assistente IA
          </button>
          <button onClick={() => setActiveTab('chat')} className={`flex items-center gap-2 px-8 py-5 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'chat' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <MessageCircle size={18} /> Notas
          </button>
          <button onClick={() => setActiveTab('docs')} className={`flex items-center gap-2 px-8 py-5 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'docs' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <PaperclipIcon size={18} /> Documentos
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row print:flex-col print:overflow-visible">
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white print:p-0 print:overflow-visible">
            
            {activeTab === 'proposals' && (
              <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
                
                {/* Print Header */}
                <div className="hidden print:block proposal-header">
                  <div className="flex items-start justify-between gap-8">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                        {AGENCY_PROFILE.logoUrl ? (
                          <img
                            src={AGENCY_PROFILE.logoUrl}
                            alt={`${AGENCY_PROFILE.brandName} logo`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-blue-600 text-xl font-black">{AGENCY_PROFILE.logoInitials}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-blue-600">Proposta Comercial</p>
                        <h1 className="text-3xl font-black text-gray-900">{opportunity.title}</h1>
                        <p className="text-sm text-gray-500 mt-1">Ref. {opportunity.id}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-600 font-medium">
                      <p className="font-black text-gray-900">{AGENCY_PROFILE.brandName}</p>
                      <p>{AGENCY_PROFILE.legalName}</p>
                      <p>{AGENCY_PROFILE.taxId}</p>
                      <p>{AGENCY_PROFILE.address}</p>
                      <p>{AGENCY_PROFILE.phone} • {AGENCY_PROFILE.email}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-8 text-xs">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Dados do Cliente</p>
                      <p className="font-black text-gray-900">{client?.name || 'Cliente não identificado'}</p>
                      <p className="text-gray-600">{client?.email || 'Email não registado'}</p>
                      <p className="text-gray-600">{client?.phone || 'Telefone não registado'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Resumo da Viagem</p>
                      <p><span className="font-black text-gray-900">Consultor:</span> {opportunity.owner}</p>
                      <p><span className="font-black text-gray-900">Data da proposta:</span> {new Date().toLocaleDateString('pt-PT')}</p>
                      <p><span className="font-black text-gray-900">Dias de viagem:</span> {travelDays || '-'}</p>
                      <p><span className="font-black text-gray-900">Pessoas:</span> {totalPax} ({opportunity.adults} adultos / {opportunity.children} crianças)</p>
                    </div>
                  </div>
                </div>

                {/* AI Insights Card - Hidden in Print */}
                {proposalWorkflowStatus !== 'idle' && (
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-200 print:hidden">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <Sparkles size={24} className="text-blue-200" />
                        <div>
                          <h3 className="text-lg font-black tracking-tight leading-none">Análise Comercial IA</h3>
                          <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mt-1">Estratégias de Venda Gemini</p>
                        </div>
                      </div>
                      <button
                        onClick={handleAIAnalysis}
                        disabled={isAnalyzing}
                        className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition backdrop-blur-md disabled:opacity-50"
                      >
                        {isAnalyzing ? 'A analisar...' : 'Atualizar Insights'}
                      </button>
                    </div>
                    {aiAnalysis ? (
                      <div className="text-sm font-medium leading-relaxed bg-white/10 p-6 rounded-2xl border border-white/10 whitespace-pre-wrap">
                        {aiAnalysis}
                      </div>
                    ) : (
                      <p className="text-sm opacity-60 italic">Solicite uma análise à IA para identificar pontos fortes e lacunas nesta oportunidade.</p>
                    )}
                  </div>
                )}

                {/* Briefing Summary */}
                <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 print:bg-white print:border-none print:p-0">
                  <div className="flex justify-between items-start mb-6 print:hidden">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Recolha de Briefing</h3>
                    <div className="flex flex-wrap gap-3 items-center justify-end">
                      {proposalWorkflowStatus === 'idle' && (
                        <button
                          onClick={handleInsertProposal}
                          className="bg-gray-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition hover:bg-black"
                        >
                          <Plus size={14} /> Criar Proposta
                        </button>
                      )}
                      {opportunity.proposalSentAt && (
                        <span className="px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-[10px] font-black uppercase tracking-widest text-green-700">
                          Email enviado em {new Date(opportunity.proposalSentAt).toLocaleDateString('pt-PT')}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="hidden print:block text-xl font-bold mb-4 border-l-4 border-blue-600 pl-4">Contexto e Requisitos</h3>
                  <div className="p-6 bg-white rounded-2xl border border-gray-100 text-sm text-gray-600 leading-relaxed print:p-0 print:border-none">
                    {opportunity.briefingNotes || 'O briefing inicial ainda não foi detalhado.'}
                  </div>
                  
                  {proposalWorkflowStatus !== 'idle' && opportunity.proposalOptions.length === 0 && (
                    <div className="mt-6 print:hidden p-6 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50">
                      <p className="text-sm font-bold text-blue-900">Ainda não existem propostas criadas.</p>
                      <p className="text-xs text-blue-700 font-medium mt-1">Crie a primeira proposta em branco e monte tudo do zero.</p>
                      <button
                        onClick={() => setIsCreatingOption(true)}
                        className="mt-4 px-5 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition"
                      >
                        Adicionar Primeira Proposta
                      </button>
                    </div>
                  )}
                </div>

                {proposalWorkflowStatus !== 'idle' && (
                  <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm print:hidden">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-6">
                      <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Quadro de Construção da Proposta</h3>
                        <p className="text-sm text-gray-500 font-medium">Monte cada alternativa com voo, hotel, transfer e seguro.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                          proposalIsFinalized
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {proposalIsFinalized ? 'Proposta Finalizada' : 'Proposta em Edição'}
                        </span>
                        {proposalIsFinalized ? (
                          <button
                            onClick={handleReopenProposal}
                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-900 text-white hover:bg-black transition"
                          >
                            Editar Proposta
                          </button>
                        ) : (
                          <button
                            onClick={handleFinalizeProposal}
                            disabled={!opportunity.proposalOptions.length || isSendingEmail}
                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isSendingEmail ? 'A enviar...' : (isFollowUpStage ? 'Finalizar Revisão' : 'Finalizar e Enviar')}
                          </button>
                        )}
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Eco • Premium • Luxo</p>
                      </div>
                    </div>

                    {proposalIsFinalized && (
                      <p className="mb-4 text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                        Proposta finalizada em {new Date(opportunity.proposalFinalizedAt || new Date()).toLocaleString('pt-PT')}. Clique em <b>Editar Proposta</b> para ajustar extras e alternativas.
                      </p>
                    )}

                    <div className="rounded-3xl border border-gray-100 bg-gray-50/50 p-5 space-y-4">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-gray-900">Criar Propostas do Zero</p>
                          <p className="text-xs text-gray-500 font-medium">Pode criar várias propostas e editar tudo manualmente.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {proposalLevels.map(level => (
                            <button
                              key={level}
                              onClick={() => handleCreateLevelOption(level)}
                              disabled={!proposalIsEditable}
                              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-blue-200 hover:text-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              + {level}
                            </button>
                          ))}
                          <button
                            onClick={() => setIsCreatingOption(true)}
                            disabled={!proposalIsEditable}
                            className="px-3 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Nova Proposta
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showSuppliersBoard && (
                  <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm print:hidden">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
                      <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Quadro de Fornecedores da Reserva</h3>
                        <p className="text-sm text-gray-500 font-medium">Com proposta aceite, registe fornecedores contratados e leia faturas por foto.</p>
                      </div>
                      <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-green-50 text-green-700 border-green-200">
                        Proposta Aceite
                      </span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Inserção Manual</h4>
                        <div className="space-y-3">
                          <select
                            value={selectedSupplierId}
                            onChange={e => setSelectedSupplierId(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white"
                          >
                            <option value="">Selecionar fornecedor...</option>
                            {suppliers.map(supplier => (
                              <option key={supplier.id} value={supplier.id}>{supplier.name} ({supplier.category})</option>
                            ))}
                          </select>
                          <select
                            value={supplierServiceType}
                            onChange={e => setSupplierServiceType(e.target.value as ServiceType)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white"
                          >
                            {Object.values(ServiceType).map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          <input
                            value={supplierServiceDescription}
                            onChange={e => setSupplierServiceDescription(e.target.value)}
                            placeholder="Serviço contratado"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                          />
                          <input
                            type="number"
                            value={supplierContractedAmount}
                            onChange={e => setSupplierContractedAmount(e.target.value)}
                            placeholder="Valor contratado (€)"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                          />
                          <button
                            onClick={handleAddSupplierBookingManual}
                            className="w-full bg-blue-600 text-white rounded-xl py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition"
                          >
                            Associar Fornecedor
                          </button>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Ler Fatura por Foto</h4>
                        <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-blue-300 text-blue-700 text-[10px] font-black uppercase tracking-widest bg-blue-50 hover:bg-blue-100 transition cursor-pointer">
                          <Upload size={14} /> Tirar Foto / Carregar Fatura
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleInvoicePhotoChange}
                          />
                        </label>
                        <div className="mt-4 space-y-2">
                          {isReadingInvoice ? (
                            <p className="text-xs font-bold text-blue-600 flex items-center gap-2">
                              <Loader2 size={14} className="animate-spin" /> A ler a fatura e a extrair fornecedor/serviço...
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 font-medium">
                              O sistema tenta preencher automaticamente fornecedor e serviço contratado.
                            </p>
                          )}
                          {invoicePreviewName && (
                            <p className="text-xs text-gray-700 font-bold">Última fatura: {invoicePreviewName}</p>
                          )}
                        </div>
                        <button
                          onClick={handleAddSupplierBookingFromInvoice}
                          disabled={!invoicePreviewName || isReadingInvoice}
                          className="mt-4 w-full bg-emerald-600 text-white rounded-xl py-3 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Confirmar Fornecedor da Fatura
                        </button>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Fornecedores Associados</h4>
                      <div className="space-y-3">
                        {supplierBookings.map(booking => (
                          <div key={booking.id} className="p-4 border border-gray-100 rounded-2xl bg-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-gray-900">{booking.supplierName}</p>
                              <p className="text-xs text-gray-600 font-medium">
                                {booking.serviceType} • {booking.serviceDescription}
                              </p>
                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                                {booking.source === 'invoice' ? 'Origem: Fatura' : 'Origem: Manual'} • {new Date(booking.createdAt).toLocaleDateString('pt-PT')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                {typeof booking.contractedAmount === 'number' ? `€${Math.round(booking.contractedAmount).toLocaleString('pt-PT')}` : 'Valor n/d'}
                              </span>
                              <button
                                onClick={() => handleRemoveSupplierBooking(booking.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {!supplierBookings.length && (
                          <div className="p-5 border border-dashed border-gray-200 rounded-2xl text-center text-xs font-medium text-gray-400">
                            Ainda não existem fornecedores associados a esta reserva.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isClosedWon && (
                  <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm print:hidden">
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Checklist da Viagem</h3>
                        <p className="text-sm text-gray-500 font-medium">Validação final de tudo o que é necessário antes da partida.</p>
                      </div>
                      <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-blue-50 text-blue-700 border-blue-200">
                        Reserva Ganha
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(opportunity.checklist || []).map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleToggleChecklistItem(item.id)}
                          className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                            item.isCompleted
                              ? 'bg-green-50 border-green-200 text-green-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-200 hover:bg-blue-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} className="text-gray-300" />}
                            <span className="text-sm font-bold">{item.label}</span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {item.isCompleted ? 'Concluído' : (item.isRequired ? 'Obrigatório' : 'Opcional')}
                          </span>
                        </button>
                      ))}
                      {(opportunity.checklist || []).length === 0 && (
                        <div className="p-5 border border-dashed border-gray-200 rounded-2xl text-center text-xs font-medium text-gray-400">
                          Ainda não existem itens de checklist para esta viagem.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isFollowUpStage && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 print:hidden">
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-7 shadow-sm">
                      <h4 className="text-lg font-black text-gray-900 mb-1">Lembretes e Alertas de Negociação</h4>
                      <p className="text-xs text-gray-500 font-medium mb-5">Crie ações para follow-up, urgência e gestão de objeções.</p>

                      <div className="space-y-3">
                        <input
                          value={newNegotiationTaskTitle}
                          onChange={e => setNewNegotiationTaskTitle(e.target.value)}
                          placeholder="Ex: Cliente pediu ajuste no hotel premium"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                        <input
                          type="date"
                          value={newNegotiationTaskDate}
                          onChange={e => setNewNegotiationTaskDate(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCreateNegotiationTask('reminder')}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition"
                          >
                            Criar Lembrete
                          </button>
                          <button
                            onClick={() => handleCreateNegotiationTask('alert')}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition"
                          >
                            Criar Alerta
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-7 shadow-sm">
                      <h4 className="text-lg font-black text-gray-900 mb-1">Extras e Pedidos do Cliente</h4>
                      <p className="text-xs text-gray-500 font-medium mb-5">Anexe pedidos para negociar upgrades, extras e alterações.</p>

                      <textarea
                        value={clientRequestText}
                        onChange={e => setClientRequestText(e.target.value)}
                        rows={4}
                        placeholder="Ex: Cliente pediu transfer privado no regresso e seguro com cobertura premium."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                      />
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {proposalIsEditable ? 'Proposta em edição para adicionar extras.' : 'Clique em Editar Proposta para acrescentar extras.'}
                        </p>
                        <button
                          onClick={handleAttachClientRequest}
                          className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition"
                        >
                          Anexar Pedido
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isFollowUpStage && (
                  <div className="bg-white border border-gray-100 rounded-[2.5rem] p-7 shadow-sm print:hidden">
                    <h4 className="text-lg font-black text-gray-900 mb-1">Fecho da Negociação</h4>
                    <p className="text-xs text-gray-500 font-medium mb-5">
                      Marque a alternativa escolhida e feche como aceite ou não aceite.
                    </p>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="text-xs font-bold text-gray-600">
                        {acceptedOption
                          ? `Opção selecionada para aceite: ${acceptedOption.label} (${acceptedOption.title})`
                          : 'Sem opção marcada. Selecione uma proposta abaixo antes de fechar como aceite.'}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleCloseAsAccepted}
                          disabled={!hasAcceptedProposal}
                          className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Aceite e Fechar
                        </button>
                        <button
                          onClick={handleCloseAsRejected}
                          className="px-5 py-3 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition"
                        >
                          Não Aceite
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Proposals Grid */}
                {opportunity.proposalOptions.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print:grid-cols-1 print:gap-20">
                    {orderedOptions.map(opt => {
                      const colors = getOptionColors(opt.label);
                      return (
                        <div 
                          key={opt.id} 
                          className={`flex flex-col rounded-[2.5rem] border-2 transition-all duration-300 bg-white shadow-lg print:border-0 print:shadow-none print:break-inside-avoid ${
                            opt.isAccepted ? 'border-green-500 bg-green-50/10 scale-[1.02] print:scale-100' : 'border-gray-100'
                          }`}
                        >
                           <div className={`p-8 pb-4 relative rounded-t-[2.5rem] ${colors.header}`}>
                              <div className="flex justify-between items-center mb-4 print:hidden">
                                 <span className={`px-3 py-1 border rounded-lg text-[9px] font-black uppercase tracking-widest ${colors.badge}`}>{opt.label}</span>
                                 <div className="flex items-center gap-2">
                                   {opt.isAccepted && <span className="bg-green-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1 shadow-sm"><CheckCircle size={10} /> Proposta Selecionada</span>}
                                   {proposalIsEditable && (
                                     <>
                                       <button
                                         onClick={() => handleEditProposalOptionMeta(opt.id)}
                                         className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition"
                                       >
                                         <Edit3 size={12} />
                                       </button>
                                       <button
                                         onClick={() => handleRemoveProposalOption(opt.id)}
                                         className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 transition"
                                       >
                                         <Trash2 size={12} />
                                       </button>
                                     </>
                                   )}
                                 </div>
                              </div>
                              <h4 className="text-lg font-black text-gray-900 leading-tight h-12 overflow-hidden print:h-auto print:text-2xl print:mb-4">{opt.title}</h4>
                              <p className="text-3xl font-black text-gray-900 mt-4 tracking-tighter print:text-4xl print:text-blue-600">€{Math.round(opt.totalPrice).toLocaleString()}</p>
                           </div>
                           
                           <div className="p-8 space-y-6 flex-1">
                              {/* Service Components */}
                              <div>
                                <div className="flex justify-between items-center mb-4">
                                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Itens da Proposta</h5>
                                  <button
                                    onClick={() => setIsAddingItem(opt.id)}
                                    disabled={!proposalIsEditable}
                                    className="print:hidden p-1 hover:bg-blue-100 rounded text-blue-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                                
                                <div className="space-y-3">
                                  {opt.components.map(comp => (
                                    <div key={comp.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                                          {getServiceIcon(comp.type)}
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold text-gray-900">{comp.description}</p>
                                          <p className="text-[9px] text-gray-400 font-bold uppercase">{comp.provider}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-gray-900">€{Math.round(comp.cost * (1 + comp.margin)).toLocaleString()}</span>
                                        <button
                                          onClick={() => handleRemoveItem(opt.id, comp.id)}
                                          disabled={!proposalIsEditable}
                                          className="print:hidden opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition disabled:opacity-20 disabled:cursor-not-allowed"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {/* Add Item Inline Form */}
                                  {proposalIsEditable && isAddingItem === opt.id && (
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in slide-in-from-top-1">
                                      <div className="grid grid-cols-2 gap-2 mb-2">
                                        <select 
                                          value={newItemType} 
                                          onChange={e => setNewItemType(e.target.value as ServiceType)}
                                          className="text-[10px] font-bold p-2 rounded border bg-white outline-none"
                                        >
                                          {Object.values(ServiceType).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <input 
                                          value={newItemProvider} 
                                          onChange={e => setNewItemProvider(e.target.value)}
                                          placeholder="Fornecedor" 
                                          className="text-[10px] font-bold p-2 rounded border outline-none" 
                                        />
                                      </div>
                                      <input 
                                        value={newItemDesc} 
                                        onChange={e => setNewItemDesc(e.target.value)}
                                        placeholder="Descrição do serviço" 
                                        className="w-full text-[10px] font-bold p-2 rounded border mb-2 outline-none" 
                                      />
                                      <div className="flex gap-2">
                                        <input 
                                          type="number"
                                          value={newItemCost} 
                                          onChange={e => setNewItemCost(e.target.value)}
                                          placeholder="Custo (€)" 
                                          className="flex-1 text-[10px] font-bold p-2 rounded border outline-none" 
                                        />
                                        <button onClick={() => handleAddItem(opt.id)} className="bg-blue-600 text-white px-4 rounded-lg text-[10px] font-black uppercase tracking-widest">Adicionar</button>
                                        <button onClick={() => setIsAddingItem(null)} className="p-2 text-gray-400"><X size={14} /></button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Inclusões & Destaques</h5>
                                <div className="space-y-2">
                                  {opt.inclusions.map((inc, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                      <CheckCircle size={14} className="text-green-500" /> {inc}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 print:bg-white print:border-l-4 print:border-blue-600 print:rounded-none">
                                 <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Nota Justificativa</p>
                                 <p className="text-xs text-gray-600 italic leading-snug">{opt.description}</p>
                              </div>
                           </div>

                           <div className="p-8 pt-0 print:hidden">
                              {isFollowUpStage && !opt.isAccepted && (
                                <button 
                                  onClick={() => handleAcceptProposal(opt.id)} 
                                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition shadow-xl active:scale-95"
                                >
                                  Marcar como Opção Aceite
                                </button>
                              )}
                           </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Print Footer */}
                <div className="hidden print:block mt-20 pt-8 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-10">
                    <div>
                      <h4 className="text-lg font-black mb-4">Termos e Condições</h4>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        A presente proposta é válida por 48 horas. Os preços indicados estão sujeitos a confirmação no momento da reserva final. 
                        Qualquer alteração solicitada poderá implicar ajuste de valores. Inclui taxas de aeroporto e combustível à data de hoje.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-8">Assinatura Digital / Confirmação</p>
                      <div className="inline-block border-b-2 border-gray-200 w-48 h-10"></div>
                      <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">{client?.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Assistente IA</h3>
                    <p className="text-sm text-gray-500 font-medium">Ideias, perguntas em falta, texto de proposta e itinerário (rascunhos).</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleGenerateDraft('perguntas_em_falta')}
                      disabled={isGeneratingDraft}
                      className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition disabled:opacity-50"
                    >
                      {isGeneratingDraft ? 'A gerar...' : 'Perguntas em Falta'}
                    </button>
                    <button
                      onClick={() => handleGenerateDraft('ideias')}
                      disabled={isGeneratingDraft}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {isGeneratingDraft ? 'A gerar...' : 'Gerar Ideias'}
                    </button>
                    <button
                      onClick={() => handleGenerateDraft('texto_proposta')}
                      disabled={isGeneratingDraft}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {isGeneratingDraft ? 'A gerar...' : 'Texto de Proposta'}
                    </button>
                    <button
                      onClick={() => handleGenerateDraft('itinerario')}
                      disabled={isGeneratingDraft}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {isGeneratingDraft ? 'A gerar...' : 'Itinerário'}
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white rounded-[2.5rem] p-8 shadow-2xl shadow-blue-200">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-black">Análise rápida</h4>
                      <p className="text-xs opacity-90 font-bold">Dicas para fechar + gaps do briefing</p>
                    </div>
                    <button
                      onClick={handleAIAnalysis}
                      disabled={isAnalyzing}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                    >
                      {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {isAnalyzing ? 'A analisar...' : 'Gerar análise'}
                    </button>
                  </div>
                  <div className="mt-6">
                    {aiAnalysis ? (
                      <div className="text-sm font-medium leading-relaxed bg-white/10 p-6 rounded-2xl border border-white/10 whitespace-pre-wrap">
                        {aiAnalysis}
                      </div>
                    ) : (
                      <p className="text-sm opacity-80 font-medium">Clica em <b>Gerar análise</b> para receber recomendações e identificar gaps.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-black text-gray-900">Rascunhos gerados</h4>
                    <p className="text-xs text-gray-500 font-bold">Guardados nesta oportunidade</p>
                  </div>

                  {(opportunity.aiDrafts || []).length ? (
                    <div className="space-y-4">
                      {(opportunity.aiDrafts || []).map(d => (
                        <div key={d.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{d.title}</p>
                              <p className="text-[10px] text-gray-400 font-bold mt-1">{new Date(d.createdAt).toLocaleString('pt-PT')} • {d.createdBy}</p>
                            </div>
                            <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">{d.type}</span>
                          </div>
                          <pre className="mt-4 text-sm whitespace-pre-wrap font-medium text-gray-800 leading-relaxed">
{d.content}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                      <Sparkles size={40} className="mb-4 opacity-10" />
                      <p className="text-sm font-bold uppercase tracking-widest opacity-40">Ainda não há rascunhos</p>
                      <p className="text-xs font-medium mt-1">Usa os botões acima para gerar conteúdo.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'docs' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black text-gray-900">Arquivo de Documentação</h3>
                   <label className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:bg-blue-700 transition shadow-lg shadow-blue-100">
                      <Upload size={14} /> Carregar Ficheiro
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                   </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {opportunity.attachments.map(att => (
                     <div key={att.id} className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition group">
                        <div className="flex justify-between items-start mb-4">
                           <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                              <FileText size={24} />
                           </div>
                           <button className="text-gray-300 hover:text-red-500 transition"><Trash2 size={16} /></button>
                        </div>
                        <p className="font-bold text-gray-900 truncate text-sm">{att.name}</p>
                        <div className="flex justify-between items-center mt-4">
                           <span className="text-[10px] font-black text-gray-400 uppercase">{att.size}</span>
                           <button className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">Download</button>
                        </div>
                     </div>
                   ))}
                   {opportunity.attachments.length === 0 && (
                     <div className="col-span-full py-20 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                        <PaperclipIcon size={40} className="mb-4 opacity-10" />
                        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Sem documentos associados</p>
                        <p className="text-xs font-medium mt-1">Anexe passaportes, vouchers ou vistos aqui.</p>
                     </div>
                   )}
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto pr-4 custom-scrollbar mb-6">
                  {opportunity.comments.length > 0 ? opportunity.comments.map(c => (
                    <div key={c.id} className={`flex ${c.role === 'agent' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-5 rounded-3xl ${c.role === 'agent' ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'}`}>
                        <p className="text-sm font-medium leading-relaxed">{c.text}</p>
                        <div className="flex justify-between items-center mt-2 opacity-50">
                           <p className="text-[9px] font-black uppercase tracking-widest">{c.author}</p>
                           <p className="text-[9px] font-black uppercase">{new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                       <MessageCircle size={40} className="mb-2" />
                       <p className="text-xs font-bold uppercase tracking-widest">Sem notas de negociação</p>
                    </div>
                  )}
                </div>
                <div className="bg-gray-100 p-2 rounded-[2rem] flex items-center gap-2 border border-gray-200">
                   <input 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newMessage.trim()) {
                        const comm: ProposalComment = { id: Math.random().toString(), author: opportunity.owner, role: 'agent', text: newMessage, timestamp: new Date().toISOString() };
                        updateOpportunity(opportunity.id, { comments: [...opportunity.comments, comm] });
                        setNewMessage('');
                      }
                    }}
                    placeholder="Escreva uma nota ou registe uma objeção..." 
                    className="flex-1 bg-transparent px-6 py-4 text-sm font-medium outline-none" 
                   />
                   <button 
                    onClick={() => {
                      if (!newMessage.trim()) return;
                      const comm: ProposalComment = { id: Math.random().toString(), author: opportunity.owner, role: 'agent', text: newMessage, timestamp: new Date().toISOString() };
                      updateOpportunity(opportunity.id, { comments: [...opportunity.comments, comm] });
                      setNewMessage('');
                    }} 
                    className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition"
                   >
                      <Send size={20} />
                   </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Contextual - Hidden in Print */}
          <div className="w-full lg:w-96 border-l p-10 bg-gray-50/30 flex flex-col space-y-10 overflow-y-auto custom-scrollbar print:hidden">
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Thermometer size={14} className="text-red-500" /> Temperatura de Venda
              </h4>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                   <span className={`text-2xl font-black ${opportunity.temperature > 70 ? 'text-red-600' : 'text-blue-600'}`}>{opportunity.temperature}%</span>
                   <TrendingUp size={20} className={opportunity.temperature > 70 ? 'text-red-500' : 'text-blue-500'} />
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${opportunity.temperature > 70 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-blue-500'}`} style={{ width: `${opportunity.temperature}%` }}></div>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <CheckSquare size={14} className="text-blue-600" /> Checklist & SLA
              </h4>
              <div className="space-y-4">
                {opportunity.tasks?.filter(t => !t.isCompleted).map(task => (
                  <div key={task.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3 group hover:border-blue-200 transition">
                    <button 
                      onClick={() => {
                        const updatedTasks = opportunity.tasks.map(t => t.id === task.id ? { ...t, isCompleted: true } : t);
                        updateOpportunity(opportunity.id, { tasks: updatedTasks });
                      }} 
                      className="mt-1 text-gray-200 hover:text-blue-600 transition"
                    >
                      <Circle size={20} />
                    </button>
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition">{task.title}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase mt-1 flex items-center gap-1">
                         <Clock size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {opportunity.tasks?.filter(t => !t.isCompleted).length === 0 && (
                   <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center py-6">Sem tarefas pendentes</p>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-3">
               <button className="w-full py-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-100 transition">
                  <ExternalLink size={16} /> Link Direto Proposta
               </button>
               {!isClosedStage && (
                 <button className="w-full py-4 text-red-400 text-[10px] font-black uppercase tracking-widest hover:text-red-600 transition">
                    Descartar Oportunidade
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>

      {isCreatingOption && (
        <div
          className="fixed inset-0 z-[70] flex items-stretch sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setIsCreatingOption(false)}
        >
          <div
            className="w-full h-full sm:h-[90vh] max-w-none sm:max-w-5xl bg-white rounded-none sm:rounded-[2.5rem] shadow-2xl border border-blue-100 overflow-hidden animate-in zoom-in duration-200 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-8 py-6 border-b bg-gradient-to-r from-blue-50 via-white to-blue-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Nova Proposta</p>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">Janela Ampliada de Criação</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Mais espaço para definir a proposta antes de montar os componentes.</p>
              </div>
              <button
                onClick={() => setIsCreatingOption(false)}
                className="p-3 rounded-full hover:bg-gray-100 text-gray-500 transition self-start sm:self-auto"
                aria-label="Fechar criação de proposta"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 overflow-y-auto min-h-0">
              <div className="lg:col-span-3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nível</p>
                    <select
                      value={newOptionLabel}
                      onChange={e => setNewOptionLabel(e.target.value as ProposalOption['label'])}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white"
                    >
                      <option value="Eco">Eco</option>
                      <option value="Conforto">Conforto</option>
                      <option value="Premium">Premium</option>
                      <option value="Luxo">Luxo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Título</p>
                    <input
                      value={newOptionTitle}
                      onChange={e => setNewOptionTitle(e.target.value)}
                      placeholder="Ex: Roma Premium para casal"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Descrição Breve</p>
                  <textarea
                    value={newOptionDescription}
                    onChange={e => setNewOptionDescription(e.target.value)}
                    placeholder="Resumo rápido dos pontos fortes, upgrades ou estilo da proposta."
                    rows={5}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sugestão</p>
                    <p className="text-sm font-semibold text-gray-800 mt-2">Inclua algo que diferencie esta opção.</p>
                    <p className="text-xs text-gray-500 mt-2">Ex: hotel boutique, voos diretos, transfer privado.</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Próximo passo</p>
                    <p className="text-sm font-semibold text-gray-800 mt-2">Depois pode adicionar voos, hotéis e extras.</p>
                    <p className="text-xs text-gray-500 mt-2">A proposta fica em modo rascunho.</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className={`relative overflow-hidden rounded-2xl border ${summaryPalette.surface} shadow-sm`}>
                  <div className={`px-4 py-3 border-b ${summaryPalette.header} flex items-center justify-between`}>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Resumo Visual</p>
                      <p className="text-xs font-semibold text-gray-700 mt-1">Prévia da proposta</p>
                    </div>
                    <span className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-widest ${summaryPalette.badge}`}>
                      {newOptionLabel}
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    <p className="text-xl font-black text-gray-900">{newOptionTitle || 'Título da proposta'}</p>
                    <p className="text-sm text-gray-600">{newOptionDescription || 'Adicione uma descrição para ajudar o cliente a decidir.'}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Status</p>
                        <p className="text-xs font-bold text-gray-800 mt-1">Rascunho</p>
                      </div>
                      <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Foco</p>
                        <p className="text-xs font-bold text-gray-800 mt-1">{summaryFocus}</p>
                      </div>
                      <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Itens</p>
                        <p className="text-xs font-bold text-gray-800 mt-1">Por definir</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-white/50 blur-2xl pointer-events-none"></div>
                </div>

                <div className="p-5 rounded-2xl border border-gray-100 bg-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Checklist Rápido</p>
                  <p className="text-sm text-gray-700 mt-3">Título claro e objetivo.</p>
                  <p className="text-sm text-gray-700 mt-2">Descrição com 1-2 benefícios-chave.</p>
                  <p className="text-sm text-gray-700 mt-2">Consistência com o nível selecionado.</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t bg-gray-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-gray-500 font-medium">Pode editar esta proposta depois no quadro principal.</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreatingOption(false)}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCustomOption}
                  disabled={!proposalIsEditable}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar em Branco
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityDetailModal;
