/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, PriorityLevel } from '../types.ts';
import { FileText, Plus, X, Shield } from 'lucide-react';

interface NewCaseModalProps {
  currentUser: User;
  onClose: () => void;
  onCreateCase: (caseData: {
    firNumber: string;
    title: string;
    description: string;
    policeStation: string;
    assignedOfficer: string;
    sectionsBNS: string[];
    priority: PriorityLevel;
  }) => Promise<void>;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({
  currentUser,
  onClose,
  onCreateCase,
}) => {
  const [firNumber, setFirNumber] = useState(`FIR No. ${Math.floor(100 + Math.random() * 900)}/2025`);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [policeStation, setPoliceStation] = useState('Special Cell (Lodhi Colony)');
  const [assignedOfficer, setAssignedOfficer] = useState(currentUser.name);
  const [sectionsBNS, setSectionsBNS] = useState('BNS 111 (Organized Crime), BNS 318 (Cheating), BNS 61 (Criminal Conspiracy)');
  const [priority, setPriority] = useState<PriorityLevel>('HIGH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const sections = sectionsBNS
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await onCreateCase({
        firNumber,
        title: title.trim(),
        description: description.trim(),
        policeStation,
        assignedOfficer,
        sectionsBNS: sections,
        priority,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-200 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Register New Criminal Case</h3>
              <p className="text-xs text-slate-400">Initialize official case graph & audit container.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">FIR / Crime Number</label>
              <input
                type="text"
                required
                value={firNumber}
                onChange={(e) => setFirNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Police Station / Unit</label>
              <input
                type="text"
                required
                value={policeStation}
                onChange={(e) => setPoliceStation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Case Title / Syndicate Codename</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Operation Hawk — North Delhi Luxury Car Theft Ring"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Case Summary / Initial Allegations</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the alleged criminal syndicate activity..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 leading-relaxed custom-scrollbar"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Assigned Investigating Officer</label>
              <input
                type="text"
                required
                value={assignedOfficer}
                onChange={(e) => setAssignedOfficer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Priority Classification</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="CRITICAL">CRITICAL (Anti-Terror / Gang War)</option>
                <option value="HIGH">HIGH (Major Hawala / Narcotics)</option>
                <option value="MEDIUM">MEDIUM (Organized Property Theft)</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Applicable Acts & Sections (Comma separated)</label>
            <input
              type="text"
              value={sectionsBNS}
              onChange={(e) => setSectionsBNS(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Register Case Container'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
