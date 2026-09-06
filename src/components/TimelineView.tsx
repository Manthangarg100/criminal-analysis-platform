/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { TimelineEvent, EventType, GraphNode } from '../types.ts';
import {
  Calendar,
  Clock,
  PhoneCall,
  DollarSign,
  Car,
  Users,
  ShieldAlert,
  FileText,
  Filter,
  ArrowRight,
  TrendingUp,
  MapPin,
} from 'lucide-react';

interface TimelineViewProps {
  events: TimelineEvent[];
  nodes: GraphNode[];
  onSelectEventEntity?: (nodeId: string) => void;
  onSelectDocument?: (docId: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  nodes,
  onSelectEventEntity,
  onSelectDocument,
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'PRE_INCIDENT' | 'POST_INCIDENT'>('ALL');
  const [searchEntity, setSearchEntity] = useState<string>('');

  // The critical FIR date for Operation Golden Falcon is 2025-10-12 / 14
  const incidentDate = '2025-10-12';

  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        if (selectedType !== 'ALL' && ev.eventType !== selectedType) return false;
        if (dateFilter === 'PRE_INCIDENT' && ev.timestamp >= incidentDate) return false;
        if (dateFilter === 'POST_INCIDENT' && ev.timestamp < incidentDate) return false;
        if (searchEntity.trim()) {
          const q = searchEntity.toLowerCase();
          const matchesTitle = ev.title.toLowerCase().includes(q);
          const matchesDesc = ev.description.toLowerCase().includes(q);
          const matchesEntities = ev.primaryEntities?.some((e) => e.toLowerCase().includes(q));
          if (!matchesTitle && !matchesDesc && !matchesEntities) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [events, selectedType, dateFilter, searchEntity]);

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'CALL':
        return <PhoneCall className="w-4 h-4 text-emerald-400" />;
      case 'TRANSACTION':
        return <DollarSign className="w-4 h-4 text-cyan-400" />;
      case 'SIGHTING':
        return <Car className="w-4 h-4 text-amber-400" />;
      case 'MEETING':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'RAID':
      case 'ARREST':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'FIR_FILED':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getEventBadgeColor = (type: EventType) => {
    switch (type) {
      case 'CALL':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'TRANSACTION':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      case 'SIGHTING':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'MEETING':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'RAID':
      case 'ARREST':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'FIR_FILED':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 shadow-sm">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Chronological Behavioral Timeline</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Temporal reconstruction of syndicate communication, financial transactions, and sightings.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pre / Post Incident Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                dateFilter === 'ALL'
                  ? 'bg-emerald-600 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Window
            </button>
            <button
              onClick={() => setDateFilter('PRE_INCIDENT')}
              title="Show preparation phase before seizure"
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                dateFilter === 'PRE_INCIDENT'
                  ? 'bg-amber-600 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pre-Seizure Prep
            </button>
            <button
              onClick={() => setDateFilter('POST_INCIDENT')}
              title="Show investigation and post-raid actions"
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                dateFilter === 'POST_INCIDENT'
                  ? 'bg-emerald-600 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Post-Raid & Arrest
            </button>
          </div>

          {/* Event Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Event Types</option>
            <option value="CALL">Calls & CDR Spikes</option>
            <option value="TRANSACTION">Banking Remittances</option>
            <option value="SIGHTING">ANPR Sightings</option>
            <option value="MEETING">Tower Co-Locations</option>
            <option value="RAID">Raids & Seizures</option>
            <option value="FIR_FILED">FIR Filings</option>
          </select>

          {/* Entity search */}
          <input
            type="text"
            value={searchEntity}
            onChange={(e) => setSearchEntity(e.target.value)}
            placeholder="Search entity in timeline..."
            className="bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-1.5 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Behavioral Surge Callout */}
      <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-200">
        <TrendingUp className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 font-mono uppercase tracking-wider">
            Detected Anomaly Spike:
          </span>{' '}
          A <strong>5.4x deviation</strong> in voice traffic between Burner MSISDN +91 98765 43210 and
          Mohd. Rafiq (+91 98112 34567) occurred between October 08 and October 12, culminating in the
          Airport Cargo Terminal hand-off.
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-6">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No events match the selected temporal or entity filter.
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="relative group">
              {/* Timeline Marker Dot */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center shadow-xs group-hover:border-emerald-400 transition-colors">
                {getEventIcon(event.eventType)}
              </div>

              {/* Event Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${getEventBadgeColor(
                        event.eventType
                      )}`}
                    >
                      {event.eventType}
                    </span>
                    <h4 className="text-sm font-bold text-white leading-tight">{event.title}</h4>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{event.timestamp}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{event.description}</p>

                {/* Meta details: Entities, Location, Value */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400">Involved:</span>
                    {(event.primaryEntities || []).map((ent, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-medium"
                      >
                        {ent}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-slate-400">
                    {event.location && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        <span>{event.location}</span>
                      </span>
                    )}

                    {event.amountOrFrequency && (
                      <span className="font-mono text-emerald-300 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        {event.amountOrFrequency}
                      </span>
                    )}

                    {onSelectDocument && (
                      <button
                        onClick={() => onSelectDocument(event.sourceDocumentId)}
                        className="text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>{event.sourceDocumentTitle}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
