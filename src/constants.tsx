
import { Client, Opportunity, CommChannel, OpportunityStatus, Pipeline, Employee, EmployeeRole, PaymentStatus, ServiceType, Campaign, Supplier } from './types';
import aboutDestinyLogo from './assets/about-destiny-logo.svg';

export const DEFAULT_PIPELINE: Pipeline = {
  id: 'p1',
  name: 'Pipeline Comercial',
  stages: ['Carteira', 'Proposta Enviada', '1º Follow up', '2º Follow up', 'Ganho', 'Perdido']
};

export const AGENCY_PROFILE = {
  logoInitials: 'AD',
  logoUrl: aboutDestinyLogo,
  brandName: 'About Destiny',
  legalName: 'About Destiny, Lda.',
  address: 'Av. da Liberdade 100, Lisboa',
  email: 'reservas@aboutdestiny.pt',
  phone: '+351 210 000 000',
  website: 'www.aboutdestiny.pt',
  taxId: 'NIF 000 000 000',
};

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Marco Eliseu da Costa Rebelo',
    shortName: 'Marco',
    email: 'marco.rebelo@example.com',
    phone: '+351 912 345 678',
    birthDate: '1985-06-15',
    passportExpiry: '2025-12-10',
    preferredChannel: CommChannel.WHATSAPP,
    preferredLanguage: 'Português',
    location: 'Lisboa, Portugal',
    nationality: 'Portuguesa',
    document: {
      type: 'Passaporte',
      number: 'P1234567',
      expiry: '2025-12-10',
    },
    corporate: {
      taxId: '509000000',
      billingAddress: 'Rua das Flores 45, 1200-121 Lisboa',
      invoiceName: 'Marco Eliseu Rebelo',
      companyName: 'Rebelo Consulting',
      costCenter: 'Marketing',
    },
    preferences: {
      styles: ['Praia', 'Cultural', 'Família'],
      pace: 'Equilibrado',
      stopoverTolerance: '1 escala',
      preferredTimes: 'Manhã',
      hotel: {
        stars: '4-5',
        breakfast: 'Incluído',
        location: 'Centro histórico',
        bed: 'Cama King',
        accessibility: 'Elevador e duche walk-in',
      },
      flight: {
        lowCostOk: false,
        baggage: '23kg incluídos',
        seats: 'Corredor preferencial',
        preferredAirlines: ['TAP', 'Emirates'],
        avoidAirlines: ['Ryanair'],
      },
      budgetRange: '€2.500 – €4.000',
      priceSensitivity: 'Media',
    },
    health: {
      dietary: ['Sem lactose'],
      mobilityNotes: 'Sem limitações',
      medicalNotes: 'Asma leve (informa sempre o hotel)',
      insurancePreference: 'Prefere seguro com cancelamento e saúde',
      sensitiveNotes: 'Partilhar apenas com equipa de operações, com consentimento',
    },
    emergency: {
      name: 'Maria Rebelo',
      phone: '+351 913 222 333',
      preferredChannel: CommChannel.WHATSAPP,
    },
    loyalty: {
      history: '3 viagens nos últimos 24 meses',
      totalValue: '€12.400',
      favoriteDestinations: ['Ilhas Gregas', 'Zanzibar'],
      nps: 9,
      consultantNotes: 'Valoriza hotéis boutique e experiências privadas.',
      lossReason: 'Perdeu proposta em 2023 por preço final',
    },
    operations: {
      importantNotes: 'Evita escalas longas e hotéis muito grandes.',
      pendingItems: ['Enviar CC atualizado', 'Pagamento 2ª prestação em atraso'],
      autoAlerts: ['Passaporte expira em 10/12/2025', 'Visto necessário para Tanzânia', 'Sem resposta há 5 dias'],
    },
    travelCompanions: [
      {
        name: 'Maria Rebelo',
        relationship: 'Cônjuge',
        birthDate: '1989-02-01',
        documentType: 'CC',
        documentNumber: 'CC123456',
        preferences: 'Prefere spa e hotéis boutique',
      },
      {
        name: 'Inês Rebelo',
        relationship: 'Filha',
        birthDate: '2016-07-12',
        documentType: 'Passaporte',
        documentNumber: 'P998877',
        preferences: 'Atividades com crianças e piscina',
      },
    ],
    documents: [
      {
        id: 'doc1',
        name: 'Passaporte_Marco.pdf',
        type: 'application/pdf',
        size: '320 KB',
        url: '#',
        uploadedAt: new Date().toISOString(),
      },
    ],
    commChannels: [CommChannel.WHATSAPP, CommChannel.EMAIL],
    family: [
      {
        name: 'Maria Rebelo',
        relationship: 'Cônjuge',
        age: 34,
        birthDate: '1989-02-01',
        documentType: 'CC',
        documentNumber: 'CC123456',
        preferences: 'Spa, hotéis boutique',
      },
    ],
    tags: ['VIP', 'Europe Enthusiast'],
    createdAt: new Date().toISOString()
  }
];

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'o1',
    clientId: 'c1',
    pipelineId: 'p1',
    stage: 'Ganho',
    status: OpportunityStatus.WON,
    limitValue: 5800,
    estimatedMargin: 870,
    adults: 2,
    children: 1,
    owner: 'Bruno Ferreira',
    followers: ['Admin'],
    tags: ['Luxury', 'Family'],
    title: 'Safari na Tanzânia',
    createdAt: '2024-02-04T18:27:00Z',
    lastInteractionAt: new Date().toISOString(),
    departureDate: '2024-08-15',
    returnDate: '2024-08-25',
    temperature: 100,
    preferredChannel: CommChannel.WHATSAPP,
    tripType: 'Lazer',
    proposalStatus: 'finalized',
    proposalFinalizedAt: '2024-05-14T09:00:00Z',
    proposalSentAt: '2024-05-13T15:30:00Z',
    supplierBookings: [],
    // Removed non-existent 'services' property to match Opportunity interface
    proposalOptions: [
      // Fix: Changed 'Melhor' to 'Luxo' and updated fields to match ProposalOption interface from types.ts
      { 
        id: 'opt2', 
        label: 'Luxo', 
        title: 'Safari Comfort+', 
        totalPrice: 5800, 
        description: 'Lodges de luxo.', 
        components: [], 
        inclusions: ['Pensão Completa'], 
        justification: 'Opção premium com foco em conforto e exclusividade.',
        qualityScore: 95,
        isAccepted: true,
        // Added missing 'version' property
        version: 1
      }
    ],
    comments: [],
    history: [],
    paymentPlan: [
      { id: 'm1', label: 'Sinal (30%)', amount: 1740, dueDate: '2024-05-15', status: PaymentStatus.PAID, paidAmount: 1740, paidAt: '2024-05-14' }
    ],
    itinerary: [
      { id: 'i1', type: ServiceType.FLIGHT, title: 'Voo TK1756 - LIS para JRO', dateTime: '2024-08-15T11:00:00Z', location: 'Aeroporto Lisboa', description: 'Escala em Istambul. Franquia 23kg.', confirmationCode: 'ABC123' },
      { id: 'i2', type: ServiceType.HOTEL, title: 'Gran Melia Arusha', dateTime: '2024-08-16T14:00:00Z', location: 'Arusha, Tanzania', description: 'Check-in antecipado solicitado.', confirmationCode: 'RES-9988' }
    ],
    checklist: [
      { id: 'ch1', label: 'Validar Passaportes', isCompleted: true, isRequired: true },
      { id: 'ch2', label: 'Seguro de Viagem Emitido', isCompleted: true, isRequired: true },
      { id: 'ch3', label: 'Visto Eletrónico (e-Visa)', isCompleted: false, isRequired: true },
      { id: 'ch4', label: 'Certificado de Vacinação', isCompleted: true, isRequired: false }
    ],
    supportCases: [
      { id: 's1', title: 'Dúvida sobre Bagagem', severity: 'low', status: 'resolved', createdAt: '2024-05-20T10:00:00Z', lastUpdate: '2024-05-20T11:00:00Z', messages: [] }
    ],
    // Added missing tasks property to satisfy Opportunity interface requirement
    tasks: [],
    // Added missing attachments property to satisfy Opportunity interface requirement
    attachments: []
  }
];

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'e1',
    name: 'Bruno Ferreira',
    email: 'bruno@agencia.pt',
    phone: '+351 910 000 111',
    role: EmployeeRole.MANAGER,
    status: 'Ativo',
    avatarSeed: 'Bruno',
    joinedAt: '2022-01-10',
    primaryTasks: ['Coordenação da equipa', 'Validação de propostas críticas'],
    secondaryTasks: ['Formação interna', 'Escala de atendimento'],
    workSchedule: 'Seg-Sex 09:00 - 18:00',
    workLocation: 'Lisboa',
    accessPassword: 'gestor2026',
    timeClockPin: '1234',
    timeClockEntries: [],
    mission: 'Garantir uma operação comercial previsível e uma equipa de consultoria de alto desempenho.',
    measurableObjectives: [
      {
        id: 'obj-1',
        title: 'Taxa de fecho mensal',
        metric: 'Percentagem de propostas fechadas',
        targetValue: 35,
        currentValue: 24,
        unit: '%',
        dueDate: '2026-12-31',
      },
      {
        id: 'obj-2',
        title: 'NPS de clientes',
        metric: 'Pontuação média de satisfação',
        targetValue: 9,
        currentValue: 8.2,
        unit: 'pts',
        dueDate: '2026-12-31',
      },
    ],
  }
];

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp1',
    name: 'Verão 2026 – Promoções Praia',
    description: 'Campanha interna para concentrar vendas de destinos de praia (Europa e ilhas).',
    packageType: 'Campanha',
    travelType: 'Praia',
    destination: 'Algarve, Portugal',
    days: 7,
    hotel: 'Atlântico Suites 4*',
    flight: 'Voo incluído (Lisboa ↔ Faro)',
    transfer: 'Transfer shuttle aeroporto-hotel',
    startAt: new Date().toISOString(),
    endAt: undefined,
    targetSales: 20,
    targetRevenue: 60000,
    owner: 'Bruno Ferreira',
    status: 'Ativa',
    createdAt: new Date().toISOString(),
  }
];

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'sup1',
    name: 'Atlântico Suites',
    category: 'Hotel',
    contactName: 'Ana Silva',
    contactEmail: 'ana.silva@atlanticosuites.pt',
    contactPhone: '+351 910 222 111',
    contactNotes: 'Prefere contacto por email durante horário comercial.',
    cancellationPolicy: 'Cancelamento gratuito até 7 dias antes do check-in.',
    paymentTerms: '30% na confirmação e restante 72h antes da chegada.',
    cutOff: 'Bloqueio de allotment até 5 dias antes da chegada.',
    internalRating: 4,
    incidents: [
      {
        id: 'inc1',
        date: '2025-09-12T10:00:00Z',
        severity: 'Media',
        description: 'Overbooking em 1 quarto resolvido com upgrade.',
      },
    ],
    usageHistory: [
      {
        id: 'use1',
        date: '2025-11-20T09:30:00Z',
        opportunityTitle: 'Fim de Semana no Porto',
        note: '3 reservas confirmadas sem incidentes.',
      },
      {
        id: 'use2',
        date: '2025-12-18T14:00:00Z',
        opportunityTitle: 'Escapadinha Natal Lisboa',
        note: 'Negociada tarifa especial para grupo familiar.',
      },
    ],
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-12-18T14:00:00Z',
  },
  {
    id: 'sup2',
    name: 'MoveTransfer',
    category: 'Transfer',
    contactName: 'Rui Martins',
    contactEmail: 'operacoes@movetransfer.pt',
    contactPhone: '+351 919 555 444',
    cancellationPolicy: 'Sem custo até 24h antes; depois 50% de penalização.',
    paymentTerms: 'Pagamento a 30 dias por fatura mensal.',
    cutOff: 'Solicitações até 18h do dia anterior.',
    internalRating: 5,
    incidents: [],
    usageHistory: [
      {
        id: 'use3',
        date: '2026-01-05T08:15:00Z',
        opportunityTitle: 'Circuito Madeira Premium',
        note: 'Transfer privado aeroporto-hotel para 4 pax.',
      },
    ],
    createdAt: '2025-02-01T12:00:00Z',
    updatedAt: '2026-01-05T08:15:00Z',
  },
];
