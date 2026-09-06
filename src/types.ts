/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'investigator' | 'analyst' | 'supervisor' | 'admin';

export interface User {
  id: string;
  name: string;
  badgeNumber: string;
  role: UserRole;
  department: string;
  rank: string;
  email: string;
}

export type CaseStatus = 'active' | 'under_review' | 'chargesheeted' | 'closed';

export type PriorityLevel = 'High' | 'Critical' | 'Medium' | 'HIGH' | 'CRITICAL' | 'MEDIUM' | 'LOW';

export interface Case {
  id: string;
  firNumber: string;
  title: string;
  policeStation: string;
  status: CaseStatus;
  bnsSections: string[];
  assignedOfficers: string[];
  createdDate: string;
  updatedDate: string;
  description: string;
  incidentDate: string;
  priority: PriorityLevel;
  summaryReport?: string;
  sectionsBNS?: string[];
  assignedOfficer?: string;
}

export type DocumentType = 'FIR' | 'CDR' | 'financial' | 'free_text' | 'scanned_image' | 'vehicle_sighting';
export type SourceReliability = 'Authoritative First-Party' | 'Verified Official Record' | 'Secondary Intelligence' | 'Unverified Informer Tip';

export interface CaseDocument {
  id: string;
  caseId: string;
  title: string;
  type: DocumentType;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: string;
  sourceReliability: SourceReliability;
  content: string;
  processed: boolean;
}

export type EntityType = 'Person' | 'Phone' | 'Vehicle' | 'Organisation' | 'Location' | 'FinancialAccount';
export type VerificationStatus = 'verified' | 'ai_suggested' | 'rejected';
export type ExtractionMethod = 'Deterministic DB' | 'Regex Rule' | 'NER Transformer' | 'Gemini LLM Agent' | 'Manual Officer Entry';

export interface GraphNode {
  id: string;
  caseIds: string[];
  type: EntityType;
  label: string;
  primaryIdentifier: string;
  isSensitive: boolean;
  maskedValue: string;
  unmaskedValue: string;
  attributes: Record<string, string | number | string[]>;
  aliases?: string[];
  verificationStatus: VerificationStatus;
  confidenceScore: number;
  sourceDocumentId: string;
  extractionMethod: ExtractionMethod;
  degreeCentrality?: number;
  betweennessCentrality?: number;
  closenessCentrality?: number;
  communityId?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export type RelationshipType = 
  | 'CALLED' 
  | 'TRANSFERRED_FUNDS_TO' 
  | 'OWNS' 
  | 'CO_ACCUSED_IN' 
  | 'SIGHTED_AT' 
  | 'MET_AT' 
  | 'ASSOCIATED_WITH' 
  | 'COMMUNICATED_WITH';

export interface GraphEdge {
  id: string;
  caseId: string;
  source: string;
  target: string;
  type: RelationshipType;
  label: string;
  weight?: number;
  startDate?: string;
  endDate?: string;
  isDirect: boolean;
  verificationStatus: VerificationStatus;
  confidenceScore: number;
  sourceDocumentId: string;
  sourceDocumentTitle: string;
  evidenceSentence: string;
  extractionMethod: string;
  contradictionFlag?: boolean;
  contradictionNote?: string;
}

export type ReviewItemType = 'entity_match' | 'new_relationship';
export type ReviewItemStatus = 'pending' | 'accepted' | 'rejected' | 'edited';

export interface ScoreFactor {
  rule: string;
  weight: number;
  matchDetail: string;
}

export interface ReviewQueueItem {
  id: string;
  caseId: string;
  itemType: ReviewItemType;
  title: string;
  type?: string;
  entityOrRelationship?: {
    sourceNodeId?: string;
    sourceName?: string;
    targetNodeId?: string;
    targetName?: string;
    relationType?: RelationshipType;
    entityName?: string;
    entityType?: EntityType;
    primaryIdentifier?: string;
    matchedWithEntityId?: string;
    matchedWithEntityName?: string;
  };
  suggestedData?: any;
  evidenceSnippet: string;
  sourceDocumentId: string;
  sourceDocumentTitle: string;
  confidenceScore: number;
  scoreBreakdown?: ScoreFactor[] | Record<string, number>;
  reasoning?: string;
  status: ReviewItemStatus;
  reviewer?: string;
  reviewedAt?: string;
  decisionNote?: string;
}

export type EventType = 'CALL' | 'TRANSACTION' | 'SIGHTING' | 'MEETING' | 'FIR_FILED' | 'RAID' | 'ARREST';

export type GISLocationCategory = 
  | 'crime_scene' 
  | 'vault' 
  | 'sighting' 
  | 'cell_tower' 
  | 'residence' 
  | 'office' 
  | 'interception' 
  | 'toll_plaza';

export interface GISLocationFeature {
  id: string;
  caseId: string;
  name: string;
  category: GISLocationCategory;
  lat: number;
  lng: number;
  address: string;
  timestamp?: string;
  confidenceScore: number;
  verificationStatus: VerificationStatus;
  associatedEntities: string[];
  associatedNodes?: string[];
  evidenceSnippet?: string;
  sourceDocumentId?: string;
  sourceDocumentTitle?: string;
  trajectoryOrder?: number;
  radiusMeters?: number;
  azimuth?: number;
  dmsCoordinates?: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  timestamp: string;
  eventType: EventType;
  title: string;
  description: string;
  primaryEntities: string[];
  location?: string;
  sourceDocumentId: string;
  sourceDocumentTitle: string;
  verificationStatus: VerificationStatus;
  amountOrFrequency?: string;
}

export interface NodeEdgeComment {
  id: string;
  caseId: string;
  targetType: 'node' | 'edge' | 'case';
  targetId: string;
  authorName: string;
  authorRole: string;
  badgeNumber: string;
  timestamp: string;
  text: string;
}

export type AuditAction = 
  | 'LOGIN' 
  | 'VIEW_CASE' 
  | 'UPLOAD_DOC' 
  | 'ACCEPT_AI_SUGGESTION' 
  | 'REJECT_AI_SUGGESTION' 
  | 'EDIT_AI_SUGGESTION' 
  | 'UNMASK_PII' 
  | 'RUN_CENTRALITY' 
  | 'RUN_COMMUNITY' 
  | 'EXPORT_REPORT' 
  | 'UPDATE_THRESHOLDS' 
  | 'CROSS_CASE_SEARCH'
  | 'ADD_COMMENT';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction | string;
  resourceType: 'CASE' | 'DOCUMENT' | 'ENTITY' | 'RELATIONSHIP' | 'AUDIT' | 'CONFIG';
  resourceId: string;
  details: string;
  ipAddress: string;
  caseId?: string;
}

export interface SystemConfig {
  entityMatchAutoSuggestThreshold: number; // e.g. 0.70
  entityMatchHighConfidenceThreshold: number; // e.g. 0.90
  anomalySensitivityThreshold: number; // e.g. 3.0x
  autoMaskPII: boolean;
  matchThreshold?: number;
  anomalySensitivity?: number;
  strictPIIMasking?: boolean;
  benchmarkPrecision?: number;
  benchmarkRecall?: number;
  benchmarkF1?: number;
  syntheticBenchmark: {
    precision: number;
    recall: number;
    f1Score: number;
    evaluatedRecords: number;
    lastEvaluatedAt: string;
  };
}
