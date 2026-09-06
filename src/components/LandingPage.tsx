import React from 'react';
import { CluventaLogo } from './CluventaLogo.tsx';
import {
  Shield,
  Network,
  MapPin,
  FileText,
  Lock,
  ArrowRight,
  CheckCircle2,
  Users,
  Compass,
  Cpu,
  Layers,
  Scale,
  Sparkles,
  Eye,
  Database,
  Radio,
  ChevronRight,
  Building2,
  GitMerge,
  Route,
} from 'lucide-react';
import { User } from '../types.ts';

interface LandingPageProps {
  onGoToLogin: () => void;
  onQuickLoginAs?: (userRole: string) => void;
  availableUsers: User[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onQuickLoginAs,
  availableUsers,
}) => {
  return (
    <div className="cluventa-viewport">
      {/* Top Navigation */}
      <header className="cluventa-header-bar">
        <div className="cluventa-header-inner">
          <div className="flex items-center gap-3">
            <CluventaLogo size="sm" variant="full" />
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 px-1.5 py-0.5 rounded font-bold ml-1">
              v2.4 SECURE
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#capabilities" className="hover:text-emerald-400 transition-colors">
              Capabilities
            </a>
            <a href="#gis-transit" className="hover:text-emerald-400 transition-colors">
              GIS Corridors
            </a>
            <a href="#compliance" className="hover:text-emerald-400 transition-colors">
              DPDP & Legal Dossiers
            </a>
            <a href="#roles" className="hover:text-emerald-400 transition-colors">
              Department Roles
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onGoToLogin}
              className="cluventa-btn cluventa-btn-primary gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Access Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-800/60">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Evidence-Linked Crime Graph & Syndicate Tracking Platform</span>
            </div>

            {/* Featured Brand Logo Showcase */}
            <div className="py-2 flex justify-center">
              <CluventaLogo size="xl" variant="full" glow={true} className="scale-90 sm:scale-100" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Investigate syndicates with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
                explainable intelligence
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Cluventa synthesizes unstructured CDR phone records, hawala banking trails, tower sector
              dumps, and field observations into interactive criminal network graphs and geospatial
              transit corridors.
            </p>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onGoToLogin}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-emerald-950 flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Lock className="w-4 h-4 text-slate-950" />
                <span>Launch Officer Login</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>

              <a
                href="#capabilities"
                className="px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition-all flex items-center gap-2"
              >
                <span>Explore Capabilities</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {/* Quick Officer Role Fast-Track */}
            {availableUsers.length > 0 && (
              <div className="pt-6 border-t border-slate-800/80 mt-6">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
                  Or instant access via authorized demo roles:
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {availableUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => onQuickLoginAs && onQuickLoginAs(u.role)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/60 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>{u.name.split(' ')[0]}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({u.role})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section id="capabilities" className="py-16 bg-slate-900/40 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Core Intelligence Modules
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              From raw case documents to court-admissible dossiers
            </p>
            <p className="text-sm text-slate-400">
              Designed for law enforcement investigators, cyber analysts, and supervisory officers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/70 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
                <Network className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Dynamic Criminal Network Graph</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visual relationship mapping across suspects, hawala intermediaries, shell companies, and
                stolen vehicle supply lines. Color-coded confidence scores and cross-case bridge
                identification.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-900 font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Interactive node filtering & centrality</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Explainable AI inference citations</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-sky-950/70 border border-sky-600/40 flex items-center justify-center text-sky-400">
                <Route className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">GIS Transit Corridors & Linking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Trace criminal movement trajectories, model inter-state highway transit corridors, and link
                suspects directly across map coordinates with automated corridor surveillance buffer
                interception.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-900 font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Direct criminal-to-criminal linking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Cell tower coverage sector visualization</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-950/70 border border-purple-600/40 flex items-center justify-center text-purple-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Court-Ready Section 65B Dossiers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate exhaustive investigative prosecution dossiers complete with chain-of-custody
                logs, DPDP compliance masking, and cryptographically verified audit trails.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-900 font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Section 65B Indian Evidence Act compliant</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>One-click print & PDF dispatch bundle</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* GIS & Transit Corridor Spotlight */}
      <section id="gis-transit" className="py-16 border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-black via-neutral-950 to-black border border-neutral-800 rounded-3xl p-8 lg:p-12 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sky-950 text-sky-300 border border-sky-800 font-mono text-xs font-semibold">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Geospatial Intelligence Engine</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  Real-Time Highway Corridors & Criminal Route Analysis
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Analyze inter-state logistics between suspects. When two criminal entities are selected,
                  Cluventa calculates the driving road distance, commercial freight ETAs, and detects all
                  registered intelligence checkpoints falling within the surveillance buffer belt.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <div className="text-lg font-bold text-sky-400 font-mono">1,450+ km</div>
                    <div className="text-xs text-slate-400">Delhi-Mumbai Golden Quadrilateral Corridor</div>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <div className="text-lg font-bold text-emerald-400 font-mono">0.5 km – 50 km</div>
                    <div className="text-xs text-slate-400">Adjustable surveillance buffer belt</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <GitMerge className="w-3.5 h-3.5" />
                    <span>ACTIVE SYNDICATE LINK</span>
                  </span>
                  <span className="text-emerald-400">STATUS: VERIFIED</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Rafiq Merchant (Hawala Operative)</div>
                      <div className="text-[11px] text-slate-400 font-mono">Safehouse • Chandni Chowk</div>
                    </div>
                    <span className="text-rose-400 font-bold font-mono">POINT A</span>
                  </div>
                  <div className="text-center font-mono text-[10px] text-slate-500">
                    ▼ 1,418 km National Highway Corridor (NH 48 / NH 8) ▼
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Aslam Khan (Logistics Coordinator)</div>
                      <div className="text-[11px] text-slate-400 font-mono">Warehouse • Bhiwandi</div>
                    </div>
                    <span className="text-rose-400 font-bold font-mono">POINT B</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DPDP Compliance & Legal Standards */}
      <section id="compliance" className="py-16 bg-slate-900/30 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Legal Rigor & Integrity
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Strict DPDP Act Compliance & Section 65B Auditability
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <div className="font-bold text-white text-sm">DPDP Act 2023</div>
              <p className="text-xs text-slate-400">
                Automatic masking of citizen PII with mandatory justification and audit logging for unmasking.
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <Shield className="w-5 h-5 text-sky-400" />
              <div className="font-bold text-white text-sm">Chain of Custody</div>
              <p className="text-xs text-slate-400">
                Cryptographic hash verification for every uploaded document and evidence extraction.
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <Eye className="w-5 h-5 text-amber-400" />
              <div className="font-bold text-white text-sm">Immutable Audit Logs</div>
              <p className="text-xs text-slate-400">
                Every query, export, node review, and dossier generation is logged with timestamp and officer badge.
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              <div className="font-bold text-white text-sm">MHA Compliance</div>
              <p className="text-xs text-slate-400">
                Role-based access separating field investigators, intelligence analysts, and supervisory sign-offs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Workspaces */}
      <section id="roles" className="py-16 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Role-Based Access Control
            </h2>
            <p className="text-2xl font-bold text-white">Customized Operational Terminals</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                INVESTIGATOR
              </span>
              <h4 className="font-bold text-white text-sm">Field Case Officer</h4>
              <p className="text-xs text-slate-400">
                Ingest case documents, inspect extracted entities, verify AI graph linkages, and prepare charge sheet dossiers.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-bold">
                ANALYST
              </span>
              <h4 className="font-bold text-white text-sm">Pan-Network Analyst</h4>
              <p className="text-xs text-slate-400">
                Perform cross-case intelligence synthesis, detect syndicate bridging nodes, and analyze cell tower sector overlaps.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-bold">
                SUPERVISOR
              </span>
              <h4 className="font-bold text-white text-sm">Supervisory Reviewer</h4>
              <p className="text-xs text-slate-400">
                Review low-confidence AI inferences, approve warrants, sign off on unmasking requests, and monitor station KPIs.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold">
                ADMIN
              </span>
              <h4 className="font-bold text-white text-sm">DPO / System Admin</h4>
              <p className="text-xs text-slate-400">
                Inspect platform audit logs, export compliance reports, manage DPDP masking policies, and configure AI models.
              </p>
            </div>
          </div>
        </div>
      </section>
      </main>

      {/* Footer CTA */}
      <footer className="py-12 bg-black border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex justify-center">
            <CluventaLogo size="md" variant="full" />
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            RESTRICTED SYSTEM • FOR AUTHORIZED LAW ENFORCEMENT & INVESTIGATIVE AGENCY USE ONLY.
          </p>
          <div className="pt-2">
            <button
              onClick={onGoToLogin}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-950 cursor-pointer"
            >
              Sign In to CIPHER Workspace
            </button>
          </div>
          <p className="text-[11px] font-mono text-slate-400 pt-4">
            © 2026 CIPHER Intelligence Platform • MHA DPDP Act Compliant Architecture
          </p>
        </div>
      </footer>
    </div>
  );
};
