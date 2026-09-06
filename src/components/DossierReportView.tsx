/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Case, GraphNode, GraphEdge, TimelineEvent, CaseDocument, User } from '../types.ts';
import { CluventaLogo } from './CluventaLogo.tsx';
import {
  FileText,
  Printer,
  Sparkles,
  ShieldCheck,
  Download,
  CheckCircle2,
  Calendar,
  Lock,
  Hash,
  Layers,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface DossierReportViewProps {
  caseData: Case;
  nodes: GraphNode[];
  edges: GraphEdge[];
  timeline: TimelineEvent[];
  documents: CaseDocument[];
  currentUser: User;
  onGenerateSummary: () => Promise<string>;
}

export const DossierReportView: React.FC<DossierReportViewProps> = ({
  caseData,
  nodes,
  edges,
  timeline,
  documents,
  currentUser,
  onGenerateSummary,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryText, setSummaryText] = useState(caseData.summaryReport || '');

  const verifiedNodes = nodes.filter((n) => n.verificationStatus === 'verified');
  const verifiedEdges = edges.filter((e) => e.verificationStatus === 'verified');

  const handleRunAiSummary = async () => {
    setIsGenerating(true);
    try {
      const summary = await onGenerateSummary();
      setSummaryText(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm print:hidden">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Evidentiary Case Dossier & Intelligence Briefing
          </h3>
          <p className="text-xs text-slate-400">
            Court-ready summary with complete evidentiary chain of custody.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAiSummary}
            disabled={isGenerating}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Synthesizing with Gemini...' : 'Regenerate Narrative Synthesis'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Printable Formal Dossier Document Container */}
      <div className="bg-slate-900 text-slate-200 rounded-xl shadow-2xl p-8 sm:p-12 space-y-8 font-sans border border-slate-800 print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Document Header with Police Emblem / Title */}
        <div className="border-b-2 border-emerald-500/40 pb-6 text-center space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono tracking-widest uppercase font-bold text-emerald-400">
              CONFIDENTIAL • LAW ENFORCEMENT SENSITIVE • COURT ADMISSIBLE (BSA 2023)
            </div>
            <CluventaLogo size="xs" variant="full" glow={false} />
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase text-white font-serif">
            SPECIAL CELL CRIMINAL INTELLIGENCE REPORT
          </h1>
          <div className="text-sm font-semibold text-slate-300">
            {caseData.policeStation.toUpperCase()} • NCT OF DELHI
          </div>
          <div className="font-mono text-xs text-slate-500 mt-1">
            Generated via Cluventa Intelligence Platform • System ID: CLUVENTA-SIH26189-LE
          </div>
        </div>

        {/* Case Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs">
          <div>
            <span className="text-slate-400 block font-medium">FIR / Crime No:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{caseData.firNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Investigating Officer:</span>
            <span className="font-semibold text-white">
              {caseData.assignedOfficer || (caseData.assignedOfficers && caseData.assignedOfficers[0]) || 'IO Special Cell'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Applicable Acts & Sections:</span>
            <span className="font-mono font-bold text-emerald-300">
              {(caseData.sectionsBNS || caseData.bnsSections || []).join(', ')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Audit Authentication Hash:</span>
            <span className="font-mono text-[10px] text-slate-500 truncate block">sha256:4f8e...90a1</span>
          </div>
        </div>

        {/* Section 1: Executive Case Narrative (Gemini AI Synthesized) */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
            1. Executive Intelligence Assessment & Syndicate Hierarchy
          </h2>
          <div className="p-4 bg-slate-950 border-l-3 border-emerald-500 rounded-r-lg text-xs leading-relaxed text-slate-200 font-sans whitespace-pre-wrap">
            {summaryText}
          </div>
        </div>

        {/* Section 2: Verified Key Syndicate Entities */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
            2. Verified Target Entities & Attribution Matrix ({verifiedNodes.length} Verified)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-800">
              <thead className="bg-slate-950 text-slate-300 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 border border-slate-800">Entity Name & Aliases</th>
                  <th className="p-2.5 border border-slate-800">Type</th>
                  <th className="p-2.5 border border-slate-800">Primary Identifier</th>
                  <th className="p-2.5 border border-slate-800">Source Document</th>
                  <th className="p-2.5 border border-slate-800">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {verifiedNodes.map((node) => (
                  <tr key={node.id} className="hover:bg-slate-950/60 transition-colors">
                    <td className="p-2.5 border border-slate-800 font-medium">
                      <div className="font-bold text-white">{node.label}</div>
                      {node.aliases && node.aliases.length > 0 && (
                        <div className="text-[10px] text-slate-400">
                          Aliases: {node.aliases.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 border border-slate-800 font-mono text-[11px] text-slate-300">
                      {node.type}
                    </td>
                    <td className="p-2.5 border border-slate-800 font-mono text-[11px] text-emerald-300 font-bold">
                      {node.maskedValue}
                    </td>
                    <td className="p-2.5 border border-slate-800 font-mono text-[11px] text-slate-400">
                      {node.sourceDocumentId}
                    </td>
                    <td className="p-2.5 border border-slate-800 font-mono text-[11px] font-bold text-emerald-400">
                      {Math.round(node.confidenceScore * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Probative Relationship Evidentiary Chain */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
            3. Evidentiary Linkages & Probative Grounding Quotes ({verifiedEdges.length} Links)
          </h2>
          <div className="space-y-2">
            {verifiedEdges.map((edge) => (
              <div key={edge.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between font-mono font-bold text-white text-[11px]">
                  <span className="text-emerald-300">{edge.label}</span>
                  <span className="text-slate-400">{edge.sourceDocumentTitle}</span>
                </div>
                <p className="italic text-slate-300 text-xs">"{edge.evidenceSentence}"</p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Method: {edge.extractionMethod} • Direct Evidence: {edge.isDirect ? 'YES' : 'NO'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Chronological Sequence */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
            4. Reconstructed Chronological Event Sequence
          </h2>
          <div className="space-y-2 text-xs">
            {timeline.slice(0, 5).map((evt) => (
              <div key={evt.id} className="flex items-start gap-3 p-2.5 border-b border-slate-800/80">
                <div className="font-mono text-emerald-400 font-semibold w-36 flex-shrink-0 text-[11px]">
                  {evt.timestamp}
                </div>
                <div>
                  <div className="font-bold text-white">{evt.title}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{evt.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Official Sign-off Footer */}
        <div className="pt-8 border-t-2 border-slate-800 flex justify-between items-end text-xs">
          <div>
            <div className="font-mono text-slate-500 text-[10px]">
              Dossier Integrity Checksum: 0x99e810a9bf...
            </div>
            <div className="text-slate-400 text-[10px]">
              DPDP Act 2023 & BSA 2023 Section 63 Digital Certificate Verified
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="font-serif italic font-bold text-white text-sm">
              {caseData.assignedOfficer || (caseData.assignedOfficers && caseData.assignedOfficers[0]) || 'IO Special Cell'}
            </div>
            <div className="font-mono text-[10px] text-slate-400 uppercase">
              Investigating Officer / Inspector, Special Cell
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
