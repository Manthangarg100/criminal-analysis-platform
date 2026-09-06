import React, { useState } from 'react';
import { CluventaLogo } from './CluventaLogo.tsx';
import {
  Shield,
  Lock,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  BadgeCheck,
  ChevronRight,
  LogIn,
} from 'lucide-react';
import { User } from '../types.ts';

interface LoginPageProps {
  availableUsers: User[];
  onLoginSuccess: (user: User) => void;
  onBackToLanding: () => void;
  initialRole?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  availableUsers,
  onLoginSuccess,
  onBackToLanding,
  initialRole,
}) => {
  // Find default selected user matching initialRole if passed, else first user
  const initialUser = availableUsers.find((u) => u.role === initialRole) || availableUsers[0];

  const [selectedUserId, setSelectedUserId] = useState<string>(initialUser ? initialUser.id : '');
  const [badgeInput, setBadgeInput] = useState<string>(initialUser ? initialUser.badgeNumber : '');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('842910');
  const [rememberSession, setRememberSession] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const selectedUser = availableUsers.find((u) => u.id === selectedUserId) || availableUsers[0];

  const handleSelectOfficer = (user: User) => {
    setSelectedUserId(user.id);
    setBadgeInput(user.badgeNumber);
    setAuthError(null);
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setAuthError('Please select or specify a valid officer account.');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    // Simulate cryptographic challenge-response auth with server
    setTimeout(() => {
      setIsAuthenticating(false);
      onLoginSuccess(selectedUser);
    }, 450);
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'investigator':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'analyst':
        return 'bg-sky-950/80 text-sky-300 border-sky-700/60';
      case 'supervisor':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'admin':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/60';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="cluventa-viewport justify-center items-center p-4 relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b20_1px,transparent_1px),linear-gradient(to_bottom,#18181b20_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Top Bar with Back Link */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6 z-10">
        <button
          onClick={onBackToLanding}
          className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>Back to Landing Page</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>NETWORK: SECURE INTRANET</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-2xl cluventa-surface-elevated p-6 sm:p-8 relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 border-b border-slate-800/80 pb-6">
          <div className="flex justify-center">
            <CluventaLogo size="lg" variant="full" glow={true} />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold pt-1">
            Officer Authentication Terminal
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Sign in with your law enforcement credentials to access case records and intelligence graphs.
          </p>
        </div>

        {/* Quick Officer Selector Grid */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            Select Operational Account:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableUsers.map((u) => {
              const isSelected = u.id === selectedUserId;
              return (
                <div
                  key={u.id}
                  onClick={() => handleSelectOfficer(u)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between text-left ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-500/80 shadow-md shadow-emerald-950/40'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>{u.name}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">{u.rank}</div>
                    <div className="text-[10px] font-mono text-slate-400">{u.badgeNumber}</div>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(
                      u.role
                    )}`}
                  >
                    {u.role}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleAuthenticate} className="space-y-4 pt-2">
          {authError && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Badge ID */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Badge / Officer ID</label>
              <input
                type="text"
                value={badgeInput}
                onChange={(e) => setBadgeInput(e.target.value)}
                placeholder="e.g. DL-INV-8821"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Department ID / Unit */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Assigned Unit</label>
              <input
                type="text"
                disabled
                value={selectedUser ? selectedUser.department : 'Special Cell & Crime Branch'}
                className="w-full bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2 text-xs text-slate-400 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Security PIN / Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security key"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-8 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* 2FA Token */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Gov 2FA Token / OTP</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="6-digit OTP"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Session details */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
              />
              <span>Remember station terminal</span>
            </label>
            <span className="text-[11px] font-mono text-slate-400">Encrypted AES-256</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-3 rounded-xl cluventa-btn cluventa-btn-primary font-bold text-sm shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
          >
            {isAuthenticating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Verifying Credentials & Audit Signatures...</span>
              </span>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-slate-950" />
                <span>Authenticate & Open Cluventa Workspace</span>
              </>
            )}
          </button>
        </form>

        {/* Legal Disclaimer */}
        <div className="border-t border-slate-800/80 pt-4 text-center">
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
            RESTRICTED GOVERNMENT CLOUD • UNAUTHORIZED ACCESS IS PENALIZED UNDER IT ACT 2000 & DPDP ACT 2023.
            ALL SESSIONS MONITORED VIA SECTION 65B EVIDENCE AUDIT PROTOCOL.
          </p>
        </div>
      </div>
    </div>
  );
};
