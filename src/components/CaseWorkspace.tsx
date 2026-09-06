/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Case, GraphNode, GraphEdge, TimelineEvent, CaseDocument, ReviewQueueItem, NodeEdgeComment, User, DocumentType, SourceReliability, GISLocationFeature } from '../types.ts';
import { GraphView } from './GraphView.tsx';
import { TimelineView } from './TimelineView.tsx';
import { GISMapView } from './GISMapView.tsx';
import { DocumentsView } from './DocumentsView.tsx';
import { ReviewQueueView } from './ReviewQueueView.tsx';
import { DossierReportView } from './DossierReportView.tsx';
import { EvidenceDrawer } from './EvidenceDrawer.tsx';
import {
  ArrowLeft,
  Share2,
  FileText,
  Calendar,
  Sparkles,
  Shield,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  History,
  AlertTriangle,
  Compass,
  Home,
} from 'lucide-react';

interface CaseWorkspaceProps {
  caseData: Case;
  nodes: GraphNode[];
  edges: GraphEdge[];
  documents: CaseDocument[];
  timeline: TimelineEvent[];
  reviewQueue: ReviewQueueItem[];
  comments: NodeEdgeComment[];
  gisLocations?: GISLocationFeature[];
  currentUser: User;
  onBackToCases: () => void;
  onGoToLanding?: () => void;
  onUploadDocument: (docData: {
    title: string;
    type: DocumentType;
    content: string;
    sourceReliability: SourceReliability;
  }) => Promise<any>;
  onReviewDecision: (
    itemId: string,
    decision: 'accepted' | 'rejected' | 'modified',
    notes?: string,
    modifiedData?: any
  ) => Promise<void>;
  onToggleVerification: (
    targetType: 'node' | 'edge',
    targetId: string,
    newStatus: 'verified' | 'ai_suggested' | 'rejected'
  ) => void;
  onAddComment: (targetType: 'node' | 'edge', targetId: string, text: string) => void;
  onUnmaskPII: (nodeId: string, reason: string) => Promise<string>;
  onGenerateSummary: () => Promise<string>;
  onAddGISLocation?: (locData: Partial<GISLocationFeature>) => Promise<void>;
  onAddNode?: (node: GraphNode) => void;
  onRemoveNode?: (nodeId: string) => void;
}

type WorkspaceTab = 'graph' | 'timeline' | 'gis' | 'documents' | 'review' | 'dossier' | 'audit';

export const CaseWorkspace: React.FC<CaseWorkspaceProps> = ({
  caseData,
  nodes,
  edges,
  documents,
  timeline,
  reviewQueue,
  comments,
  gisLocations = [],
  currentUser,
  onBackToCases,
  onGoToLanding,
  onUploadDocument,
  onReviewDecision,
  onToggleVerification,
  onAddComment,
  onUnmaskPII,
  onGenerateSummary,
  onAddGISLocation,
  onAddNode,
  onRemoveNode,
}) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('graph');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  const pendingReviewCount = reviewQueue.filter((r) => r.status === 'pending').length;

  const handleSelectNode = (node: GraphNode | null) => {
    setSelectedNode(node);
    if (node) setSelectedEdge(null);
  };

  const handleSelectEdge = (edge: GraphEdge | null) => {
    setSelectedEdge(edge);
    if (edge) setSelectedNode(null);
  };

  const handleSelectDocumentFromTrace = (docId: string) => {
    setActiveTab('documents');
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Case Meta Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToCases}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700/80 hover:border-emerald-500/50 transition-all shadow-xs flex items-center gap-2 text-xs font-bold cursor-pointer"
              title="Return to Case List"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Back to Cases</span>
            </button>

            {onGoToLanding && (
              <button
                onClick={onGoToLanding}
                className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-slate-300 hover:text-white hover:bg-neutral-800 hover:border-emerald-500/40 transition-all shadow-xs flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                title="Return to Cluventa Home / Landing Page"
              >
                <Home className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Home</span>
              </button>
            )}

            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
                  {caseData.firNumber}
                </span>
                <span className="text-slate-600 text-xs">•</span>
                <span className="text-slate-400 text-xs font-medium">{caseData.policeStation}</span>
                <span className="text-slate-600 text-xs">•</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border capitalize font-bold ${
                    caseData.status === 'active'
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/60'
                      : caseData.status === 'under_review'
                      ? 'bg-amber-950/70 text-amber-300 border-amber-600/60'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {caseData.status.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white mt-1 leading-tight">{caseData.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:block text-right">
              <div className="text-slate-400">Assigned IO:</div>
              <div className="font-semibold text-slate-200">
                {caseData.assignedOfficer || (caseData.assignedOfficers && caseData.assignedOfficers[0]) || 'IO Special Cell'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-md text-emerald-400 font-bold shadow-xs">
                {nodes.length} Entities
              </span>
              <span className="font-mono text-[11px] px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-md text-emerald-400 font-bold shadow-xs">
                {edges.length} Links
              </span>
            </div>
          </div>
        </div>

        {/* Case Description & BNS Badges */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <p className="text-slate-300 max-w-2xl leading-relaxed">{caseData.description}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-semibold text-[11px]">BNS Sections:</span>
            {(caseData.sectionsBNS || caseData.bnsSections || []).map((sec, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-emerald-400 font-medium"
              >
                {sec}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-xs overflow-x-auto shadow-md">
        <button
          onClick={() => setActiveTab('graph')}
          className={`px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'graph'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Network Graph</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'timeline'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('gis')}
          className={`px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'gis'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>GIS Map ({gisLocations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'documents'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'review'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Review Queue</span>
          {pendingReviewCount > 0 && (
            <span className={`font-bold px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'review' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
            }`}>
              {pendingReviewCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dossier')}
          className={`px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'dossier'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Case Report</span>
        </button>
      </div>

      {/* Main Tab Content Render */}
      <div className="w-full relative">
        {activeTab === 'graph' && (
          <GraphView
            nodes={nodes}
            edges={edges}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onSelectNode={handleSelectNode}
            onSelectEdge={handleSelectEdge}
            onAddNode={onAddNode}
            onRemoveNode={onRemoveNode}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            events={timeline}
            nodes={nodes}
            onSelectDocument={handleSelectDocumentFromTrace}
          />
        )}

        {activeTab === 'gis' && (
          <GISMapView
            locations={gisLocations}
            nodes={nodes}
            edges={edges}
            documents={documents}
            currentUser={currentUser}
            caseId={caseData.id}
            onSelectNode={handleSelectNode}
            onSelectDocument={handleSelectDocumentFromTrace}
            onAddLocation={onAddGISLocation}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsView
            documents={documents}
            caseId={caseData.id}
            currentUser={currentUser}
            onUploadDocument={onUploadDocument}
          />
        )}

        {activeTab === 'review' && (
          <ReviewQueueView
            items={reviewQueue}
            currentUser={currentUser}
            onReviewDecision={onReviewDecision}
            onSelectDocument={handleSelectDocumentFromTrace}
          />
        )}

        {activeTab === 'dossier' && (
          <DossierReportView
            caseData={caseData}
            nodes={nodes}
            edges={edges}
            timeline={timeline}
            documents={documents}
            currentUser={currentUser}
            onGenerateSummary={onGenerateSummary}
          />
        )}
      </div>

      {/* Persistent Side Drawer (Appears when any node or edge is selected) */}
      <EvidenceDrawer
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        allNodes={nodes}
        comments={comments}
        currentUser={currentUser}
        onClose={() => {
          setSelectedNode(null);
          setSelectedEdge(null);
        }}
        onAddComment={onAddComment}
        onToggleVerification={onToggleVerification}
        onSelectNode={handleSelectNode}
        onSelectDocument={handleSelectDocumentFromTrace}
        onUnmaskPII={onUnmaskPII}
      />
    </div>
  );
};
