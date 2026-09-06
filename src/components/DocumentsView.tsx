/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CaseDocument, DocumentType, SourceReliability, User } from '../types.ts';
import {
  FileText,
  UploadCloud,
  FileCheck,
  Cpu,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  FileSpreadsheet,
  FileSignature,
  Eye,
  Plus,
} from 'lucide-react';

interface DocumentsViewProps {
  documents: CaseDocument[];
  caseId: string;
  currentUser: User;
  onUploadDocument: (docData: {
    title: string;
    type: DocumentType;
    content: string;
    sourceReliability: SourceReliability;
  }) => Promise<any>;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  caseId,
  currentUser,
  onUploadDocument,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<CaseDocument | null>(documents[0] || null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<DocumentType>('FIR');
  const [docContent, setDocContent] = useState('');
  const [docReliability, setDocReliability] = useState<SourceReliability>('Verified Official Record');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<number>(0);

  // Pre-configured sample document templates for instant evaluation
  const SAMPLE_TEMPLATES = [
    {
      label: 'Sample Interrogation Statement (Hindi/English Transliteration)',
      type: 'free_text' as DocumentType,
      title: 'Interrogation of Courier Zubair Ahmed @ Chhotu',
      reliability: 'Secondary Intelligence' as SourceReliability,
      content: `CONFIDENTIAL RECORD OF EXAMINATION — SPECIAL CELL
Accused: Zubair Ahmed @ "Chhotu" s/o Farooq Ahmed, r/o Jafrabad, Delhi.
Date of Examination: 22/10/2025.

"I have been working for Rafiq Bhai (Mohd. Rafiq) since March 2025. Rafiq Bhai provided me with mobile +91 98119 88776. On 10th October, he phoned me and asked to meet Vikram Malhotra @ Vicky at Chandni Chowk shop. Vicky handed over a sealed parcel containing ₹15,00,000/- in cash to be transported to Alipur warehouse using Scorpio DL-01-AB-1234. Aslam Sheikh was waiting near the Alipur bypass to collect the cash."`,
    },
    {
      label: 'Sample CDR Intercept Log',
      type: 'CDR' as DocumentType,
      title: 'Tower Intercept Dump — Alipur Border Sector 9',
      reliability: 'Verified Official Record' as SourceReliability,
      content: `TELECOM REGULATORY INTERCEPT — AIRTEL TOWER DUMP:
Tower ID: DEL-ALIPUR-SEC9 | Period: 10/10/2025 21:00 to 23:30 IST

- Call #109: +91 98765 43210 (Burner SIM) to +91 98119 88776 (Zubair Chhotu) at 21:14:02 IST (Duration: 94 sec).
- Call #114: +91 98119 88776 to +91 99554 11223 (Aslam Sheikh) at 21:45:18 IST (Duration: 42 sec).
- Geo-triangulation confirms both numbers active within 300m of Alipur godown boundary.`,
    },
    {
      label: 'Sample ANPR Vehicle Sighting Memo',
      type: 'vehicle_sighting' as DocumentType,
      title: 'Toll Sighting Memo — Kundli Border ANPR Camera 03',
      reliability: 'Verified Official Record' as SourceReliability,
      content: `ANPR TOLL TRAFFIC LOG — NH-44 KUNDLI BORDER:
Timestamp: 10/10/2025 22:15 IST
Vehicle Plate: DL-01-AB-1234 | Vehicle Type: Mahindra Scorpio S11 (Black)
Lane: Lane 04 (Inbound Delhi)
Driver photo match: Consistent with Aslam Sheikh. Passenger seat: Unidentified male carrying dark duffel bag.`,
    },
  ];

  const handleApplyTemplate = (tmpl: (typeof SAMPLE_TEMPLATES)[0]) => {
    setDocTitle(tmpl.title);
    setDocType(tmpl.type);
    setDocReliability(tmpl.reliability);
    setDocContent(tmpl.content);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;

    setIsProcessing(true);
    // Simulate step-by-step pipeline stages for visual demonstration (Figure 2)
    setProcessingStep(1);
    await new Promise((r) => setTimeout(r, 600));
    setProcessingStep(2);
    await new Promise((r) => setTimeout(r, 600));
    setProcessingStep(3);
    await new Promise((r) => setTimeout(r, 700));
    setProcessingStep(4);
    await new Promise((r) => setTimeout(r, 700));
    setProcessingStep(5);
    await new Promise((r) => setTimeout(r, 600));
    setProcessingStep(6);

    await onUploadDocument({
      title: docTitle.trim(),
      type: docType,
      content: docContent.trim(),
      sourceReliability: docReliability,
    });

    setIsProcessing(false);
    setShowUploadModal(false);
    setDocTitle('');
    setDocContent('');
    setProcessingStep(0);
  };

  const PIPELINE_STEPS = [
    { num: 1, name: 'Doc Type Router', desc: 'Identified MIME format & heuristic' },
    { num: 2, name: 'Text Normalization', desc: 'Transliteration & Hindi variant mapping' },
    { num: 3, name: 'NER Model', desc: 'spaCy / Transformer tagger for Person/Phone/Veh' },
    { num: 4, name: 'Agentic Extraction', desc: 'Gemini LLM relationship tuples with source quotes' },
    { num: 5, name: 'Entity Resolution', desc: 'Deterministic + Jaro-Winkler fuzzy scoring' },
    { num: 6, name: 'Review Queue Commit', desc: 'Candidate cards generated for human sign-off' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Documents List & Upload Button */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 flex flex-col h-[640px] shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Case Documents ({documents.length})
            </h3>
            <p className="text-[11px] text-slate-400">Section 5 Processing Pipeline</p>
          </div>

          {(currentUser.role === 'investigator' || currentUser.role === 'supervisor') && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ingest Doc</span>
            </button>
          )}
        </div>

        {/* Documents Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {(documents || []).map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-600/80 text-white shadow-xs'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-[10px] text-emerald-400 font-semibold uppercase">
                    {doc.id} • {doc.type}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{doc.fileSize}</span>
                </div>

                <div className="font-semibold text-xs leading-snug line-clamp-2 text-slate-100">{doc.title}</div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <span className="truncate max-w-[140px]">{doc.sourceReliability}</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-mono font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Processed
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Full Document Reader Viewer */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[640px] shadow-sm">
        {selectedDoc ? (
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            {/* Document Header */}
            <div className="pb-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-mono text-[10px] uppercase font-bold">
                    {selectedDoc.type} RECORD
                  </span>
                  <span className="text-slate-400 font-mono text-xs">ID: {selectedDoc.id}</span>
                </div>
                <h2 className="text-base font-bold text-white mt-1 leading-tight">
                  {selectedDoc.title}
                </h2>
              </div>

              <div className="text-right text-xs">
                <div className="text-slate-400">
                  Uploaded: <span className="text-slate-200 font-medium">{selectedDoc.uploadedAt}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  By: <span className="text-slate-300 font-medium">{selectedDoc.uploadedBy}</span>
                </div>
              </div>
            </div>

            {/* Reliability & Provenance Badge */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">Evidentiary Reliability Tier:</span>
                <span className="font-semibold text-emerald-300">{selectedDoc.sourceReliability}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">NLP Ingested • Verified</span>
            </div>

            {/* Document Text Box (Full Text Content) */}
            <div className="flex-1 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-emerald-900 selection:text-emerald-100 custom-scrollbar">
              {selectedDoc.content}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            Select a document from the left list to inspect its contents.
          </div>
        )}
      </div>

      {/* Upload Document Modal with Pipeline Visualizer */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Ingest New Case Document</h3>
                  <p className="text-xs text-slate-400">
                    Runs extraction and entity resolution pipeline.
                  </p>
                </div>
              </div>
              {!isProcessing && (
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Demo Template Selectors */}
            {!isProcessing && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Or Load Pre-Curated Evaluation Template:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-600/60 rounded-lg text-left text-xs transition-colors cursor-pointer"
                    >
                      <div className="font-bold text-emerald-400">{tmpl.type} Template</div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {tmpl.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Form */}
            {!isProcessing ? (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Document Title
                    </label>
                    <input
                      type="text"
                      required
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="e.g. Supplementary CDR Analysis Report"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Document Type Tag (Router)
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as DocumentType)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="FIR">FIR / Chargesheet</option>
                      <option value="CDR">CDR Telecom Log</option>
                      <option value="financial">Financial / Bank Statement</option>
                      <option value="vehicle_sighting">ANPR Vehicle Sighting</option>
                      <option value="free_text">Witness Statement / Free-text</option>
                      <option value="scanned_image">Scanned Document</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Document Text Content (Or OCR Output)
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder="Paste FIR narrative, CDR dump, or witness interrogation statements here..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed custom-scrollbar"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!docTitle.trim() || !docContent.trim()}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>Run Extraction Pipeline</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Live Animated Pipeline Visualizer */
              <div className="py-6 space-y-6">
                <div className="text-center">
                  <div className="inline-flex p-3 rounded-full bg-emerald-950/80 border border-emerald-600 text-emerald-400 animate-spin mb-3">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Processing Document through Pipeline...
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Executing multi-stage extraction, entity resolution & review queue dispatch.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {PIPELINE_STEPS.map((step) => {
                    const isCompleted = processingStep > step.num;
                    const isCurrent = processingStep === step.num;
                    return (
                      <div
                        key={step.num}
                        className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                          isCompleted
                            ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-200'
                            : isCurrent
                            ? 'bg-slate-900 border-emerald-500 text-white ring-1 ring-emerald-500'
                            : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                              isCompleted
                                ? 'bg-emerald-600 text-slate-950 font-extrabold'
                                : isCurrent
                                ? 'bg-emerald-500 text-slate-950 animate-pulse font-extrabold'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isCompleted ? '✓' : step.num}
                          </span>
                          <div>
                            <div className="font-semibold text-xs text-slate-200">{step.name}</div>
                            <div className="text-[11px] text-slate-400">{step.desc}</div>
                          </div>
                        </div>

                        <div>
                          {isCompleted ? (
                            <span className="text-[10px] font-mono text-emerald-400 font-semibold">PASSED</span>
                          ) : isCurrent ? (
                            <span className="text-[10px] font-mono text-emerald-300 font-semibold animate-pulse">
                              EXECUTING...
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500">QUEUED</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
