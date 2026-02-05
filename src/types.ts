
export enum CommChannel {
  EMAIL = 'Email',
  WHATSAPP = 'WhatsApp',
  PHONE = 'Phone',
  INSTAGRAM = 'Instagram'
}

export interface FamilyMember {
  name: string;
  relationship: string;
  age?: number;
  birthDate?: string;
  documentType?: 'CC' | 'Passaporte' | 'Outro';
  documentNumber?: string;
  preferences?: string;
}

export type DocumentType = 'CC' | 'Passaporte' | 'Outro';

export interface DocumentInfo {
  type?: DocumentType;
  number?: string;
  expiry?: string;
}

export interface CorporateInfo {
  taxId?: string;
  billingAddress?: string;
  invoiceName?: string;
  companyName?: string;
  costCenter?: string;
}

export interface HotelPreferences {
  stars?: string;
  breakfast?: string;
  location?: string;
  bed?: string;
  accessibility?: string;
}

export interface FlightPreferences {
  lowCostOk?: boolean;
  baggage?: string;
  seats?: string;
  preferredAirlines?: string[];
  avoidAirlines?: string[];
}

export interface TravelPreferences {
  styles?: string[];
  pace?: string;
  stopoverTolerance?: string;
  preferredTimes?: string;
  hotel?: HotelPreferences;
  flight?: FlightPreferences;
  budgetRange?: string;
  priceSensitivity?: 'Alta' | 'Media' | 'Baixa';
}

export interface HealthInfo {
  dietary?: string[];
  mobilityNotes?: string;
  medicalNotes?: string;
  insurancePreference?: string;
  sensitiveNotes?: string;
}

export interface EmergencyContact {
  name?: string;
  phone?: string;
  preferredChannel?: CommChannel | string;
}

export interface LoyaltyInfo {
  history?: string;
  totalValue?: string;
  favoriteDestinations?: string[];
  nps?: number;
  consultantNotes?: string;
  lossReason?: string;
}

export interface OperationsInfo {
  importantNotes?: string;
  pendingItems?: string[];
  autoAlerts?: string[];
}

export interface TravelCompanion {
  name: string;
  relationship?: string;
  birthDate?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  preferences?: string;
}

export interface Client {
  id: string;
  name: string;
  shortName?: string;
  email: string;
  phone: string;
  birthDate: string;
  passportExpiry?: string;
  preferredChannel?: CommChannel;
  preferredLanguage?: string;
  location?: string;
  nationality?: string;
  document?: DocumentInfo;
  corporate?: CorporateInfo;
  preferences?: TravelPreferences;
  health?: HealthInfo;
  emergency?: EmergencyContact;
  loyalty?: LoyaltyInfo;
  operations?: OperationsInfo;
  travelCompanions?: TravelCompanion[];
  documents?: Attachment[];
  commChannels: CommChannel[];
  family: FamilyMember[];
  tags: string[];
  createdAt: string;
}

export enum OpportunityStatus {
  OPEN = 'Open',
  WON = 'Won',
  LOST = 'Lost',
  ABANDONED = 'Abandoned'
}

export enum PaymentStatus {
  MISSING = 'Em Falta',
  PARTIAL = 'Parcial',
  PAID = 'Pago',
  OVERDUE = 'Em Atraso'
}

export enum ServiceType {
  FLIGHT = 'Voo',
  HOTEL = 'Alojamento',
  TRANSFER = 'Transfer',
  ACTIVITY = 'Atividade',
  INSURANCE = 'Seguro'
}

export interface ProposalComponent {
  id: string;
  type: ServiceType;
  provider: string;
  description: string;
  cost: number;
  margin: number;
  isPolicyCompliant?: boolean;
}

export interface ProposalOption {
  id: string;
  label: 'Eco' | 'Conforto' | 'Premium' | 'Luxo';
  title: string;
  totalPrice: number;
  description: string;
  components: ProposalComponent[];
  inclusions: string[];
  justification: string;
  qualityScore: number;
  isAccepted?: boolean;
  version: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
  bucket?: string;
  path?: string;
  uploadedAt: string;
}

export interface ItineraryItem {
  id: string;
  type: ServiceType;
  title: string;
  dateTime: string;
  location: string;
  description: string;
  voucherUrl?: string;
  confirmationCode?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  isCompleted: boolean;
  isRequired: boolean;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  isCompleted: boolean;
  type: 'follow-up' | 'document' | 'payment' | 'other';
}

export interface AiDraft {
  id: string;
  type: 'ideias' | 'texto_proposta' | 'itinerario' | 'perguntas_em_falta';
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  packageType?: 'Campanha' | 'Fechado';
  travelType?: string;
  destination?: string;
  days?: number;
  hotel?: string;
  flight?: string;
  transfer?: string;
  startAt?: string;
  endAt?: string;
  targetSales?: number;
  targetRevenue?: number;
  owner?: string;
  status: 'Ativa' | 'Concluída';
  createdAt: string;
}

export type SupplierCategory = 'Hotel' | 'Operadora' | 'Guia' | 'Transfer';

export interface SupplierIncident {
  id: string;
  date: string;
  severity: 'Baixa' | 'Media' | 'Alta';
  description: string;
}

export interface SupplierUsage {
  id: string;
  date: string;
  opportunityTitle?: string;
  note: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: SupplierCategory;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactNotes?: string;
  cancellationPolicy?: string;
  paymentTerms?: string;
  cutOff?: string;
  internalRating: number; // 1 to 5
  incidents: SupplierIncident[];
  usageHistory: SupplierUsage[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierBooking {
  id: string;
  supplierId?: string;
  supplierName: string;
  serviceType: ServiceType;
  serviceDescription: string;
  contractedAmount?: number;
  source: 'manual' | 'invoice';
  invoiceAttachmentId?: string;
  createdAt: string;
}

export interface SupportCase {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'resolved';
  createdAt: string;
  lastUpdate: string;
  messages: ProposalComment[];
}

export interface PaymentMilestone {
  id: string;
  label: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  paidAmount: number;
  proofUrl?: string;
  paidAt?: string;
}

export interface ProposalComment {
  id: string;
  author: string;
  role: 'agent' | 'client';
  text: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

export interface TeamChatMessage {
  id: string;
  senderId?: string;
  senderName: string;
  text: string;
  createdAt: string;
  channel: string;
}

export interface TeamChatMessageInput {
  senderId?: string;
  senderName: string;
  text: string;
  channel?: string;
}

export interface Opportunity {
  id: string;
  clientId: string;
  campaignId?: string;
  pipelineId: string;
  stage: string;
  status: OpportunityStatus;
  limitValue: number;
  estimatedMargin: number;
  adults: number;
  children: number;
  owner: string;
  followers: string[];
  tags: string[];
  title: string;
  createdAt: string;
  lastInteractionAt: string;
  returnDate?: string;
  departureDate?: string;
  quoteExpiry?: string;
  temperature: number;
  preferredChannel: CommChannel;
  lostReason?: string;
  tripReason?: string;
  tripType?: 'Lazer' | 'Corporate';
  destination?: string;
  proposalStatus?: 'draft' | 'finalized';
  proposalFinalizedAt?: string;
  proposalSentAt?: string;
  supplierBookings?: SupplierBooking[];
  proposalOptions: ProposalOption[];
  comments: ProposalComment[];
  history: AuditLog[];
  tasks: Task[];
  paymentPlan: PaymentMilestone[];
  itinerary: ItineraryItem[];
  checklist: ChecklistItem[];
  supportCases: SupportCase[];
  briefingNotes?: string;
  attachments: Attachment[];
  aiDrafts?: AiDraft[];
}

export interface Pipeline {
  id: string;
  name: string;
  stages: string[];
}

export enum EmployeeRole {
  ADMIN = 'Administrador',
  MANAGER = 'Gestor de Equipa',
  CONSULTANT = 'Consultor de Viagens',
  SUPPORT = 'Apoio ao Cliente'
}

export interface EmployeeTimeClockEntry {
  id: string;
  type: 'entrada' | 'saida';
  timestamp: string;
  source?: 'pin' | 'manual';
  note?: string;
}

export interface EmployeeObjective {
  id: string;
  title: string;
  metric: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  dueDate?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  status: 'Ativo' | 'Inativo' | 'Ausente';
  avatarSeed: string;
  joinedAt: string;
  primaryTasks: string[];
  secondaryTasks: string[];
  workSchedule?: string;
  workLocation?: string;
  accessPassword?: string;
  timeClockPin?: string;
  timeClockEntries: EmployeeTimeClockEntry[];
  mission?: string;
  measurableObjectives: EmployeeObjective[];
}
