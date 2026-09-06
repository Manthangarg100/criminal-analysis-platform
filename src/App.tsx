/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Case,
  CaseDocument,
  GraphNode,
  GraphEdge,
  TimelineEvent,
  ReviewQueueItem,
  NodeEdgeComment,
  AuditLogEntry,
  SystemConfig,
  User,
  DocumentType,
  SourceReliability,
  PriorityLevel,
  GISLocationFeature,
} from './types.ts';
import { Header } from './components/Header.tsx';
import { InvestigatorDashboard } from './components/InvestigatorDashboard.tsx';
import { AnalystDashboard } from './components/AnalystDashboard.tsx';
import { SupervisorDashboard } from './components/SupervisorDashboard.tsx';
import { AdminConsole } from './components/AdminConsole.tsx';
import { CaseWorkspace } from './components/CaseWorkspace.tsx';
import { GISMapView } from './components/GISMapView.tsx';
import { NewCaseModal } from './components/NewCaseModal.tsx';
import { EvidenceDrawer } from './components/EvidenceDrawer.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { CluventaLogo, CluventaEmblem } from './components/CluventaLogo.tsx';
import { Shield, Loader2, AlertCircle, Home, ArrowLeft } from 'lucide-react';
import {
  INITIAL_CASES,
  INITIAL_DOCUMENTS,
  INITIAL_NODES,
  INITIAL_EDGES,
  INITIAL_REVIEW_QUEUE,
  INITIAL_TIMELINE_EVENTS,
  INITIAL_COMMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CONFIG,
  INITIAL_USERS,
  INITIAL_GIS_LOCATIONS,
} from './data/syntheticDataset.ts';

export default function App() {
  // Application View Screen: Landing -> Login -> Dashboard
  const [appScreen, setAppScreen] = useState<'landing' | 'login' | 'dashboard'>('landing');
  const [loginTargetRole, setLoginTargetRole] = useState<string | undefined>(undefined);

  // Global State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [cases, setCases] = useState<Case[]>([]);

  // Navigation State
  const [activeView, setActiveView] = useState<'dashboard' | 'cross_case' | 'gis' | 'supervisor' | 'admin'>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);

  // Selected Case Detail State
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [caseNodes, setCaseNodes] = useState<GraphNode[]>([]);
  const [caseEdges, setCaseEdges] = useState<GraphEdge[]>([]);
  const [caseDocuments, setCaseDocuments] = useState<CaseDocument[]>([]);
  const [caseTimeline, setCaseTimeline] = useState<TimelineEvent[]>([]);
  const [caseReviewQueue, setCaseReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [caseComments, setCaseComments] = useState<NodeEdgeComment[]>([]);
  const [caseGisLocations, setCaseGisLocations] = useState<GISLocationFeature[]>([]);
  const [globalGisLocations, setGlobalGisLocations] = useState<GISLocationFeature[]>([]);

  // Global Pan-Network State (all nodes and edges across cases for Analyst view)
  const [allGlobalNodes, setAllGlobalNodes] = useState<GraphNode[]>([]);
  const [allGlobalReviewQueue, setAllGlobalReviewQueue] = useState<ReviewQueueItem[]>([]);

  // Global Selection for Evidence Drawer (when outside CaseWorkspace)
  const [globalSelectedNode, setGlobalSelectedNode] = useState<GraphNode | null>(null);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isCaseLoading, setIsCaseLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial Load: Users, Config, Cases, Global Audit Logs
  useEffect(() => {
    async function initPlatform() {
      try {
        setIsLoading(true);
        const [usersRes, configRes, casesRes, auditRes, gisRes] = await Promise.all([
          fetch('/api/users').catch(() => null),
          fetch('/api/config').catch(() => null),
          fetch('/api/cases').catch(() => null),
          fetch('/api/audit-logs').catch(() => null),
          fetch('/api/gis/global').catch(() => null),
        ]);

        const usersData: User[] = usersRes && usersRes.ok ? await usersRes.json() : INITIAL_USERS;
        const configData: SystemConfig = configRes && configRes.ok ? await configRes.json() : INITIAL_CONFIG;
        const casesData: Case[] = casesRes && casesRes.ok ? await casesRes.json() : INITIAL_CASES;
        const auditData: AuditLogEntry[] = auditRes && auditRes.ok ? await auditRes.json() : INITIAL_AUDIT_LOGS;
        const gisData: GISLocationFeature[] = gisRes && gisRes.ok ? await gisRes.json() : INITIAL_GIS_LOCATIONS;

        setGlobalGisLocations(gisData);
        setAvailableUsers(usersData);
        setCurrentUser(usersData[0] || null);
        setSystemConfig(configData);
        setCases(casesData);
        setAuditLogs(auditData);

        // Fetch first case by default to populate global nodes
        if (casesData.length > 0) {
          try {
            const firstCaseRes = await fetch(`/api/cases/${casesData[0].id}`).catch(() => null);
            if (firstCaseRes && firstCaseRes.ok) {
              const firstData = await firstCaseRes.json();
              setAllGlobalNodes(firstData.nodes || []);
              setAllGlobalReviewQueue(firstData.reviewQueue || []);
            } else {
              setAllGlobalNodes(INITIAL_NODES);
              setAllGlobalReviewQueue(INITIAL_REVIEW_QUEUE);
            }
          } catch {
            setAllGlobalNodes(INITIAL_NODES);
            setAllGlobalReviewQueue(INITIAL_REVIEW_QUEUE);
          }
        }
      } catch (err: any) {
        console.warn('Backend API connection defaulted to local dataset:', err);
        setAvailableUsers(INITIAL_USERS);
        setCurrentUser(INITIAL_USERS[0]);
        setSystemConfig(INITIAL_CONFIG);
        setCases(INITIAL_CASES);
        setAuditLogs(INITIAL_AUDIT_LOGS);
        setGlobalGisLocations(INITIAL_GIS_LOCATIONS);
        setAllGlobalNodes(INITIAL_NODES);
        setAllGlobalReviewQueue(INITIAL_REVIEW_QUEUE);
      } finally {
        setIsLoading(false);
      }
    }

    initPlatform();
  }, []);

  // Fetch full details whenever selectedCaseId changes
  useEffect(() => {
    if (!selectedCaseId) {
      setCurrentCase(null);
      return;
    }

    async function loadCaseDetail() {
      try {
        setIsCaseLoading(true);
        const res = await fetch(`/api/cases/${selectedCaseId}`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          setCurrentCase(data.case || data.caseData);
          setCaseNodes(data.nodes || []);
          setCaseEdges(data.edges || []);
          setCaseDocuments(data.documents || []);
          setCaseTimeline(data.timeline || []);
          setCaseReviewQueue(data.reviewQueue || []);
          setCaseComments(data.comments || []);
          setCaseGisLocations(data.gisLocations || []);
        } else {
          // Fallback to synthetic dataset matching caseId
          const matchedCase = INITIAL_CASES.find((c) => c.id === selectedCaseId) || INITIAL_CASES[0];
          setCurrentCase(matchedCase);
          setCaseNodes(INITIAL_NODES.filter((n) => n.caseIds.includes(selectedCaseId)));
          setCaseEdges(INITIAL_EDGES.filter((e) => e.caseId === selectedCaseId));
          setCaseDocuments(INITIAL_DOCUMENTS.filter((d) => d.caseId === selectedCaseId));
          setCaseTimeline(INITIAL_TIMELINE_EVENTS.filter((t) => t.caseId === selectedCaseId));
          setCaseReviewQueue(INITIAL_REVIEW_QUEUE.filter((r) => r.caseId === selectedCaseId));
          setCaseComments(INITIAL_COMMENTS.filter((c) => c.caseId === selectedCaseId));
          setCaseGisLocations(INITIAL_GIS_LOCATIONS.filter((g) => g.caseId === selectedCaseId));
        }
      } catch (err: any) {
        console.warn('Defaulting case data to local dataset:', err);
        const matchedCase = INITIAL_CASES.find((c) => c.id === selectedCaseId) || INITIAL_CASES[0];
        setCurrentCase(matchedCase);
        setCaseNodes(INITIAL_NODES.filter((n) => n.caseIds.includes(selectedCaseId)));
        setCaseEdges(INITIAL_EDGES.filter((e) => e.caseId === selectedCaseId));
        setCaseDocuments(INITIAL_DOCUMENTS.filter((d) => d.caseId === selectedCaseId));
        setCaseTimeline(INITIAL_TIMELINE_EVENTS.filter((t) => t.caseId === selectedCaseId));
        setCaseReviewQueue(INITIAL_REVIEW_QUEUE.filter((r) => r.caseId === selectedCaseId));
        setCaseComments(INITIAL_COMMENTS.filter((c) => c.caseId === selectedCaseId));
        setCaseGisLocations(INITIAL_GIS_LOCATIONS.filter((g) => g.caseId === selectedCaseId));
      } finally {
        setIsCaseLoading(false);
      }
    }

    loadCaseDetail();
  }, [selectedCaseId]);

  // Handler: Select Role / User
  const handleSelectUser = async (user: User) => {
    setCurrentUser(user);
    // Log user switch in audit log
    try {
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'LOGIN',
          details: `User authenticated as ${user.name} (${user.role.toUpperCase()}) with active 2FA credentials.`,
        }),
      });
      refreshAuditLogs();
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to refresh audit logs
  const refreshAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: Upload Document
  const handleUploadDocument = async (docData: {
    title: string;
    type: DocumentType;
    content: string;
    sourceReliability: SourceReliability;
  }) => {
    if (!selectedCaseId || !currentUser) return;
    try {
      const res = await fetch(`/api/cases/${selectedCaseId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...docData,
          uploadedBy: currentUser.name,
        }),
      });
      if (!res.ok) throw new Error('Failed to upload and ingest document');
      const data = await res.json();

      // Refresh case details
      setCaseDocuments((prev) => [data.document, ...prev]);
      if (data.newNodes?.length) {
        setCaseNodes((prev) => [...prev, ...data.newNodes]);
      }
      if (data.newEdges?.length) {
        setCaseEdges((prev) => [...prev, ...data.newEdges]);
      }
      if (data.newReviewItems?.length) {
        setCaseReviewQueue((prev) => [...data.newReviewItems, ...prev]);
      }
      refreshAuditLogs();
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Handler: Review Decision (Accept / Reject / Modified)
  const handleReviewDecision = async (
    itemId: string,
    decision: 'accepted' | 'rejected' | 'modified',
    notes?: string,
    modifiedData?: any
  ) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/review-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewItemId: itemId,
          decision,
          userId: currentUser.id,
          userName: currentUser.name,
          notes,
          modifiedData,
        }),
      });
      if (!res.ok) throw new Error('Failed to record review decision');
      const data = await res.json();

      // Update local state
      setCaseReviewQueue((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: data.updatedItem.status } : item))
      );

      // If accepted, update the edge/node verificationStatus to verified
      if (decision === 'accepted' || decision === 'modified') {
        const item = caseReviewQueue.find((i) => i.id === itemId);
        if (item?.suggestedData?.edgeId) {
          setCaseEdges((prev) =>
            prev.map((e) =>
              e.id === item.suggestedData.edgeId ? { ...e, verificationStatus: 'verified' } : e
            )
          );
        }
      } else if (decision === 'rejected') {
        const item = caseReviewQueue.find((i) => i.id === itemId);
        if (item?.suggestedData?.edgeId) {
          setCaseEdges((prev) =>
            prev.map((e) =>
              e.id === item.suggestedData.edgeId ? { ...e, verificationStatus: 'rejected' } : e
            )
          );
        }
      }

      refreshAuditLogs();
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Toggle verification directly
  const handleToggleVerification = async (
    targetType: 'node' | 'edge',
    targetId: string,
    newStatus: 'verified' | 'ai_suggested' | 'rejected'
  ) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/toggle-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          newStatus,
          userId: currentUser.id,
          userName: currentUser.name,
        }),
      });
      if (!res.ok) throw new Error('Failed to toggle verification status');

      if (targetType === 'node') {
        setCaseNodes((prev) =>
          prev.map((n) => (n.id === targetId ? { ...n, verificationStatus: newStatus } : n))
        );
      } else {
        setCaseEdges((prev) =>
          prev.map((e) => (e.id === targetId ? { ...e, verificationStatus: newStatus } : e))
        );
      }

      refreshAuditLogs();
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Add Node to active case
  const handleAddNode = (newNode: GraphNode) => {
    setCaseNodes((prev) => [newNode, ...prev]);
  };

  // Handler: Remove Node from active case
  const handleRemoveNode = (nodeId: string) => {
    setCaseNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setCaseEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
  };

  // Handler: Add Comment
  const handleAddComment = async (targetType: 'node' | 'edge', targetId: string, text: string) => {
    if (!selectedCaseId || !currentUser) return;
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: selectedCaseId,
          targetType,
          targetId,
          authorId: currentUser.id,
          authorName: currentUser.name,
          text,
        }),
      });
      if (!res.ok) throw new Error('Failed to add note');
      const newComment: NodeEdgeComment = await res.json();
      setCaseComments((prev) => [...prev, newComment]);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Unmask PII
  const handleUnmaskPII = async (nodeId: string, reason: string): Promise<string> => {
    if (!currentUser) throw new Error('Not authenticated');
    const res = await fetch('/api/unmask-pii', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId,
        userId: currentUser.id,
        userName: currentUser.name,
        caseId: selectedCaseId,
        reason,
      }),
    });
    if (!res.ok) throw new Error('Failed to unmask PII');
    const data = await res.json();
    refreshAuditLogs();
    return data.unmaskedValue;
  };

  // Handler: Generate AI Dossier Summary
  const handleGenerateSummary = async (): Promise<string> => {
    if (!selectedCaseId) throw new Error('No case selected');
    const res = await fetch(`/api/cases/${selectedCaseId}/generate-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to generate summary');
    const data = await res.json();
    if (currentCase) {
      setCurrentCase({ ...currentCase, summaryReport: data.summary });
    }
    return data.summary;
  };

  // Handler: Create Case
  const handleCreateCase = async (caseData: {
    firNumber: string;
    title: string;
    description: string;
    policeStation: string;
    assignedOfficer: string;
    sectionsBNS: string[];
    priority: PriorityLevel;
  }) => {
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
      });
      if (!res.ok) throw new Error('Failed to create case');
      const newCase: Case = await res.json();
      setCases((prev) => [newCase, ...prev]);
      setSelectedCaseId(newCase.id);
      refreshAuditLogs();
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Add GIS Location Waypoint
  const handleAddGISLocation = async (locData: Partial<GISLocationFeature>) => {
    if (!selectedCaseId || !currentUser) return;
    try {
      const res = await fetch(`/api/cases/${selectedCaseId}/gis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...locData,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
        }),
      });
      if (!res.ok) throw new Error('Failed to record GIS location waypoint');
      const newGis: GISLocationFeature = await res.json();
      setCaseGisLocations((prev) => [...prev, newGis]);
      refreshAuditLogs();
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Update Config
  const handleUpdateConfig = async (newConfig: Partial<SystemConfig>) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newConfig,
          userId: currentUser.id,
          userName: currentUser.name,
        }),
      });
      if (!res.ok) throw new Error('Failed to update config');
      const updated: SystemConfig = await res.json();
      setSystemConfig(updated);
      refreshAuditLogs();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !currentUser || !systemConfig) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-4 space-y-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <CluventaLogo size="lg" variant="full" glow={true} />
          <div className="flex items-center gap-2 pt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <p className="text-xs text-emerald-400/90 font-mono tracking-widest uppercase">
              Initializing Secure Investigation Terminal...
            </p>
          </div>
        </div>
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  // 1. Landing Page Screen
  if (appScreen === 'landing') {
    return (
      <LandingPage
        availableUsers={availableUsers}
        onGoToLogin={() => {
          setLoginTargetRole(undefined);
          setAppScreen('login');
        }}
        onQuickLoginAs={(role) => {
          setLoginTargetRole(role);
          setAppScreen('login');
        }}
      />
    );
  }

  // 2. Authentication / Login Screen
  if (appScreen === 'login') {
    return (
      <LoginPage
        availableUsers={availableUsers}
        initialRole={loginTargetRole}
        onBackToLanding={() => setAppScreen('landing')}
        onLoginSuccess={(user) => {
          handleSelectUser(user);
          if (user.role === 'admin') setActiveView('admin');
          else if (user.role === 'supervisor') setActiveView('supervisor');
          else if (user.role === 'analyst') setActiveView('cross_case');
          else setActiveView('dashboard');
          setAppScreen('dashboard');
        }}
      />
    );
  }

  // 3. Authenticated Dashboard Workspace Screen
  return (
    <div className="cluventa-viewport">
      {/* Top Header with Role Switcher & SIH 26189 Details */}
      <Header
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        availableUsers={availableUsers}
        activeView={activeView}
        onChangeView={(view) => {
          setActiveView(view);
          setSelectedCaseId(null);
        }}
        onOpenNewCaseModal={() => setShowNewCaseModal(true)}
        onLogout={() => setAppScreen('landing')}
        onGoToLanding={() => setAppScreen('landing')}
      />

      {/* Main App Body Container */}
      <main className="cluventa-app-main">
        {errorMessage && (
          <div className="cluventa-banner-alert">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-200 text-sm font-bold px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Case Workspace View (When a case is selected) */}
        {selectedCaseId && currentCase && activeView !== 'gis' ? (
          isCaseLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-sm font-medium">Opening Case...</span>
            </div>
          ) : (
            <CaseWorkspace
              caseData={currentCase}
              nodes={caseNodes}
              edges={caseEdges}
              documents={caseDocuments}
              timeline={caseTimeline}
              reviewQueue={caseReviewQueue}
              comments={caseComments}
              gisLocations={caseGisLocations}
              currentUser={currentUser}
              onBackToCases={() => setSelectedCaseId(null)}
              onGoToLanding={() => setAppScreen('landing')}
              onUploadDocument={handleUploadDocument}
              onReviewDecision={handleReviewDecision}
              onToggleVerification={handleToggleVerification}
              onAddComment={handleAddComment}
              onUnmaskPII={handleUnmaskPII}
              onGenerateSummary={handleGenerateSummary}
              onAddGISLocation={handleAddGISLocation}
              onAddNode={handleAddNode}
              onRemoveNode={handleRemoveNode}
            />
          )
        ) : (
          /* Role-based Dashboard Views */
          <div>
            {activeView === 'dashboard' && (
              <InvestigatorDashboard
                cases={cases}
                currentUser={currentUser}
                onSelectCase={(id) => setSelectedCaseId(id)}
                onOpenNewCaseModal={() => setShowNewCaseModal(true)}
                onGoToLanding={() => setAppScreen('landing')}
              />
            )}

            {activeView === 'cross_case' && (
              <AnalystDashboard
                cases={cases}
                allNodes={allGlobalNodes.length > 0 ? allGlobalNodes : caseNodes}
                currentUser={currentUser}
                onSelectCase={(id) => setSelectedCaseId(id)}
                onSelectNode={(node) => setGlobalSelectedNode(node)}
                onGoToLanding={() => setAppScreen('landing')}
              />
            )}

            {activeView === 'gis' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
                  <div>
                    <h1 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>National Inter-State Criminal GIS Intelligence Grid</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pan-India spatial network mapping cross-state crime conduits, hawala vaults, border checkposts, and cyber mule servers.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setAppScreen('landing')}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs group"
                      title="Return to Cluventa Landing & Home Page"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
                      <Home className="w-3.5 h-3.5 text-slate-400" />
                      <span>Back to Home Page</span>
                    </button>
                    <span className="px-3 py-1.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-bold">
                      Zero External API Key Required
                    </span>
                  </div>
                </div>

                <GISMapView
                  locations={globalGisLocations.length > 0 ? globalGisLocations : caseGisLocations}
                  nodes={allGlobalNodes}
                  documents={[]}
                  currentUser={currentUser}
                  caseId="NATIONAL-GRID"
                  onSelectNode={(nodeId) => {
                    const found = allGlobalNodes.find((n) => n.id === nodeId);
                    if (found) setGlobalSelectedNode(found);
                  }}
                  onAddLocation={async (newLoc) => {
                    const res = await fetch('/api/cases/CASE-2025-0248/gis', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...newLoc,
                        userId: currentUser.id,
                        userName: currentUser.name,
                        userRole: currentUser.role,
                      }),
                    });
                    if (res.ok) {
                      const created = await res.json();
                      setGlobalGisLocations((prev) => [...prev, created]);
                      refreshAuditLogs();
                    }
                  }}
                />
              </div>
            )}

            {activeView === 'supervisor' && (
              <SupervisorDashboard
                cases={cases}
                allReviewItems={allGlobalReviewQueue.length > 0 ? allGlobalReviewQueue : caseReviewQueue}
                recentAuditLogs={auditLogs}
                currentUser={currentUser}
                onSelectCase={(id) => setSelectedCaseId(id)}
                onGoToLanding={() => setAppScreen('landing')}
              />
            )}

            {activeView === 'admin' && (
              <AdminConsole
                auditLogs={auditLogs}
                config={systemConfig}
                users={availableUsers}
                currentUser={currentUser}
                onUpdateConfig={handleUpdateConfig}
                onGoToLanding={() => setAppScreen('landing')}
              />
            )}
          </div>
        )}
      </main>

      {/* Global Evidence Drawer if an entity is inspected outside CaseWorkspace */}
      {globalSelectedNode && (
        <EvidenceDrawer
          selectedNode={globalSelectedNode}
          selectedEdge={null}
          allNodes={allGlobalNodes}
          comments={caseComments}
          currentUser={currentUser}
          onClose={() => setGlobalSelectedNode(null)}
          onAddComment={handleAddComment}
          onToggleVerification={handleToggleVerification}
          onSelectNode={(n) => setGlobalSelectedNode(n)}
          onSelectDocument={(docId) => {
            if (globalSelectedNode.caseIds && globalSelectedNode.caseIds[0]) {
              setSelectedCaseId(globalSelectedNode.caseIds[0]);
              setGlobalSelectedNode(null);
            }
          }}
          onUnmaskPII={handleUnmaskPII}
        />
      )}

      {/* New Case Registration Modal */}
      {showNewCaseModal && (
        <NewCaseModal
          currentUser={currentUser}
          onClose={() => setShowNewCaseModal(false)}
          onCreateCase={handleCreateCase}
        />
      )}
    </div>
  );
}
