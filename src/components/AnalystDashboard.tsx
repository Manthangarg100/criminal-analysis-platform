/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Case, GraphNode, User } from '../types.ts';
import {
  Search,
  Layers,
  Link as LinkIcon,
  Shield,
  FileText,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Hash,
  Home,
  ArrowLeft,
} from 'lucide-react';

interface AnalystDashboardProps {
  cases: Case[];
  allNodes: GraphNode[];
  currentUser: User;
  onSelectCase: (caseId: string) => void;
  onSelectNode: (node: GraphNode) => void;
  onGoToLanding?: () => void;
}

export const AnalystDashboard: React.FC<AnalystDashboardProps> = ({
  cases,
  allNodes,
  currentUser,
  onSelectCase,
  onSelectNode,
  onGoToLanding,
}) => {
  const [crossSearchQuery, setCrossSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    query: string;
    matchingNodes: GraphNode[];
    linkedCases: Case[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Identify multi-case nodes (Entities present in more than 1 case)
  const sharedEntities = (allNodes || []).filter((n) => (n.caseIds || []).length > 1);

  const handleCrossSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crossSearchQuery.trim()) return;

    setIsSearching(true);
    const q = crossSearchQuery.toLowerCase();
    const matching = (allNodes || []).filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.primaryIdentifier.toLowerCase().includes(q) ||
        n.maskedValue.toLowerCase().includes(q) ||
        (n.aliases && n.aliases.some((a) => a.toLowerCase().includes(q)))
    );

    const linkedCaseIds = new Set<string>();
    matching.forEach((n) => (n.caseIds || []).forEach((cid) => linkedCaseIds.add(cid)));
    const matchingCases = cases.filter((c) => linkedCaseIds.has(c.id));

    setSearchResults({
      query: crossSearchQuery,
      matchingNodes: matching,
      linkedCases: matchingCases,
    });
    setIsSearching(false);
  };

  return (
    <div className="space-y-6">
      {/* Quick Navigation Breadcrumb */}
      {onGoToLanding && (
        <div className="flex items-center justify-between pb-1">
          <button
            onClick={onGoToLanding}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-xs group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>Back to Home Page</span>
          </button>

          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            <span>Intelligence Analyst Terminal</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Pan-Delhi Cross-Case Intelligence Hub
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyst Intelligence • Cross-jurisdictional syndicate correlation across Special Cell,
            Crime Branch, and District Stations.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-3 py-1.5 rounded-lg font-semibold">
          <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>{sharedEntities.length} Syndicate Bridge Entities Detected</span>
        </div>
      </div>

      {/* Universal Cross-Case Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-white">Universal Entity Correlation Search</h3>
        <p className="text-xs text-slate-400">
          Query any phone number (MSISDN), vehicle license plate, token, or suspect
          alias to discover cross-case linkages across all FIR repositories.
        </p>

        <form onSubmit={handleCrossSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={crossSearchQuery}
              onChange={(e) => setCrossSearchQuery(e.target.value)}
              placeholder="e.g. +91 98765 43210, DL-01-AB-1234, or Vicky Malhotra..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Correlate Across Cases</span>
          </button>
        </form>

        {/* Search Results Display */}
        {searchResults && (
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">
                Correlation Results for query: <span className="font-mono text-emerald-400 font-bold">"{searchResults.query}"</span>
              </span>
              <span className="font-mono text-slate-400">
                Found {searchResults.matchingNodes.length} Entities in {searchResults.linkedCases.length} Separate Cases
              </span>
            </div>

            {searchResults.matchingNodes.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 bg-slate-950 border border-slate-800 rounded-lg">
                No cross-case entity matches found in repository.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchResults.matchingNodes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => onSelectNode(n)}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-xl cursor-pointer transition-all space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{n.label}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-semibold">
                        {n.type}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-emerald-400">{n.maskedValue}</div>

                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      Linked Cases:
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(n.caseIds || []).map((cid) => {
                          const cs = cases.find((c) => c.id === cid);
                          return (
                            <button
                              key={cid}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCase(cid);
                              }}
                              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 rounded font-mono text-[10px] cursor-pointer"
                            >
                              {cs?.firNumber || cid}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cross-Case Syndicate Overlap Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-emerald-400" />
              Syndicate Commonality Matrix (Multi-Case Bridges)
            </h3>
            <p className="text-xs text-slate-400">
              Entities appearing simultaneously in multiple unrelated FIRs, indicating organized syndicates.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {sharedEntities.map((ent) => (
            <div
              key={ent.id}
              onClick={() => onSelectNode(ent)}
              className="p-4 bg-slate-950 border border-slate-800 hover:border-emerald-500/80 rounded-xl transition-all cursor-pointer flex flex-wrap items-center justify-between gap-4 shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{ent.label}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-semibold">
                    {ent.type}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-semibold">
                    Active in {ent.caseIds.length} Cases
                  </span>
                </div>
                <div className="font-mono text-xs text-emerald-400">{ent.maskedValue}</div>
                {ent.aliases && ent.aliases.length > 0 && (
                  <div className="text-[11px] text-slate-400">Aliases: {ent.aliases.join(', ')}</div>
                )}
              </div>

              {/* Linked Cases Badges */}
              <div className="flex items-center gap-2">
                {(ent.caseIds || []).map((cid) => {
                  const cs = cases.find((c) => c.id === cid);
                  return (
                    <button
                      key={cid}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(cid);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{cs?.firNumber || cid}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
