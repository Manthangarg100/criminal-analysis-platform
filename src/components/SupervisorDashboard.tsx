/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Case, ReviewQueueItem, AuditLogEntry, User } from '../types.ts';
import {
  Eye,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  Users,
  ChevronRight,
  Sparkles,
  Home,
  ArrowLeft,
} from 'lucide-react';

interface SupervisorDashboardProps {
  cases: Case[];
  allReviewItems: ReviewQueueItem[];
  recentAuditLogs: AuditLogEntry[];
  currentUser: User;
  onSelectCase: (caseId: string) => void;
  onGoToLanding?: () => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  cases,
  allReviewItems,
  recentAuditLogs,
  currentUser,
  onSelectCase,
  onGoToLanding,
}) => {
  const pendingItems = allReviewItems.filter((i) => i.status === 'pending');
  const acceptedItems = allReviewItems.filter((i) => i.status === 'accepted');
  const acceptanceRate = Math.round(
    (acceptedItems.length / Math.max(1, allReviewItems.length)) * 100
  );

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
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Supervisory Reviewer Terminal</span>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Supervisor & Command Oversight Console (ACP)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervisor Role • Command oversight, AI quality audit, and investigative velocity tracking.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Jurisdiction: <span className="text-emerald-400 font-semibold">Special Cell & Northern Range</span>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-400 uppercase font-mono">Monitored Inquiries</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{cases.length} Cases</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-medium">100% On-Track for Filing</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-400 uppercase font-mono">AI Suggestion Acceptance</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{acceptanceRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">High Human-in-the-Loop Alignment</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-400 uppercase font-mono">Pending IO Decisions</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {pendingItems.length} Leads
          </div>
          <div className="text-[11px] text-amber-300 mt-1 font-medium">Awaiting verification</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-400 uppercase font-mono">Avg Time to First Lead</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">3.4 Mins</div>
          <div className="text-[11px] text-cyan-300 mt-1 font-medium">vs 48hrs manual collation</div>
        </div>
      </div>

      {/* Team Cases Oversight Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Division Case Portfolio & Verification Status
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">FIR No & Title</th>
                <th className="p-3">Assigned IO</th>
                <th className="p-3">Police Station</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-950/60 transition-colors">
                  <td className="p-3">
                    <div className="font-mono text-emerald-400 font-bold">{c.firNumber}</div>
                    <div className="font-semibold text-white">{c.title}</div>
                  </td>
                  <td className="p-3 text-slate-300 font-medium">
                    {c.assignedOfficer || (c.assignedOfficers && c.assignedOfficers[0]) || 'IO Special Cell'}
                  </td>
                  <td className="p-3 text-slate-400">{c.policeStation}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        c.priority === 'CRITICAL'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize bg-slate-950 text-slate-300 border border-slate-800">
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Review Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Officer Audit Log Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          Live Subordinate Audit Stream
        </h3>

        <div className="space-y-2">
          {recentAuditLogs.slice(0, 6).map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-500">{log.timestamp.slice(11, 19)}</span>
                <span className="text-emerald-400 font-semibold">{log.userName}</span>
                <span className="text-slate-300 font-sans">{log.details}</span>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-slate-900 border border-slate-700 text-slate-300 font-medium">
                {log.action}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
