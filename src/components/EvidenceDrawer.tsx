/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GraphNode, GraphEdge, NodeEdgeComment, User } from '../types.ts';
import {
  X,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Send,
  Link as LinkIcon,
  Layers,
  Sparkles,
  Info,
  Calendar,
  Tag,
  Hash,
} from 'lucide-react';

interface EvidenceDrawerProps {
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  allNodes: GraphNode[];
  comments: NodeEdgeComment[];
  currentUser: User;
  onClose: () => void;
  onAddComment: (targetType: 'node' | 'edge', targetId: string, text: string) => void;
  onToggleVerification: (targetType: 'node' | 'edge', targetId: string, newStatus: 'verified' | 'ai_suggested' | 'rejected') => void;
  onSelectNode: (node: GraphNode) => void;
  onSelectDocument: (docId: string) => void;
  onUnmaskPII: (nodeId: string, reason: string) => Promise<string>;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  selectedNode,
  selectedEdge,
  allNodes,
  comments,
  currentUser,
  onClose,
  onAddComment,
  onToggleVerification,
  onSelectNode,
  onSelectDocument,
  onUnmaskPII,
}) => {
  const [commentText, setCommentText] = useState('');
  const [unmaskReason, setUnmaskReason] = useState('');
  const [isUnmasking, setIsUnmasking] = useState(false);
  const [showUnmaskPrompt, setShowUnmaskPrompt] = useState(false);
  const [unmaskedValues, setUnmaskedValues] = useState<Record<string, string>>({});

  if (!selectedNode && !selectedEdge) {
    return null;
  }

  const isNode = !!selectedNode;
  const targetId = isNode ? selectedNode!.id : selectedEdge!.id;
  const targetType = isNode ? 'node' : 'edge';

  const relevantComments = comments.filter(
    (c) => c.targetType === targetType && c.targetId === targetId
  );

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(targetType, targetId, commentText.trim());
    setCommentText('');
  };

  const handleUnmaskConfirm = async () => {
    if (!selectedNode) return;
    setIsUnmasking(true);
    try {
      const unmasked = await onUnmaskPII(selectedNode.id, unmaskReason || 'Official Case Verification');
      setUnmaskedValues((prev) => ({ ...prev, [selectedNode.id]: unmasked }));
      setShowUnmaskPrompt(false);
      setUnmaskReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUnmasking(false);
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'Person':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'Phone':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'Vehicle':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'Organisation':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'Location':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'FinancialAccount':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Verified
          </span>
        );
      case 'ai_suggested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-700 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI Suggestion
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800 line-through">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // Find source & target nodes for edge
  let edgeSourceNode: GraphNode | undefined;
  let edgeTargetNode: GraphNode | undefined;
  if (selectedEdge) {
    edgeSourceNode = allNodes.find((n) => n.id === selectedEdge.source);
    edgeTargetNode = allNodes.find((n) => n.id === selectedEdge.target);
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700 flex items-center justify-center text-emerald-400 shadow-xs">
            {isNode ? <Layers className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Evidence Dossier
            </div>
            <h3 className="text-sm font-bold text-white leading-tight">
              {isNode ? selectedNode!.label : selectedEdge!.label}
            </h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-950 custom-scrollbar">
        {/* Verification Status Banner & Human-in-the-Loop Toggle */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Status:</span>
            <div>
              {getVerificationBadge(
                isNode ? selectedNode!.verificationStatus : selectedEdge!.verificationStatus
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400">Confidence Score:</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    (isNode ? selectedNode!.confidenceScore : selectedEdge!.confidenceScore) >= 0.9
                      ? 'bg-emerald-500'
                      : (isNode ? selectedNode!.confidenceScore : selectedEdge!.confidenceScore) >= 0.75
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.round(
                      (isNode ? selectedNode!.confidenceScore : selectedEdge!.confidenceScore) * 100
                    )}%`,
                  }}
                />
              </div>
              <span className="font-mono font-bold text-slate-200">
                {Math.round(
                  (isNode ? selectedNode!.confidenceScore : selectedEdge!.confidenceScore) * 100
                )}
                %
              </span>
            </div>
          </div>

          {/* Verification override controls (IO and Supervisor) */}
          {(currentUser.role === 'investigator' || currentUser.role === 'supervisor') && (
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Officer Decision:</span>
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={() => onToggleVerification(targetType, targetId, 'verified')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded text-[11px] font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Confirm (Verify)
                </button>
                <button
                  onClick={() => onToggleVerification(targetType, targetId, 'rejected')}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Node Specific Metadata */}
        {isNode && selectedNode && (
          <div className="space-y-4">
            {/* Entity Type & Identifier */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getNodeColor(
                    selectedNode.type
                  )}`}
                >
                  {selectedNode.type} Entity
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  ID: {selectedNode.id}
                </span>
              </div>

              {/* Primary Identifier with PII Protection */}
              <div>
                <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                  <span>Primary Identifier:</span>
                  {selectedNode.isSensitive && (
                    <span className="text-[10px] font-mono text-amber-400 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Protected PII
                    </span>
                  )}
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between font-mono text-xs">
                  <span className="text-emerald-300 font-bold">
                    {unmaskedValues[selectedNode.id]
                      ? unmaskedValues[selectedNode.id]
                      : selectedNode.maskedValue}
                  </span>

                  {selectedNode.isSensitive && !unmaskedValues[selectedNode.id] && (
                    <button
                      onClick={() => setShowUnmaskPrompt(true)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline font-sans flex items-center gap-1 ml-2 cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Unmask
                    </button>
                  )}
                </div>
              </div>

              {/* Aliases if any */}
              {selectedNode.aliases && selectedNode.aliases.length > 0 && (
                <div>
                  <div className="text-[11px] text-slate-400 mb-1">Identified Aliases:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.aliases.map((alias, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded font-mono text-[11px]"
                      >
                        "{alias}"
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-case indicator */}
              {(selectedNode.caseIds || []).length > 1 && (
                <div className="p-2 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-emerald-300 text-[11px] flex items-center gap-2 font-medium">
                  <LinkIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    Linked across <strong>{selectedNode.caseIds.length} Cases</strong> in repository.
                  </span>
                </div>
              )}
            </div>

            {/* Centrality & Graph Metrics (Deterministic GDS) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 shadow-xs">
              <div className="font-semibold text-slate-200 flex items-center justify-between text-xs">
                <span>Graph Analytics</span>
                <span className="text-[10px] text-slate-400 font-mono">Metric</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="text-[10px] text-slate-400">Degree</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    {selectedNode.degreeCentrality ?? 0.5}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Hub</div>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="text-[10px] text-slate-400">Betweenness</div>
                  <div className="text-sm font-bold font-mono text-purple-400">
                    {selectedNode.betweennessCentrality ?? 0.3}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Bridge</div>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="text-[10px] text-slate-400">Cluster</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    #{selectedNode.communityId ?? 1}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Cell</div>
                </div>
              </div>
            </div>

            {/* Custom Attributes */}
            {selectedNode.attributes && Object.keys(selectedNode.attributes).length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 shadow-xs">
                <div className="font-semibold text-slate-200 text-xs">Entity Attributes</div>
                <div className="space-y-1.5">
                  {Object.entries(selectedNode.attributes).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex justify-between py-1 border-b border-slate-800 text-[11px]"
                    >
                      <span className="text-slate-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}:
                      </span>
                      <span className="text-slate-200 font-medium text-right max-w-[240px]">
                        {Array.isArray(val) ? val.join(', ') : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edge Specific Metadata */}
        {!isNode && selectedEdge && (
          <div className="space-y-4">
            {/* Edge Endpoints */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Relationship Type:</span>
                <span className="font-mono text-emerald-400 font-bold px-2 py-0.5 bg-emerald-950/80 border border-emerald-800 rounded">
                  {selectedEdge.type}
                </span>
              </div>

              {/* Source ➔ Target Jump Links */}
              <div className="space-y-2 font-mono text-xs">
                <div
                  onClick={() => edgeSourceNode && onSelectNode(edgeSourceNode)}
                  className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-lg cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <span className="text-slate-400 text-[10px]">Source Node:</span>
                  <span className="text-emerald-400 font-semibold group-hover:underline">
                    {edgeSourceNode?.label || selectedEdge.source}
                  </span>
                </div>

                <div className="text-center text-slate-400 font-sans text-xs">⬇ {selectedEdge.label} ⬇</div>

                <div
                  onClick={() => edgeTargetNode && onSelectNode(edgeTargetNode)}
                  className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-lg cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <span className="text-slate-400 text-[10px]">Target Node:</span>
                  <span className="text-emerald-400 font-semibold group-hover:underline">
                    {edgeTargetNode?.label || selectedEdge.target}
                  </span>
                </div>
              </div>

              {/* Direct vs Inferred */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                <span className="text-slate-400">Nature of Connection:</span>
                <span
                  className={`font-semibold ${
                    selectedEdge.isDirect ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {selectedEdge.isDirect ? 'Direct First-Hand Evidenced' : 'Inferred Indirect Chain'}
                </span>
              </div>
            </div>

            {/* Supporting Evidence Sentence / Verbatim Excerpt */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 shadow-xs">
              <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Probative Grounding Sentence</span>
              </div>
              <blockquote className="p-3 bg-slate-950 border-l-2 border-emerald-500 rounded-r-lg text-slate-300 italic text-[11px] leading-relaxed">
                "{selectedEdge.evidenceSentence}"
              </blockquote>
            </div>
          </div>
        )}

        {/* Source Document Traceability Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 shadow-xs">
          <div className="font-semibold text-slate-200 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Source Provenance
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Section 10</span>
          </div>

          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Source Document:</span>
              <button
                onClick={() =>
                  onSelectDocument(
                    isNode ? selectedNode!.sourceDocumentId : selectedEdge!.sourceDocumentId
                  )
                }
                className="text-emerald-400 hover:text-emerald-300 font-medium underline truncate max-w-[200px] cursor-pointer"
              >
                {isNode ? selectedNode!.sourceDocumentId : selectedEdge!.sourceDocumentTitle}
              </button>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Extraction Method:</span>
              <span className="font-mono text-slate-300">
                {isNode ? selectedNode!.extractionMethod : selectedEdge!.extractionMethod}
              </span>
            </div>
          </div>
        </div>

        {/* Collaborative Multi-Investigator Notes & Comments */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-xs">
          <div className="font-semibold text-slate-200 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              Officer Notes ({relevantComments.length})
            </span>
            <span className="text-[10px] text-slate-400">Collaborative</span>
          </div>

          {/* Comments List */}
          <div className="space-y-2">
            {relevantComments.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">
                No notes attached yet. Add an investigative comment below.
              </p>
            ) : (
              relevantComments.map((com) => (
                <div
                  key={com.id}
                  className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-emerald-400">{com.authorName}</span>
                    <span className="text-slate-500 font-mono">{com.timestamp.slice(0, 16)}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{com.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Input */}
          <form onSubmit={handleCommentSubmit} className="pt-2 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Attach case note to this item..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Unmask PII Confirmation Modal */}
      {showUnmaskPrompt && selectedNode && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs p-6 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Lock className="w-5 h-5" />
              <h4 className="font-bold text-sm text-white">Protected PII Disclosure Protocol</h4>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Under Section 10 of Cluventa Security Standards & DPDP Act compliance, unmasking citizen
              phone numbers or accounts is an audited action.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-medium">
                Official Case Justification:
              </label>
              <input
                type="text"
                value={unmaskReason}
                onChange={(e) => setUnmaskReason(e.target.value)}
                placeholder="e.g. Cross-examination warrant preparation"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowUnmaskPrompt(false)}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUnmaskConfirm}
                disabled={isUnmasking}
                className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                {isUnmasking ? 'Authorizing...' : 'Confirm & Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
