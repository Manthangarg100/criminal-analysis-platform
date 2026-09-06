/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types.ts';
import { CluventaLogo } from './CluventaLogo.tsx';
import {
  Shield,
  Search,
  Sliders,
  FileText,
  Eye,
  ChevronDown,
  CheckCircle2,
  Compass,
  LogOut,
  Home,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  availableUsers: User[];
  activeView: 'dashboard' | 'cross_case' | 'gis' | 'supervisor' | 'admin';
  onChangeView: (view: 'dashboard' | 'cross_case' | 'gis' | 'supervisor' | 'admin') => void;
  onOpenNewCaseModal: () => void;
  onLogout?: () => void;
  onGoToLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSelectUser,
  availableUsers,
  activeView,
  onChangeView,
  onOpenNewCaseModal,
  onLogout,
  onGoToLanding,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'investigator':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60';
      case 'analyst':
        return 'bg-teal-950/70 text-teal-300 border-teal-700/60';
      case 'supervisor':
        return 'bg-amber-950/70 text-amber-300 border-amber-700/60';
      case 'admin':
        return 'bg-purple-950/70 text-purple-300 border-purple-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getRoleTitle = (role: UserRole) => {
    switch (role) {
      case 'investigator':
        return 'Investigating Officer (IO)';
      case 'analyst':
        return 'Intelligence Analyst';
      case 'supervisor':
        return 'Supervisor / ACP';
      case 'admin':
        return 'System Admin';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-black/95 border-b border-neutral-800 backdrop-blur-md text-slate-100 shadow-md">
      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => {
              if (onGoToLanding) {
                onGoToLanding();
              } else {
                onChangeView('dashboard');
              }
            }}
            className="flex items-center cursor-pointer group hover:opacity-90 transition-opacity"
            title="Go to Cluventa Home Page"
          >
            <CluventaLogo size="sm" variant="full" />
          </div>

          {/* Simple Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 ml-6 pl-6 border-l border-slate-800">
            {onGoToLanding && (
              <button
                onClick={onGoToLanding}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Return to Cluventa Landing & Home Page"
              >
                <Home className="w-4 h-4 text-emerald-400" />
                <span>Home</span>
              </button>
            )}

            <button
              onClick={() => onChangeView('dashboard')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeView === 'dashboard'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{currentUser.role === 'investigator' ? 'My Cases' : 'All Cases'}</span>
            </button>

            {(currentUser.role === 'analyst' || currentUser.role === 'supervisor' || currentUser.role === 'admin') && (
              <button
                onClick={() => onChangeView('cross_case')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  activeView === 'cross_case'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Network Analysis</span>
              </button>
            )}

            <button
              onClick={() => onChangeView('gis')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeView === 'gis'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>National GIS Map</span>
            </button>

            {(currentUser.role === 'supervisor' || currentUser.role === 'admin') && (
              <button
                onClick={() => onChangeView('supervisor')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeView === 'supervisor'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Supervisor Review</span>
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => onChangeView('admin')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeView === 'admin'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>System Logs & Settings</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right Section: Action button + Role Switcher */}
        <div className="flex items-center gap-2.5">
          {onGoToLanding && (
            <button
              onClick={onGoToLanding}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/40 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Return to Cluventa Home / Landing Page"
            >
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
          )}

          {currentUser.role === 'investigator' && (
            <button
              onClick={onOpenNewCaseModal}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-emerald-950 flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>+ New Case</span>
            </button>
          )}

          {/* User & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500/50 px-3 py-1.5 rounded-lg text-left transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono text-xs font-bold text-emerald-300">
                {currentUser.name.charAt(currentUser.name.indexOf(' ') + 1 || 0)}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-white leading-tight">
                  {currentUser.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${getRoleBadgeColor(
                      currentUser.role
                    )}`}
                  >
                    {getRoleTitle(currentUser.role)}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
            </button>

            {/* Dropdown Menu */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <div className="font-bold text-white">Switch User / Role</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select a role to test different police permissions:
                  </p>
                </div>

                <div className="space-y-1">
                  {availableUsers.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          setShowRoleMenu(false);
                          if (u.role === 'admin') onChangeView('admin');
                          else if (u.role === 'supervisor') onChangeView('supervisor');
                          else if (u.role === 'analyst') onChangeView('cross_case');
                          else onChangeView('dashboard');
                        }}
                        className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-start justify-between ${
                          isSelected
                            ? 'bg-emerald-950/60 border border-emerald-600/60 text-emerald-200 font-medium'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {u.badgeNumber} • {u.rank}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{u.department}</div>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border capitalize font-semibold ${getRoleBadgeColor(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* System Session Actions */}
                <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                  {onGoToLanding && (
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onGoToLanding();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2 text-xs transition-colors cursor-pointer"
                    >
                      <Home className="w-3.5 h-3.5 text-slate-400" />
                      <span>View Landing Page</span>
                    </button>
                  )}
                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 text-xs transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out / Lock Terminal</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
