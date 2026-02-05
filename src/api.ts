import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  Client,
  Opportunity,
  Employee,
  EmployeeTimeClockEntry,
  EmployeeObjective,
  EmployeeRole,
  Campaign,
  Supplier,
  ProposalOption,
  ProposalComponent,
  ProposalComment,
  AuditLog,
  Task,
  PaymentMilestone,
  ItineraryItem,
  ChecklistItem,
  SupportCase,
  Attachment,
  SupplierIncident,
  SupplierUsage,
  SupplierBooking,
  AiDraft,
  CommChannel,
  ServiceType,
  TeamChatMessage,
} from './types';

const ensureSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_KEY.');
  }
};

const toNumber = (value: any, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const mapAttachmentRow = (row: any): Attachment => ({
  id: row.id,
  name: row.name,
  type: row.mime_type || row.type || '',
  size: row.size || '',
  url: row.url || '#',
  bucket: row.bucket || undefined,
  path: row.path || undefined,
  uploadedAt: row.uploaded_at || row.created_at || new Date().toISOString(),
});

const mapFamilyRow = (row: any) => ({
  name: row.name,
  relationship: row.relationship || '',
  age: row.age ?? undefined,
  birthDate: row.birth_date || undefined,
  documentType: row.document_type || undefined,
  documentNumber: row.document_number || undefined,
  preferences: row.preferences || undefined,
});

const mapCompanionRow = (row: any) => ({
  name: row.name,
  relationship: row.relationship || undefined,
  birthDate: row.birth_date || undefined,
  documentType: row.document_type || undefined,
  documentNumber: row.document_number || undefined,
  preferences: row.preferences || undefined,
});

const mapClientRow = (row: any): Client => ({
  id: row.id,
  name: row.name,
  shortName: row.short_name || undefined,
  email: row.email,
  phone: row.phone || '',
  birthDate: row.birth_date || new Date().toISOString(),
  passportExpiry: row.passport_expiry || undefined,
  preferredChannel: row.preferred_channel || undefined,
  preferredLanguage: row.preferred_language || undefined,
  location: row.location || undefined,
  nationality: row.nationality || undefined,
  document: row.document || undefined,
  corporate: row.corporate || undefined,
  preferences: row.preferences || undefined,
  health: row.health || undefined,
  emergency: row.emergency || undefined,
  loyalty: row.loyalty || undefined,
  operations: row.operations || undefined,
  commChannels: row.comm_channels || [],
  family: (row.client_family_members || []).map(mapFamilyRow),
  tags: row.tags || [],
  travelCompanions: (row.client_travel_companions || []).map(mapCompanionRow),
  documents: (row.client_documents || []).map(mapAttachmentRow),
  createdAt: row.created_at || new Date().toISOString(),
});

const mapCampaignRow = (row: any): Campaign => ({
  id: row.id,
  name: row.name,
  description: row.description || undefined,
  packageType: row.package_type || undefined,
  travelType: row.travel_type || undefined,
  destination: row.destination || undefined,
  days: row.days ?? undefined,
  hotel: row.hotel || undefined,
  flight: row.flight || undefined,
  transfer: row.transfer || undefined,
  startAt: row.start_at || undefined,
  endAt: row.end_at || undefined,
  targetSales: row.target_sales ?? undefined,
  targetRevenue: row.target_revenue ? toNumber(row.target_revenue) : undefined,
  owner: row.owner || undefined,
  status: row.status || 'Ativa',
  createdAt: row.created_at || new Date().toISOString(),
});

const mapEmployeeTimeClockEntry = (entry: any, index: number): EmployeeTimeClockEntry => ({
  id: entry?.id || `${entry?.timestamp || 'clock'}-${index}`,
  type: entry?.type === 'saida' ? 'saida' : 'entrada',
  timestamp: entry?.timestamp || new Date().toISOString(),
  source: entry?.source === 'manual' ? 'manual' : 'pin',
  note: typeof entry?.note === 'string' && entry.note.trim() ? entry.note : undefined,
});

const mapEmployeeObjective = (objective: any, index: number): EmployeeObjective => ({
  id: objective?.id || `${objective?.title || 'objective'}-${index}`,
  title: objective?.title || '',
  metric: objective?.metric || '',
  targetValue: toNumber(objective?.targetValue ?? objective?.target_value),
  currentValue: toNumber(objective?.currentValue ?? objective?.current_value),
  unit: typeof objective?.unit === 'string' && objective.unit.trim() ? objective.unit : undefined,
  dueDate: typeof objective?.dueDate === 'string'
    ? objective.dueDate
    : typeof objective?.due_date === 'string'
    ? objective.due_date
    : undefined,
});

const mapEmployeeRow = (row: any): Employee => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone || '',
  role: row.role || EmployeeRole.CONSULTANT,
  status: row.status || 'Ativo',
  avatarSeed: row.avatar_seed || row.name,
  joinedAt: row.joined_at || new Date().toISOString(),
  primaryTasks: Array.isArray(row.primary_tasks)
    ? row.primary_tasks.filter((task: any) => typeof task === 'string' && task.trim())
    : [],
  secondaryTasks: Array.isArray(row.secondary_tasks)
    ? row.secondary_tasks.filter((task: any) => typeof task === 'string' && task.trim())
    : [],
  workSchedule: row.work_schedule || undefined,
  workLocation: row.work_location || undefined,
  accessPassword: row.access_password || undefined,
  timeClockPin: row.time_clock_pin || undefined,
  timeClockEntries: Array.isArray(row.time_clock_entries)
    ? row.time_clock_entries.map(mapEmployeeTimeClockEntry)
    : [],
  mission: row.mission || undefined,
  measurableObjectives: Array.isArray(row.measurable_objectives)
    ? row.measurable_objectives.map(mapEmployeeObjective)
    : [],
});

const mapEmployeePatch = (updates: Partial<Employee>) => {
  const patch: Record<string, any> = {};
  if ('name' in updates) patch.name = updates.name;
  if ('email' in updates) patch.email = updates.email;
  if ('phone' in updates) patch.phone = updates.phone;
  if ('role' in updates) patch.role = updates.role;
  if ('status' in updates) patch.status = updates.status;
  if ('avatarSeed' in updates) patch.avatar_seed = updates.avatarSeed;
  if ('joinedAt' in updates) patch.joined_at = updates.joinedAt;
  if ('primaryTasks' in updates) patch.primary_tasks = updates.primaryTasks || [];
  if ('secondaryTasks' in updates) patch.secondary_tasks = updates.secondaryTasks || [];
  if ('workSchedule' in updates) patch.work_schedule = updates.workSchedule || null;
  if ('workLocation' in updates) patch.work_location = updates.workLocation || null;
  if ('accessPassword' in updates) patch.access_password = updates.accessPassword || null;
  if ('timeClockPin' in updates) patch.time_clock_pin = updates.timeClockPin || null;
  if ('timeClockEntries' in updates) patch.time_clock_entries = updates.timeClockEntries || [];
  if ('mission' in updates) patch.mission = updates.mission || null;
  if ('measurableObjectives' in updates) patch.measurable_objectives = updates.measurableObjectives || [];
  return patch;
};

const mapTeamChatRow = (row: any): TeamChatMessage => ({
  id: row.id,
  senderId: row.sender_id || undefined,
  senderName: row.sender_name || 'Equipa',
  text: row.text || '',
  createdAt: row.created_at || new Date().toISOString(),
  channel: row.channel || 'geral',
});

const mapIncidentRow = (row: any): SupplierIncident => ({
  id: row.id,
  date: row.date,
  severity: row.severity,
  description: row.description,
});

const mapUsageRow = (row: any): SupplierUsage => ({
  id: row.id,
  date: row.date,
  opportunityTitle: row.opportunity_title || undefined,
  note: row.note || '',
});

const mapSupplierRow = (row: any): Supplier => ({
  id: row.id,
  name: row.name,
  category: row.category,
  contactName: row.contact_name || undefined,
  contactEmail: row.contact_email || undefined,
  contactPhone: row.contact_phone || undefined,
  contactNotes: row.contact_notes || undefined,
  cancellationPolicy: row.cancellation_policy || undefined,
  paymentTerms: row.payment_terms || undefined,
  cutOff: row.cut_off || undefined,
  internalRating: row.internal_rating ?? 3,
  incidents: (row.supplier_incidents || []).map(mapIncidentRow),
  usageHistory: (row.supplier_usage || []).map(mapUsageRow),
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
});

const mapProposalComponent = (row: any): ProposalComponent => ({
  id: row.id,
  type: row.type as ServiceType,
  provider: row.provider || '',
  description: row.description || '',
  cost: toNumber(row.cost),
  margin: toNumber(row.margin),
  isPolicyCompliant: row.is_policy_compliant ?? undefined,
});

const mapProposalOption = (row: any): ProposalOption => ({
  id: row.id,
  label: row.label,
  title: row.title,
  totalPrice: toNumber(row.total_price),
  description: row.description || '',
  components: (row.proposal_components || []).map(mapProposalComponent),
  inclusions: row.inclusions || [],
  justification: row.justification || '',
  qualityScore: row.quality_score ?? 0,
  isAccepted: row.is_accepted ?? false,
  version: row.version ?? 1,
});

const mapCommentRow = (row: any): ProposalComment => ({
  id: row.id,
  author: row.author || '',
  role: row.role || 'agent',
  text: row.text || '',
  timestamp: row.timestamp || new Date().toISOString(),
});

const mapHistoryRow = (row: any): AuditLog => ({
  id: row.id,
  user: row.user_name || 'Sistema',
  action: row.action || '',
  timestamp: row.timestamp || new Date().toISOString(),
});

const mapTaskRow = (row: any): Task => ({
  id: row.id,
  title: row.title || '',
  dueDate: row.due_date || new Date().toISOString(),
  isCompleted: row.is_completed ?? false,
  type: row.type || 'other',
});

const mapPaymentRow = (row: any): PaymentMilestone => ({
  id: row.id,
  label: row.label || '',
  amount: toNumber(row.amount),
  dueDate: row.due_date || new Date().toISOString(),
  status: row.status,
  paidAmount: toNumber(row.paid_amount),
  proofUrl: row.proof_url || undefined,
  paidAt: row.paid_at || undefined,
});

const mapItineraryRow = (row: any): ItineraryItem => ({
  id: row.id,
  type: row.type as ServiceType,
  title: row.title || '',
  dateTime: row.date_time || new Date().toISOString(),
  location: row.location || '',
  description: row.description || '',
  voucherUrl: row.voucher_url || undefined,
  confirmationCode: row.confirmation_code || undefined,
});

const mapChecklistRow = (row: any): ChecklistItem => ({
  id: row.id,
  label: row.label || '',
  isCompleted: row.is_completed ?? false,
  isRequired: row.is_required ?? false,
});

const mapSupportCaseRow = (row: any): SupportCase => ({
  id: row.id,
  title: row.title || '',
  severity: row.severity || 'low',
  status: row.status || 'open',
  createdAt: row.created_at || new Date().toISOString(),
  lastUpdate: row.last_update || row.created_at || new Date().toISOString(),
  messages: (row.support_case_messages || []).map(mapCommentRow),
});

const mapSupplierBookingRow = (row: any): SupplierBooking => ({
  id: row.id,
  supplierId: row.supplier_id || undefined,
  supplierName: row.supplier_name || '',
  serviceType: row.service_type as ServiceType,
  serviceDescription: row.service_description || '',
  contractedAmount: row.contracted_amount !== null && row.contracted_amount !== undefined ? toNumber(row.contracted_amount) : undefined,
  source: row.source || 'manual',
  invoiceAttachmentId: row.invoice_attachment_id || undefined,
  createdAt: row.created_at || new Date().toISOString(),
});

const mapAiDraftRow = (row: any): AiDraft => ({
  id: row.id,
  type: row.type,
  title: row.title || '',
  content: row.content || '',
  createdAt: row.created_at || new Date().toISOString(),
  createdBy: row.created_by || 'Sistema',
});

const mapOpportunityRow = (row: any): Opportunity => ({
  id: row.id,
  clientId: row.client_id,
  campaignId: row.campaign_id || undefined,
  pipelineId: row.pipeline_id || '',
  stage: row.stage || '',
  status: row.status,
  limitValue: toNumber(row.limit_value),
  estimatedMargin: toNumber(row.estimated_margin),
  adults: row.adults ?? 0,
  children: row.children ?? 0,
  owner: row.owner || '',
  followers: row.followers || [],
  tags: row.tags || [],
  title: row.title || '',
  createdAt: row.created_at || new Date().toISOString(),
  lastInteractionAt: row.last_interaction_at || row.created_at || new Date().toISOString(),
  returnDate: row.return_date || undefined,
  departureDate: row.departure_date || undefined,
  quoteExpiry: row.quote_expiry || undefined,
  temperature: row.temperature ?? 0,
  preferredChannel: (row.preferred_channel || CommChannel.EMAIL) as CommChannel,
  lostReason: row.lost_reason || undefined,
  tripReason: row.trip_reason || undefined,
  tripType: row.trip_type || undefined,
  destination: row.destination || undefined,
  proposalStatus: row.proposal_status || undefined,
  proposalFinalizedAt: row.proposal_finalized_at || undefined,
  proposalSentAt: row.proposal_sent_at || undefined,
  supplierBookings: (row.opportunity_supplier_bookings || []).map(mapSupplierBookingRow),
  proposalOptions: (row.proposal_options || []).map(mapProposalOption),
  comments: (row.opportunity_comments || []).map(mapCommentRow),
  history: (row.opportunity_history || []).map(mapHistoryRow),
  tasks: (row.opportunity_tasks || []).map(mapTaskRow),
  paymentPlan: (row.opportunity_payment_plan || []).map(mapPaymentRow),
  itinerary: (row.opportunity_itinerary || []).map(mapItineraryRow),
  checklist: (row.opportunity_checklist || []).map(mapChecklistRow),
  supportCases: (row.opportunity_support_cases || []).map(mapSupportCaseRow),
  briefingNotes: row.briefing_notes || undefined,
  attachments: (row.opportunity_attachments || []).map(mapAttachmentRow),
  aiDrafts: (row.opportunity_ai_drafts || []).map(mapAiDraftRow),
});

const mapClientPatch = (updates: Partial<Client>) => {
  const patch: Record<string, any> = {};
  if ('name' in updates) patch.name = updates.name;
  if ('shortName' in updates) patch.short_name = updates.shortName;
  if ('email' in updates) patch.email = updates.email;
  if ('phone' in updates) patch.phone = updates.phone;
  if ('birthDate' in updates) patch.birth_date = updates.birthDate;
  if ('passportExpiry' in updates) patch.passport_expiry = updates.passportExpiry;
  if ('preferredChannel' in updates) patch.preferred_channel = updates.preferredChannel;
  if ('preferredLanguage' in updates) patch.preferred_language = updates.preferredLanguage;
  if ('location' in updates) patch.location = updates.location;
  if ('nationality' in updates) patch.nationality = updates.nationality;
  if ('document' in updates) patch.document = updates.document;
  if ('corporate' in updates) patch.corporate = updates.corporate;
  if ('preferences' in updates) patch.preferences = updates.preferences;
  if ('health' in updates) patch.health = updates.health;
  if ('emergency' in updates) patch.emergency = updates.emergency;
  if ('loyalty' in updates) patch.loyalty = updates.loyalty;
  if ('operations' in updates) patch.operations = updates.operations;
  if ('commChannels' in updates) patch.comm_channels = updates.commChannels;
  if ('tags' in updates) patch.tags = updates.tags;
  return patch;
};

const mapOpportunityPatch = (updates: Partial<Opportunity>) => {
  const patch: Record<string, any> = {};
  if ('clientId' in updates) patch.client_id = updates.clientId;
  if ('campaignId' in updates) patch.campaign_id = updates.campaignId;
  if ('pipelineId' in updates) patch.pipeline_id = updates.pipelineId;
  if ('stage' in updates) patch.stage = updates.stage;
  if ('status' in updates) patch.status = updates.status;
  if ('limitValue' in updates) patch.limit_value = updates.limitValue;
  if ('estimatedMargin' in updates) patch.estimated_margin = updates.estimatedMargin;
  if ('adults' in updates) patch.adults = updates.adults;
  if ('children' in updates) patch.children = updates.children;
  if ('owner' in updates) patch.owner = updates.owner;
  if ('followers' in updates) patch.followers = updates.followers;
  if ('tags' in updates) patch.tags = updates.tags;
  if ('title' in updates) patch.title = updates.title;
  if ('createdAt' in updates) patch.created_at = updates.createdAt;
  if ('lastInteractionAt' in updates) patch.last_interaction_at = updates.lastInteractionAt;
  if ('returnDate' in updates) patch.return_date = updates.returnDate;
  if ('departureDate' in updates) patch.departure_date = updates.departureDate;
  if ('quoteExpiry' in updates) patch.quote_expiry = updates.quoteExpiry;
  if ('temperature' in updates) patch.temperature = updates.temperature;
  if ('preferredChannel' in updates) patch.preferred_channel = updates.preferredChannel;
  if ('lostReason' in updates) patch.lost_reason = updates.lostReason;
  if ('tripReason' in updates) patch.trip_reason = updates.tripReason;
  if ('tripType' in updates) patch.trip_type = updates.tripType;
  if ('destination' in updates) patch.destination = updates.destination;
  if ('proposalStatus' in updates) patch.proposal_status = updates.proposalStatus;
  if ('proposalFinalizedAt' in updates) patch.proposal_finalized_at = updates.proposalFinalizedAt;
  if ('proposalSentAt' in updates) patch.proposal_sent_at = updates.proposalSentAt;
  if ('briefingNotes' in updates) patch.briefing_notes = updates.briefingNotes;
  return patch;
};

const replaceByOpportunity = async (table: string, oppId: string, rows: any[]) => {
  await supabase.from(table).delete().eq('opportunity_id', oppId);
  if (rows.length) {
    const { error } = await supabase.from(table).insert(rows);
    if (error) throw error;
  }
};

const replaceByClient = async (table: string, clientId: string, rows: any[]) => {
  await supabase.from(table).delete().eq('client_id', clientId);
  if (rows.length) {
    const { error } = await supabase.from(table).insert(rows);
    if (error) throw error;
  }
};

const replaceBySupplier = async (table: string, supplierId: string, rows: any[]) => {
  await supabase.from(table).delete().eq('supplier_id', supplierId);
  if (rows.length) {
    const { error } = await supabase.from(table).insert(rows);
    if (error) throw error;
  }
};

const getOpportunitySelect = () => `
  *,
  proposal_options (*, proposal_components (*)),
  opportunity_tasks (*),
  opportunity_comments (*),
  opportunity_history (*),
  opportunity_payment_plan (*),
  opportunity_itinerary (*),
  opportunity_checklist (*),
  opportunity_support_cases (*, support_case_messages (*)),
  opportunity_attachments (*),
  opportunity_ai_drafts (*),
  opportunity_supplier_bookings (*)
`;

export const TravelAPI = {
  // --- CLIENTS ---
  async getClients(): Promise<Client[]> {
    ensureSupabase();
    const { data, error } = await supabase
      .from('clients')
      .select('*, client_family_members(*), client_travel_companions(*), client_documents(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapClientRow);
  },

  async saveClient(client: Client): Promise<Client> {
    ensureSupabase();
    const payload = {
      id: client.id,
      name: client.name,
      short_name: client.shortName || null,
      email: client.email,
      phone: client.phone || null,
      birth_date: client.birthDate || null,
      passport_expiry: client.passportExpiry || null,
      preferred_channel: client.preferredChannel || null,
      preferred_language: client.preferredLanguage || null,
      location: client.location || null,
      nationality: client.nationality || null,
      document: client.document || null,
      corporate: client.corporate || null,
      preferences: client.preferences || null,
      health: client.health || null,
      emergency: client.emergency || null,
      loyalty: client.loyalty || null,
      operations: client.operations || null,
      comm_channels: client.commChannels || [],
      tags: client.tags || [],
      created_at: client.createdAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('clients').insert(payload);
    if (error) throw error;

    await replaceByClient('client_family_members', client.id, (client.family || []).map(member => ({
      id: (member as any).id,
      client_id: client.id,
      name: member.name,
      relationship: member.relationship,
      age: member.age ?? null,
      birth_date: member.birthDate ?? null,
      document_type: member.documentType ?? null,
      document_number: member.documentNumber ?? null,
      preferences: member.preferences ?? null,
    })));

    await replaceByClient('client_travel_companions', client.id, (client.travelCompanions || []).map(companion => ({
      id: (companion as any).id,
      client_id: client.id,
      name: companion.name,
      relationship: companion.relationship ?? null,
      birth_date: companion.birthDate ?? null,
      document_type: companion.documentType ?? null,
      document_number: companion.documentNumber ?? null,
      preferences: companion.preferences ?? null,
    })));

    await replaceByClient('client_documents', client.id, (client.documents || []).map(doc => ({
      id: doc.id,
      client_id: client.id,
      name: doc.name,
      mime_type: doc.type,
      size: doc.size,
      bucket: doc.bucket || null,
      path: doc.path || null,
      url: doc.url,
      uploaded_at: doc.uploadedAt || new Date().toISOString(),
    })));

    const { data } = await supabase
      .from('clients')
      .select('*, client_family_members(*), client_travel_companions(*), client_documents(*)')
      .eq('id', client.id)
      .single();

    return mapClientRow(data);
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    ensureSupabase();
    const patch = mapClientPatch(updates);
    if (Object.keys(patch).length) {
      const { error } = await supabase.from('clients').update(patch).eq('id', id);
      if (error) throw error;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'family')) {
      await replaceByClient('client_family_members', id, (updates.family || []).map(member => ({
        id: (member as any).id,
        client_id: id,
        name: member.name,
        relationship: member.relationship,
        age: member.age ?? null,
        birth_date: member.birthDate ?? null,
        document_type: member.documentType ?? null,
        document_number: member.documentNumber ?? null,
        preferences: member.preferences ?? null,
      })));
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'travelCompanions')) {
      await replaceByClient('client_travel_companions', id, (updates.travelCompanions || []).map(companion => ({
        id: (companion as any).id,
        client_id: id,
        name: companion.name,
        relationship: companion.relationship ?? null,
        birth_date: companion.birthDate ?? null,
        document_type: companion.documentType ?? null,
        document_number: companion.documentNumber ?? null,
        preferences: companion.preferences ?? null,
      })));
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'documents')) {
      await replaceByClient('client_documents', id, (updates.documents || []).map(doc => ({
        id: doc.id,
        client_id: id,
        name: doc.name,
        mime_type: doc.type,
        size: doc.size,
        bucket: doc.bucket || null,
        path: doc.path || null,
        url: doc.url,
        uploaded_at: doc.uploadedAt || new Date().toISOString(),
      })));
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*, client_family_members(*), client_travel_companions(*), client_documents(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapClientRow(data);
  },

  // --- OPPORTUNITIES ---
  async getOpportunities(): Promise<Opportunity[]> {
    ensureSupabase();
    const { data, error } = await supabase
      .from('opportunities')
      .select(getOpportunitySelect())
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapOpportunityRow);
  },

  async saveOpportunity(opp: Opportunity): Promise<Opportunity> {
    ensureSupabase();
    const payload = {
      id: opp.id,
      client_id: opp.clientId,
      campaign_id: opp.campaignId || null,
      pipeline_id: opp.pipelineId,
      stage: opp.stage,
      status: opp.status,
      limit_value: opp.limitValue,
      estimated_margin: opp.estimatedMargin,
      adults: opp.adults,
      children: opp.children,
      owner: opp.owner,
      followers: opp.followers || [],
      tags: opp.tags || [],
      title: opp.title,
      created_at: opp.createdAt || new Date().toISOString(),
      last_interaction_at: opp.lastInteractionAt || new Date().toISOString(),
      return_date: opp.returnDate || null,
      departure_date: opp.departureDate || null,
      quote_expiry: opp.quoteExpiry || null,
      temperature: opp.temperature,
      preferred_channel: opp.preferredChannel,
      lost_reason: opp.lostReason || null,
      trip_reason: opp.tripReason || null,
      trip_type: opp.tripType || null,
      destination: opp.destination || null,
      proposal_status: opp.proposalStatus || null,
      proposal_finalized_at: opp.proposalFinalizedAt || null,
      proposal_sent_at: opp.proposalSentAt || null,
      briefing_notes: opp.briefingNotes || null,
    };

    const { error } = await supabase.from('opportunities').insert(payload);
    if (error) throw error;

    await replaceByOpportunity('proposal_options', opp.id, (opp.proposalOptions || []).map(option => ({
      id: option.id,
      opportunity_id: opp.id,
      label: option.label,
      title: option.title,
      total_price: option.totalPrice,
      description: option.description,
      inclusions: option.inclusions || [],
      justification: option.justification,
      quality_score: option.qualityScore,
      is_accepted: option.isAccepted ?? false,
      version: option.version ?? 1,
    })));

    const allComponents = (opp.proposalOptions || []).flatMap(option =>
      (option.components || []).map(component => ({
        id: component.id,
        proposal_id: option.id,
        type: component.type,
        provider: component.provider,
        description: component.description,
        cost: component.cost,
        margin: component.margin,
        is_policy_compliant: component.isPolicyCompliant ?? null,
      }))
    );

    if (allComponents.length) {
      const { error: compErr } = await supabase.from('proposal_components').insert(allComponents);
      if (compErr) throw compErr;
    }

    await replaceByOpportunity('opportunity_tasks', opp.id, (opp.tasks || []).map(task => ({
      id: task.id,
      opportunity_id: opp.id,
      title: task.title,
      due_date: task.dueDate || null,
      is_completed: task.isCompleted ?? false,
      type: task.type,
    })));

    await replaceByOpportunity('opportunity_comments', opp.id, (opp.comments || []).map(comm => ({
      id: comm.id,
      opportunity_id: opp.id,
      author: comm.author,
      role: comm.role,
      text: comm.text,
      timestamp: comm.timestamp || new Date().toISOString(),
    })));

    await replaceByOpportunity('opportunity_history', opp.id, (opp.history || []).map(log => ({
      id: log.id,
      opportunity_id: opp.id,
      user_name: log.user,
      action: log.action,
      timestamp: log.timestamp || new Date().toISOString(),
    })));

    await replaceByOpportunity('opportunity_payment_plan', opp.id, (opp.paymentPlan || []).map(item => ({
      id: item.id,
      opportunity_id: opp.id,
      label: item.label,
      amount: item.amount,
      due_date: item.dueDate || null,
      status: item.status,
      paid_amount: item.paidAmount ?? 0,
      proof_url: item.proofUrl || null,
      paid_at: item.paidAt || null,
    })));

    await replaceByOpportunity('opportunity_itinerary', opp.id, (opp.itinerary || []).map(item => ({
      id: item.id,
      opportunity_id: opp.id,
      type: item.type,
      title: item.title,
      date_time: item.dateTime || null,
      location: item.location,
      description: item.description,
      voucher_url: item.voucherUrl || null,
      confirmation_code: item.confirmationCode || null,
    })));

    await replaceByOpportunity('opportunity_checklist', opp.id, (opp.checklist || []).map(item => ({
      id: item.id,
      opportunity_id: opp.id,
      label: item.label,
      is_completed: item.isCompleted ?? false,
      is_required: item.isRequired ?? false,
    })));

    await replaceByOpportunity('opportunity_support_cases', opp.id, (opp.supportCases || []).map(sc => ({
      id: sc.id,
      opportunity_id: opp.id,
      title: sc.title,
      severity: sc.severity,
      status: sc.status,
      created_at: sc.createdAt || new Date().toISOString(),
      last_update: sc.lastUpdate || sc.createdAt || new Date().toISOString(),
    })));

    const allMessages = (opp.supportCases || []).flatMap(sc =>
      (sc.messages || []).map(msg => ({
        id: msg.id,
        support_case_id: sc.id,
        author: msg.author,
        role: msg.role,
        text: msg.text,
        timestamp: msg.timestamp || new Date().toISOString(),
      }))
    );
    if (allMessages.length) {
      const { error: msgErr } = await supabase.from('support_case_messages').insert(allMessages);
      if (msgErr) throw msgErr;
    }

    await replaceByOpportunity('opportunity_attachments', opp.id, (opp.attachments || []).map(att => ({
      id: att.id,
      opportunity_id: opp.id,
      name: att.name,
      mime_type: att.type,
      size: att.size,
      bucket: att.bucket || null,
      path: att.path || null,
      url: att.url,
      uploaded_at: att.uploadedAt || new Date().toISOString(),
    })));

    await replaceByOpportunity('opportunity_supplier_bookings', opp.id, (opp.supplierBookings || []).map(item => ({
      id: item.id,
      opportunity_id: opp.id,
      supplier_id: item.supplierId || null,
      supplier_name: item.supplierName,
      service_type: item.serviceType,
      service_description: item.serviceDescription,
      contracted_amount: item.contractedAmount || null,
      source: item.source,
      invoice_attachment_id: item.invoiceAttachmentId || null,
      created_at: item.createdAt || new Date().toISOString(),
    })));

    await replaceByOpportunity('opportunity_ai_drafts', opp.id, (opp.aiDrafts || []).map(draft => ({
      id: draft.id,
      opportunity_id: opp.id,
      type: draft.type,
      title: draft.title,
      content: draft.content,
      created_at: draft.createdAt || new Date().toISOString(),
      created_by: draft.createdBy || 'Sistema',
    })));

    const { data } = await supabase
      .from('opportunities')
      .select(getOpportunitySelect())
      .eq('id', opp.id)
      .single();

    return mapOpportunityRow(data);
  },

  async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
    ensureSupabase();
    const patch = mapOpportunityPatch(updates);
    if (Object.keys(patch).length) {
      const { error } = await supabase.from('opportunities').update(patch).eq('id', id);
      if (error) throw error;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'proposalOptions')) {
      const options = updates.proposalOptions || [];
      await replaceByOpportunity('proposal_options', id, options.map(option => ({
        id: option.id,
        opportunity_id: id,
        label: option.label,
        title: option.title,
        total_price: option.totalPrice,
        description: option.description,
        inclusions: option.inclusions || [],
        justification: option.justification,
        quality_score: option.qualityScore,
        is_accepted: option.isAccepted ?? false,
        version: option.version ?? 1,
      })));

      const allComponents = options.flatMap(option =>
        (option.components || []).map(component => ({
          id: component.id,
          proposal_id: option.id,
          type: component.type,
          provider: component.provider,
          description: component.description,
          cost: component.cost,
          margin: component.margin,
          is_policy_compliant: component.isPolicyCompliant ?? null,
        }))
      );

      if (allComponents.length) {
        const { error: compErr } = await supabase.from('proposal_components').insert(allComponents);
        if (compErr) throw compErr;
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'tasks')) {
      await replaceByOpportunity('opportunity_tasks', id, (updates.tasks || []).map(task => ({
        id: task.id,
        opportunity_id: id,
        title: task.title,
        due_date: task.dueDate || null,
        is_completed: task.isCompleted ?? false,
        type: task.type,
      })));
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'comments')) {
      await replaceByOpportunity('opportunity_comments', id, (updates.comments || []).map(comm => ({
        id: comm.id,
        opportunity_id: id,
        author: comm.author,
        role: comm.role,
        text: comm.text,
        timestamp: comm.timestamp || new Date().toISOString(),
      })));
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'history')) {
      await replaceByOpportunity('opportunity_history', id, (updates.history || []).map(log => ({
        id: log.id,
        opportunity_id: id,
        user_name: log.user,
        action: log.action,
        timestamp: log.timestamp || new Date().toISOString(),
      })));
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'paymentPlan')) {
      await replaceByOpportunity('opportunity_payment_plan', id, (updates.paymentPlan || []).map(item => ({
        id: item.id,
        opportunity_id: id,
        label: item.label,
        amount: item.amount,
        due_date: item.dueDate || null,
        status: item.status,
        paid_amount: item.paidAmount ?? 0,
        proof_url: item.proofUrl || null,
        paid_at: item.paidAt || null,
      })));
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'itinerary')) {
      await replaceByOpportunity('opportunity_itinerary', id, (updates.itinerary || []).map(item => ({
        id: item.id,
        opportunity_id: id,
        type: item.type,
        title: item.title,
        date_time: item.dateTime || null,
        location: item.location,
        description: item.description,
        voucher_url: item.voucherUrl || null,
        confirmation_code: item.confirmationCode || null,
      })));
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'checklist')) {
      await replaceByOpportunity('opportunity_checklist', id, (updates.checklist || []).map(item => ({
        id: item.id,
        opportunity_id: id,
        label: item.label,
        is_completed: item.isCompleted ?? false,
        is_required: item.isRequired ?? false,
      })));
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'supportCases')) {
      const supportCases = updates.supportCases || [];
      await replaceByOpportunity('opportunity_support_cases', id, supportCases.map(sc => ({
        id: sc.id,
        opportunity_id: id,
        title: sc.title,
        severity: sc.severity,
        status: sc.status,
        created_at: sc.createdAt || new Date().toISOString(),
        last_update: sc.lastUpdate || sc.createdAt || new Date().toISOString(),
      })));

      const allMessages = supportCases.flatMap(sc =>
        (sc.messages || []).map(msg => ({
          id: msg.id,
          support_case_id: sc.id,
          author: msg.author,
          role: msg.role,
          text: msg.text,
          timestamp: msg.timestamp || new Date().toISOString(),
        }))
      );

      if (allMessages.length) {
        const { error: msgErr } = await supabase.from('support_case_messages').insert(allMessages);
        if (msgErr) throw msgErr;
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'attachments')) {
      await replaceByOpportunity('opportunity_attachments', id, (updates.attachments || []).map(att => ({
        id: att.id,
        opportunity_id: id,
        name: att.name,
        mime_type: att.type,
        size: att.size,
        bucket: att.bucket || null,
        path: att.path || null,
        url: att.url,
        uploaded_at: att.uploadedAt || new Date().toISOString(),
      })));
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'supplierBookings')) {
      await replaceByOpportunity('opportunity_supplier_bookings', id, (updates.supplierBookings || []).map(item => ({
        id: item.id,
        opportunity_id: id,
        supplier_id: item.supplierId || null,
        supplier_name: item.supplierName,
        service_type: item.serviceType,
        service_description: item.serviceDescription,
        contracted_amount: item.contractedAmount || null,
        source: item.source,
        invoice_attachment_id: item.invoiceAttachmentId || null,
        created_at: item.createdAt || new Date().toISOString(),
      })));
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'aiDrafts')) {
      await replaceByOpportunity('opportunity_ai_drafts', id, (updates.aiDrafts || []).map(draft => ({
        id: draft.id,
        opportunity_id: id,
        type: draft.type,
        title: draft.title,
        content: draft.content,
        created_at: draft.createdAt || new Date().toISOString(),
        created_by: draft.createdBy || 'Sistema',
      })));
    }

    const { data, error } = await supabase
      .from('opportunities')
      .select(getOpportunitySelect())
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapOpportunityRow(data);
  },

  // --- EMPLOYEES ---
  async getEmployees(): Promise<Employee[]> {
    ensureSupabase();
    const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapEmployeeRow);
  },

  async saveEmployee(employee: Employee): Promise<Employee> {
    ensureSupabase();
    const payload = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      status: employee.status,
      avatar_seed: employee.avatarSeed,
      joined_at: employee.joinedAt || new Date().toISOString(),
      primary_tasks: employee.primaryTasks || [],
      secondary_tasks: employee.secondaryTasks || [],
      work_schedule: employee.workSchedule || null,
      work_location: employee.workLocation || null,
      access_password: employee.accessPassword || null,
      time_clock_pin: employee.timeClockPin || null,
      time_clock_entries: employee.timeClockEntries || [],
      mission: employee.mission || null,
      measurable_objectives: employee.measurableObjectives || [],
    };
    const { error } = await supabase.from('employees').insert(payload);
    if (error) throw error;
    const { data, error: fetchError } = await supabase.from('employees').select('*').eq('id', employee.id).single();
    if (fetchError) throw fetchError;
    return mapEmployeeRow(data);
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    ensureSupabase();
    const patch = mapEmployeePatch(updates);
    if (Object.keys(patch).length) {
      const { error } = await supabase.from('employees').update(patch).eq('id', id);
      if (error) throw error;
    }

    const { data, error } = await supabase.from('employees').select('*').eq('id', id).single();
    if (error) throw error;
    return mapEmployeeRow(data);
  },

  // --- TEAM CHAT ---
  async getTeamChatMessages(): Promise<TeamChatMessage[]> {
    ensureSupabase();
    const { data, error } = await supabase
      .from('team_chat_messages')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapTeamChatRow);
  },

  async saveTeamChatMessage(message: TeamChatMessage): Promise<TeamChatMessage> {
    ensureSupabase();
    const payload = {
      id: message.id,
      sender_id: message.senderId || null,
      sender_name: message.senderName,
      text: message.text,
      channel: message.channel || 'geral',
      created_at: message.createdAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('team_chat_messages').insert(payload);
    if (error) throw error;

    const { data, error: fetchError } = await supabase
      .from('team_chat_messages')
      .select('*')
      .eq('id', message.id)
      .single();
    if (fetchError) throw fetchError;
    return mapTeamChatRow(data);
  },

  // --- CAMPAIGNS ---
  async getCampaigns(): Promise<Campaign[]> {
    ensureSupabase();
    const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapCampaignRow);
  },

  async saveCampaign(campaign: Campaign): Promise<Campaign> {
    ensureSupabase();
    const payload = {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description || null,
      package_type: campaign.packageType || null,
      travel_type: campaign.travelType || null,
      destination: campaign.destination || null,
      days: campaign.days || null,
      hotel: campaign.hotel || null,
      flight: campaign.flight || null,
      transfer: campaign.transfer || null,
      start_at: campaign.startAt || null,
      end_at: campaign.endAt || null,
      target_sales: campaign.targetSales || null,
      target_revenue: campaign.targetRevenue || null,
      owner: campaign.owner || null,
      status: campaign.status || 'Ativa',
      created_at: campaign.createdAt || new Date().toISOString(),
    };
    const { error } = await supabase.from('campaigns').insert(payload);
    if (error) throw error;
    return campaign;
  },

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    ensureSupabase();
    const patch: Record<string, any> = {};
    if ('name' in updates) patch.name = updates.name;
    if ('description' in updates) patch.description = updates.description;
    if ('packageType' in updates) patch.package_type = updates.packageType;
    if ('travelType' in updates) patch.travel_type = updates.travelType;
    if ('destination' in updates) patch.destination = updates.destination;
    if ('days' in updates) patch.days = updates.days;
    if ('hotel' in updates) patch.hotel = updates.hotel;
    if ('flight' in updates) patch.flight = updates.flight;
    if ('transfer' in updates) patch.transfer = updates.transfer;
    if ('startAt' in updates) patch.start_at = updates.startAt;
    if ('endAt' in updates) patch.end_at = updates.endAt;
    if ('targetSales' in updates) patch.target_sales = updates.targetSales;
    if ('targetRevenue' in updates) patch.target_revenue = updates.targetRevenue;
    if ('owner' in updates) patch.owner = updates.owner;
    if ('status' in updates) patch.status = updates.status;

    if (Object.keys(patch).length) {
      const { error } = await supabase.from('campaigns').update(patch).eq('id', id);
      if (error) throw error;
    }

    const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).single();
    if (error) throw error;
    return mapCampaignRow(data);
  },

  // --- SUPPLIERS ---
  async getSuppliers(): Promise<Supplier[]> {
    ensureSupabase();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*, supplier_incidents(*), supplier_usage(*)')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapSupplierRow);
  },

  async saveSupplier(supplier: Supplier): Promise<Supplier> {
    ensureSupabase();
    const payload = {
      id: supplier.id,
      name: supplier.name,
      category: supplier.category,
      contact_name: supplier.contactName || null,
      contact_email: supplier.contactEmail || null,
      contact_phone: supplier.contactPhone || null,
      contact_notes: supplier.contactNotes || null,
      cancellation_policy: supplier.cancellationPolicy || null,
      payment_terms: supplier.paymentTerms || null,
      cut_off: supplier.cutOff || null,
      internal_rating: supplier.internalRating ?? 3,
      created_at: supplier.createdAt || new Date().toISOString(),
      updated_at: supplier.updatedAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('suppliers').insert(payload);
    if (error) throw error;

    await replaceBySupplier('supplier_incidents', supplier.id, (supplier.incidents || []).map(incident => ({
      id: incident.id,
      supplier_id: supplier.id,
      date: incident.date,
      severity: incident.severity,
      description: incident.description,
    })));

    await replaceBySupplier('supplier_usage', supplier.id, (supplier.usageHistory || []).map(usage => ({
      id: usage.id,
      supplier_id: supplier.id,
      date: usage.date,
      opportunity_title: usage.opportunityTitle || null,
      note: usage.note,
    })));

    const { data } = await supabase
      .from('suppliers')
      .select('*, supplier_incidents(*), supplier_usage(*)')
      .eq('id', supplier.id)
      .single();

    return mapSupplierRow(data);
  },

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    ensureSupabase();
    const patch: Record<string, any> = {};
    if ('name' in updates) patch.name = updates.name;
    if ('category' in updates) patch.category = updates.category;
    if ('contactName' in updates) patch.contact_name = updates.contactName;
    if ('contactEmail' in updates) patch.contact_email = updates.contactEmail;
    if ('contactPhone' in updates) patch.contact_phone = updates.contactPhone;
    if ('contactNotes' in updates) patch.contact_notes = updates.contactNotes;
    if ('cancellationPolicy' in updates) patch.cancellation_policy = updates.cancellationPolicy;
    if ('paymentTerms' in updates) patch.payment_terms = updates.paymentTerms;
    if ('cutOff' in updates) patch.cut_off = updates.cutOff;
    if ('internalRating' in updates) patch.internal_rating = updates.internalRating;
    if ('updatedAt' in updates) patch.updated_at = updates.updatedAt;

    if (Object.keys(patch).length) {
      const { error } = await supabase.from('suppliers').update(patch).eq('id', id);
      if (error) throw error;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'incidents')) {
      await replaceBySupplier('supplier_incidents', id, (updates.incidents || []).map(incident => ({
        id: incident.id,
        supplier_id: id,
        date: incident.date,
        severity: incident.severity,
        description: incident.description,
      })));
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'usageHistory')) {
      await replaceBySupplier('supplier_usage', id, (updates.usageHistory || []).map(usage => ({
        id: usage.id,
        supplier_id: id,
        date: usage.date,
        opportunity_title: usage.opportunityTitle || null,
        note: usage.note,
      })));
    }

    const { data, error } = await supabase
      .from('suppliers')
      .select('*, supplier_incidents(*), supplier_usage(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapSupplierRow(data);
  },
};
