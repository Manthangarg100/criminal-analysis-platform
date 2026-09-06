/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuditLogEntry, SystemConfig, User } from '../types.ts';
import {
  Sliders,
  Shield,
  Clock,
  Download,
  Filter,
  Users,
  CheckCircle2,
  Lock,
  Sparkles,
  BarChart3,
  Cpu,
  Home,
  ArrowLeft,
} from 'lucide-react';

interface AdminConsoleProps {
  auditLogs: AuditLogEntry[];
  config: SystemConfig;
  users: User[];
  currentUser: User;
  onUpdateConfig: (newConfig: Partial<SystemConfig>) => Promise<void>;
  onGoToLanding?: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  auditLogs,
  config,
  users,
  currentUser,
  onUpdateConfig,
  onGoToLanding,
}) => {
  const [matchThreshold, setMatchThreshold] = useState(config.matchThreshold);
  const [anomalySensitivity, setAnomalySensitivity] = useState(config.anomalySensitivity);
  const [strictPIIMasking, setStrictPIIMasking] = useState(config.strictPIIMasking);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = (auditLogs || []).filter((l) => {
    if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
    return true;
  });

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    await onUpdateConfig({
      matchThreshold,
      anomalySensitivity,
      strictPIIMasking,
    });
    setIsSavingConfig(false);
  };

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CLUVENTA_AUDIT_TRAIL_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            <span>System Administration Terminal</span>
          </div>
        </div>
      )}

      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              System Administration, Thresholds & Audit Vault
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Admin Console • Global pipeline tuning, immutable compliance audit log, and ground-truth validation.
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export Audit Ledger</span>
        </button>
      </div>

      {/* Synthetic Ground Truth Benchmark Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Ground-Truth Benchmark Evaluation
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800 font-semibold">
            DPDP Act 2023 Compliant Testbed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
            <div className="text-[11px] text-slate-400 uppercase">Model Precision</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {(config.benchmarkPrecision * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Low False Positives</div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
            <div className="text-[11px] text-slate-400 uppercase">Model Recall</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {(config.benchmarkRecall * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">High Lead Retention</div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
            <div className="text-[11px] text-slate-400 uppercase">Composite F1 Score</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {(config.benchmarkF1 * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Harmonic Balance</div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
            <div className="text-[11px] text-slate-400 uppercase">Evaluation Corpus</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">250 FIRs</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Gold Standard Synthetics</div>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed pt-1">
          Evaluated against 250 labeled synthetic law enforcement documents with verified telephone
          intercepts, toll sightings, and hawala remittance logs. Real citizen PII is strictly absent
          in accordance with Section 4 of the Digital Personal Data Protection Act 2023.
        </p>
      </div>

      {/* Global Configuration Tuning Sliders */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          Global NLP Pipeline & Anomaly Thresholds
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Match Threshold Slider */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">
                Entity Match Auto-Suggest Threshold:
              </span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                {Math.round(matchThreshold * 100)}%
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={matchThreshold}
              onChange={(e) => setMatchThreshold(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />

            <p className="text-[11px] text-slate-400">
              Suggestions below this confidence threshold require mandatory supervisor escalation
              before appearing in the investigator queue.
            </p>
          </div>

          {/* Anomaly Detection Multiplier */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">
                Behavioral Anomaly Sensitivity Multiplier:
              </span>
              <span className="font-mono text-amber-400 font-bold text-sm">
                {anomalySensitivity.toFixed(1)}x Baseline
              </span>
            </div>

            <input
              type="range"
              min="2.0"
              max="5.0"
              step="0.2"
              value={anomalySensitivity}
              onChange={(e) => setAnomalySensitivity(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />

            <p className="text-[11px] text-slate-400">
              Flags call volume or cash remittance deviations that exceed {anomalySensitivity.toFixed(1)}x
              the historic rolling average of the target entity.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveConfig}
            disabled={isSavingConfig}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSavingConfig ? 'Updating...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Immutable System Audit Trail */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Cryptographic Immutable Audit Trail
            </h3>
            <p className="text-xs text-slate-400">
              Every document view, query, PII unmasking, and report export is immutably logged with user credential hash.
            </p>
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">User Logins</option>
            <option value="PII_UNMASK">PII Unmasking Events</option>
            <option value="DOCUMENT_INGESTION">Document Ingestion</option>
            <option value="REVIEW_DECISION">Review Decisions</option>
            <option value="CONFIG_UPDATE">Config Updates</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 font-mono text-[11px]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Officer / User</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Case Ref</th>
                <th className="p-3">Action Details & Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-950/60 transition-colors">
                  <td className="p-3 text-slate-500">{log.timestamp}</td>
                  <td className="p-3 font-semibold text-white">{log.userName}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'PII_UNMASK'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                          : log.action === 'REVIEW_DECISION'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400">{log.caseId || 'GLOBAL'}</td>
                  <td className="p-3 font-sans text-slate-300 text-[11px] max-w-md">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
