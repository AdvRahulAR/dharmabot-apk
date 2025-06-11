export enum ServiceArea {
  // --- Core Corporate & Commercial ---
  GENERAL_CORPORATE_COMMERCIAL = "General Corporate & Commercial", // Covers general advisory, contracts
  MERGERS_ACQUISITIONS = "Mergers & Acquisitions (M&A)",
  PRIVATE_EQUITY_VENTURE_CAPITAL = "Private Equity & Venture Capital",
  JOINT_VENTURES_STRATEGIC_ALLIANCES = "Joint Ventures & Strategic Alliances",
  FOREIGN_INVESTMENT_FEMA = "Foreign Investment & FEMA",

  // --- Dispute Resolution ---
  LITIGATION = "Litigation (Civil, Criminal, Commercial)",
  ARBITRATION_MEDIATION = "Arbitration & Mediation",
  WHITE_COLLAR_CRIME_INVESTIGATIONS = "White Collar Crime & Investigations",

  // --- Regulatory & Compliance (General & Sectoral) ---
  REGULATORY_COMPLIANCE_GENERAL = "Regulatory & Compliance (General)",
  COMPETITION_ANTITRUST = "Competition & Antitrust Law",
  DATA_PROTECTION_PRIVACY = "Data Protection & Privacy",
  ENVIRONMENTAL_SOCIAL_GOVERNANCE_ESG = "Environmental, Social & Governance (ESG)",
  LABOUR_EMPLOYMENT = "Labour & Employment Law",
  INSOLVENCY_BANKRUPTCY_RESTRUCTURING = "Insolvency, Bankruptcy & Restructuring",

  BANKING_FINANCE_REGULATORY_TRANSACTIONAL = "Banking & Finance (Regulatory & Transactional)",
  INSURANCE = "Insurance Law (Regulatory & Claims)",
  REAL_ESTATE_CONSTRUCTION = "Real Estate & Construction Law",
  TECHNOLOGY_MEDIA_TELECOMMUNICATIONS_TMT = "Technology, Media & Telecommunications (TMT)",

  // --- Specialized Areas ---
  INTELLECTUAL_PROPERTY = "Intellectual Property",
  TAXATION_DIRECT_INDIRECT = "Taxation (Direct & Indirect/GST)",
  FAMILY_LAW_PRIVATE_CLIENT = "Family Law & Private Client (Wills, Trusts)",
  HEALTHCARE_PHARMACEUTICALS_LIFE_SCIENCES = "Healthcare, Pharmaceuticals & Life Sciences",
  INFRASTRUCTURE_PROJECTS_ENERGY = "Infrastructure, Projects & Energy",
  MARITIME_AVIATION_LOGISTICS = "Maritime, Aviation & Logistics Law",
  GOVERNMENT_PUBLIC_SECTOR = "Government & Public Sector Advisory",

  // --- Service Models / Specific Focus ---
  STARTUP_ADVISORY = "Startup Advisory & Legal Services",
  VIRTUAL_GENERAL_COUNSEL = "Virtual General Counsel Services",
  LEGAL_TECH_AI_SOLUTIONS = "Legal Tech & AI Solutions",
  CASE_LAW_JUDGMENT_ANALYSIS = "Case Law & Judgment Analysis",

  // --- Additional Practice Areas for Lawyer Directory ---
  CIVIL_LAW = "Civil Law",
  CRIMINAL_LAW = "Criminal Law",
  FAMILY_LAW = "Family Law",
  CONSUMER_LAW = "Consumer Law",
  CORPORATE = "Corporate Law",
  CYBER_LAW = "Cyber Law",
  LABOR_LAW = "Labor Law",
  SERVICE_LAW = "Service Law",
  INSURANCE_LAW = "Insurance Law",
  BANKING_LAW = "Banking Law",
  PROPERTY_LAW = "Property Law",
  CONSTITUTIONAL = "Constitutional Law",
  ENVIRONMENTAL = "Environmental Law",
  ACCIDENT_LAW = "Accident Law",
  MOTOR_ACCIDENT_CLAIMS = "Motor Accident Claims",
}

export enum LegalTask {
  GENERAL_QUERY = "General Legal Q&A",
  DRAFT_DOCUMENT = "Draft Document / Clause",
  SUMMARIZE_LEGAL_CONCEPT = "Summarize Legal Concept",
  LEGAL_RESEARCH = "Legal Research & Updates",
  COMPLIANCE_CHECKLIST = "Compliance Checklist/Guidance",
  ANALYZE_CONTRACT_RISKS = "Analyze Contract for Risks & Issues",
  REVIEW_COMPLIANCE_AGAINST_DOCUMENT = "Review Document for Compliance",
  SUMMARIZE_UPLOADED_DOCUMENT_KEY_POINTS = "Summarize Uploaded Document (Key Points)",
  EXTRACT_DEFINITIONS_OBLIGATIONS_FROM_DOCUMENT = "Extract Definitions & Obligations from Document",
}

export type AppView = 'chat' | 'documentDrafting' | 'voicenote' | 'findLawyer' | 'auth' | 'research';

export enum FeedbackCategory {
  ACCURACY = 'ACCURACY',
  CLARITY = 'CLARITY',
  RELEVANCE = 'RELEVANCE',
  OTHER = 'OTHER'
}

export enum UserProfileType {
  CITIZEN = 'CITIZEN',
  JUDGE = 'JUDGE',
  LAWYER = 'LAWYER',
  LAW_STUDENT = 'LAW_STUDENT'
}

export interface ProcessedFile {
  id: string; 
  name: string;
  type: string; 
  originalFile: File; 
  status: 'pending' | 'processing' | 'processed' | 'error';
  textContent?: string; 
  imagePageDataUrls?: string[]; 
  errorMessage?: string;
}

export interface DocumentInfoForAI {
  name: string;
  mimeType: string;
  textContent?: string; // For text-based files or base64 data URLs of non-image texty files
  imagePageDataUrls?: string[]; // For image files or PDF pages converted to images
}

export interface QueryPayload {
  userQuery: string;
  documents?: DocumentInfoForAI[]; 
  chatHistory?: ChatMessage[];
  enableGoogleSearch?: boolean;
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: GroundingChunkWeb;
}

export interface AIResponse {
  text: string;
  sources?: GroundingChunk[]; 
  rawResponse?: any; 
  fileName?: string; // This might need adjustment or removal if multiple files
  suggestedTitle?: string;
}

export interface ProcessedFileInfoForChat {
  name: string;
  type: string;
  size: number;
}

export interface UserQueryMessage {
  id: string;
  role: 'user';
  timestamp: number;
  queryText: string;
  filesInfo?: ProcessedFileInfoForChat[]; 
}

export interface AIResponseMessage extends AIResponse {
  id: string;
  role: 'ai';
  timestamp: number;
}

export interface SystemMessage {
  id: string;
  role: 'system';
  timestamp: number;
  text: string; 
}

export type ChatMessage = UserQueryMessage | AIResponseMessage | SystemMessage;

export interface ChatSession {
  id: string; 
  title: string; 
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  initialServiceArea?: ServiceArea; 
  initialLegalTask?: LegalTask;  
}

export interface Voicenote {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  audioBlobURL: string | null; 
  audioMimeType: string | null;
  rawTranscript: string;
  polishedNoteMarkdown: string;
  durationSeconds: number;
}

export interface VoicenoteInProgressData {
  id: string | null;
  title: string;
  rawTranscript: string;
  polishedNoteMarkdown: string;
  audioBlobURL: string | null;
  audioMimeType: string | null;
  durationSeconds: number;
}

export interface SavedDraft {
  id: string;
  title: string;
  instructions: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface LawyerProfile {
  id: string;
  name: string;
  practiceAreas: ServiceArea[];
  city: string;
  state: string;
  email: string;
  phone: string;
  bio: string;
  experienceYears: number;
}

export interface User {
  id: string;
  profileType: UserProfileType;
  email: string;
  phone: string; 
  password?: string; 
}