/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ReviewQueueItem, User } from '../types.ts';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  FileText,
  AlertCircle,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';

interface ReviewQueueViewProps {
  items: ReviewQueueItem[];
  currentUser: User;
  onReviewDecision: (
    itemId: string,
    decision: 'accepted' | 'rejected' | 'modified',
    notes?: string,
    modifiedData?: any
  ) => Promise<void>;
  onSelectDocument?: (docId: string) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  items,
  currentUser,
  onReviewDecision,
  onSelectDocument,
}) => {
  const [filterStatus, setFilterStatus] = useState<'pending' | 'accepted' | 'rejected' | 'all'>('pending');
  const [editingItem, setEditingItem] = useState<ReviewQueueItem | null>(null);
  const [editRelationshipLabel, setEditRelationshipLabel] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [rejectItemModal, setRejectItemModal] = useState<ReviewQueueItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);

  const filteredItems = items.filter((it) => {
    if (filterStatus === 'all') return true;
    return it.status === filterStatus;
  });

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const acceptedCount = items.filter((i) => i.status === 'accepted').length;
  const rejectedCount = items.filter((i) => i.status === 'rejected').length;

  const handleOpenEdit = (item: ReviewQueueItem) => {
    setEditingItem(item);
    const label = item.suggestedData?.label || item.suggestedData?.type || item.entityOrRelationship?.relationType || item.title || '';
    setEditRelationshipLabel(label);
    setEditNotes('');
  };

  const handleConfirmEdit = async () => {
    if (!editingItem) return;
    await onReviewDecision(editingItem.id, 'modified', editNotes || 'Officer modified and verified', {
      ...(editingItem.suggestedData || {}),
      label: editRelationshipLabel,
    });
    setEditingItem(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectItemModal) return;
    await onReviewDecision(rejectItemModal.id, 'rejected', rejectReason || 'Officer rejected lead');
    setRejectItemModal(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Investigator Review & Verification Queue
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Human-in-the-Loop review. Verify candidate leads before committing them to the graph.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Pending</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              filterStatus === 'pending' ? 'bg-amber-700 text-slate-950' : 'bg-amber-950/80 text-amber-300'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('accepted')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'accepted'
                ? 'bg-emerald-600 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Verified</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              filterStatus === 'accepted' ? 'bg-emerald-700 text-slate-950' : 'bg-emerald-950/80 text-emerald-300'
            }`}>
              {acceptedCount}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'rejected'
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Rejected</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              filterStatus === 'rejected' ? 'bg-rose-700 text-white' : 'bg-rose-950/80 text-rose-300'
            }`}>
              {rejectedCount}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-800 text-emerald-400 font-bold shadow-xs border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({items.length})
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-70" />
            <p className="font-bold text-white text-sm">Queue is Clear</p>
            <p className="text-slate-400 mt-1">No items found matching the selected filter status.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedDetailsId === item.id;
            const isPending = item.status === 'pending';

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-xl p-5 transition-all space-y-4 shadow-sm ${
                  isPending
                    ? 'border-amber-700/60 hover:border-amber-600/80 ring-1 ring-amber-500/20'
                    : item.status === 'accepted'
                    ? 'border-emerald-800/60'
                    : 'border-slate-800 opacity-60'
                }`}
              >
                {/* Top Row: Type, Title, Confidence */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono text-[10px] uppercase font-bold">
                        {item.type === 'RELATIONSHIP' ? 'Proposed Relation' : 'Entity Disambiguation'}
                      </span>
                      <span className="text-slate-500 font-mono text-xs">ID: {item.id}</span>

                      {item.status !== 'pending' && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                            item.status === 'accepted'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {item.status === 'accepted' ? 'Accepted by Officer' : 'Rejected'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white leading-snug">
                      {item.suggestedData?.sourceEntity && item.suggestedData?.targetEntity ? (
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="text-emerald-300 font-bold">{item.suggestedData.sourceEntity}</span>
                          <span className="text-amber-300 font-mono text-xs px-2 py-0.5 bg-amber-950/80 rounded border border-amber-800 font-semibold">
                            {item.suggestedData.label || item.suggestedData.type}
                          </span>
                          <span className="text-purple-300 font-bold">{item.suggestedData.targetEntity}</span>
                        </span>
                      ) : item.entityOrRelationship?.sourceName && item.entityOrRelationship?.targetName ? (
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="text-emerald-300 font-bold">{item.entityOrRelationship.sourceName}</span>
                          <span className="text-amber-300 font-mono text-xs px-2 py-0.5 bg-amber-950/80 rounded border border-amber-800 font-semibold">
                            {item.entityOrRelationship.relationType || 'LINKED_TO'}
                          </span>
                          <span className="text-purple-300 font-bold">{item.entityOrRelationship.targetName}</span>
                        </span>
                      ) : (
                        item.title || item.suggestedData?.label || 'Candidate Proposition'
                      )}
                    </h4>
                  </div>

                  {/* Confidence Gauge */}
                  <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-medium">Confidence</div>
                      <div className="text-base font-bold font-mono text-emerald-400">
                        {Math.round(item.confidenceScore * 100)}%
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-300 relative">
                      <div
                        className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"
                        style={{ animationDuration: '6s' }}
                      />
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Grounding Excerpt / Verbatim Quote */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      Supporting Evidence Excerpt (Verbatim)
                    </span>

                    {onSelectDocument && (
                      <button
                        onClick={() => onSelectDocument(item.sourceDocumentId)}
                        className="text-emerald-400 hover:text-emerald-300 underline text-[11px] cursor-pointer"
                      >
                        {item.sourceDocumentTitle}
                      </button>
                    )}
                  </div>

                  <blockquote className="p-3 bg-slate-900 border-l-2 border-emerald-500 rounded-r-lg text-slate-200 italic text-xs leading-relaxed font-sans shadow-2xs">
                    "{item.evidenceSnippet}"
                  </blockquote>
                </div>

                {/* Explainability Breakdown (Accordions) */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedDetailsId(isExpanded ? null : item.id)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Explainability Reasoning & Breakdown
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800 text-xs space-y-3 bg-slate-900/60">
                      <p className="text-slate-300 leading-relaxed">{item.reasoning}</p>

                      {item.scoreBreakdown && typeof item.scoreBreakdown === 'object' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                          {Array.isArray(item.scoreBreakdown)
                            ? item.scoreBreakdown.map((factor, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-center"
                                >
                                  <div className="text-[10px] text-slate-400">{factor.rule}</div>
                                  <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
                                    Weight: {Math.round(factor.weight * 100)}%
                                  </div>
                                  <div className="text-[9px] text-slate-500 mt-0.5 truncate">
                                    {factor.matchDetail}
                                  </div>
                                </div>
                              ))
                            : Object.entries(item.scoreBreakdown).map(([factor, score]) => (
                                <div
                                  key={factor}
                                  className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-center"
                                >
                                  <div className="text-[10px] text-slate-400 capitalize">
                                    {factor.replace(/([A-Z])/g, ' $1')}
                                  </div>
                                  <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
                                    {Math.round(Number(score) * 100)}%
                                  </div>
                                </div>
                              ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Investigator Action Bar (Accept, Reject, Edit & Accept) */}
                {isPending && (currentUser.role === 'investigator' || currentUser.role === 'supervisor') && (
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 italic">
                      Verifying will commit this connection as a proven fact to the case graph.
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRejectItemModal(item)}
                        className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Reject Lead</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Edit & Accept</span>
                      </button>

                      <button
                        onClick={() =>
                          onReviewDecision(item.id, 'accepted', 'Verified by Investigating Officer')
                        }
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept & Verify</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit & Accept Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Edit3 className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-sm text-white">Edit & Verify Suggestion</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Relationship Label / Category:</label>
                <input
                  type="text"
                  value={editRelationshipLabel}
                  onChange={(e) => setEditRelationshipLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Investigator Note / Revision Justification:</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Revised relation after cross-examining witness."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 custom-scrollbar"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingItem(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEdit}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Save & Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Lead Confirmation Modal */}
      {rejectItemModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-rose-400">
              <XCircle className="w-5 h-5" />
              <h4 className="font-bold text-sm text-white">Reject Candidate Lead</h4>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Rejecting this lead flags the suggestion as false/unsubstantiated and prevents it from
              joining the verified graph.
            </p>

            <div>
              <label className="block text-slate-400 mb-1 text-xs">Reason for Rejection:</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Tower ping coincides with public transit route; coincidence."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRejectItemModal(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
