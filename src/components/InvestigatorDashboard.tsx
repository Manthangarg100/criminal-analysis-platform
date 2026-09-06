/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Case, User } from '../types.ts';
import {
  FileText,
  Search,
  Plus,
  Shield,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Filter,
  Home,
  ArrowLeft,
} from 'lucide-react';

interface InvestigatorDashboardProps {
  cases: Case[];
  currentUser: User;
  onSelectCase: (caseId: string) => void;
  onOpenNewCaseModal: () => void;
  onGoToLanding?: () => void;
}

export const InvestigatorDashboard: React.FC<InvestigatorDashboardProps> = ({
  cases,
  currentUser,
  onSelectCase,
  onOpenNewCaseModal,
  onGoToLanding,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'under_review' | 'closed'>('all');

  const filteredCases = cases.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchFir = c.firNumber.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchPS = c.policeStation.toLowerCase().includes(q);
      if (!matchFir && !matchTitle && !matchDesc && !matchPS) return false;
    }
    return true;
  });

  const activeCount = cases.filter((c) => c.status === 'active').length;
  const underReviewCount = cases.filter((c) => c.status === 'under_review').length;

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
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Investigating Officer (IO) Terminal</span>
          </div>
        </div>
      )}

      {/* Top Welcome & Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Assigned Cases</div>
            <div className="text-2xl font-black font-mono text-white mt-0.5">{cases.length}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-emerald-400/90 uppercase tracking-wider font-bold">Active Inquiries</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">{activeCount}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-amber-400/90 uppercase tracking-wider font-bold">Under Review</div>
            <div className="text-2xl font-black font-mono text-amber-400 mt-0.5">{underReviewCount}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-emerald-400/90 uppercase tracking-wider font-bold">Acceptance Rate</div>
            <div className="text-2xl font-black font-mono text-emerald-300 mt-0.5">94.2%</div>
          </div>
        </div>
      </div>

      {/* Cases List Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-5">
        {/* Search & Filter Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">Investigative Case Repository</h2>
              <p className="text-xs text-slate-400">Select any case below to inspect suspects, network links, and evidence</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search FIR, suspect, or station..."
                className="bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-64 transition-colors"
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="under_review">Under Review</option>
              <option value="closed">Chargesheeted / Closed</option>
            </select>

            {currentUser.role === 'investigator' && (
              <button
                onClick={onOpenNewCaseModal}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Case</span>
              </button>
            )}
          </div>
        </div>

        {/* Case Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCases.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectCase(c.id)}
              className="bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/60 rounded-xl p-5 cursor-pointer transition-all space-y-3.5 group shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-emerald-300 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-700/60">
                  {c.firNumber}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${
                      c.status === 'active'
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/60'
                        : c.status === 'under_review'
                        ? 'bg-amber-950/70 text-amber-300 border-amber-600/60'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {c.status.replace('_', ' ')}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                      c.priority === 'CRITICAL'
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-700/60'
                        : c.priority === 'HIGH'
                        ? 'bg-amber-950/70 text-amber-300 border border-amber-700/60'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {c.priority}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>
              </div>

              {/* BNS Badges */}
              <div className="flex flex-wrap gap-1">
                {(c.sectionsBNS || c.bnsSections || []).map((sec, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-emerald-400/90 px-2 py-0.5 rounded"
                  >
                    {sec}
                  </span>
                ))}
              </div>

              {/* Footer Meta: Station, Officer, Action link */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="truncate max-w-[200px]">
                  <span>{c.policeStation}</span> •{' '}
                  <span className="text-slate-300 font-medium">
                    {c.assignedOfficer || (c.assignedOfficers && c.assignedOfficers[0]) || 'IO Special Cell'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-emerald-400 font-bold group-hover:translate-x-1 transition-transform text-xs">
                  <span>Open Case</span>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
