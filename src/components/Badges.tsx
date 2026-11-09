/**
 * HaulSense - Modern Dark Theme Badges & Chips
 * Matching deep navy and glowing neon indigo/teal palette.
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowLeftRight, RefreshCw, XCircle, Clock } from 'lucide-react';
import { ActionType, DriverSignal, RiskLevel, VehicleFitLabel } from '../types';

export const ActionBadge: React.FC<{ action: ActionType; className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  action,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1',
    md: 'text-xs px-3.5 py-1.5 gap-1.5 font-bold',
    lg: 'text-sm px-5 py-2.5 gap-2 font-extrabold',
  }[size];

  switch (action) {
    case 'ACCEPT':
      return (
        <span className={`inline-flex items-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-950/60 border border-emerald-400/30 ${sizeClasses} ${className}`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          ACCEPT
        </span>
      );

    case 'ACCEPT + SECURE RETURN LOAD':
      return (
        <span className={`inline-flex items-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/60 border border-emerald-400/40 ${sizeClasses} ${className}`}>
          <ArrowLeftRight className="w-4 h-4 shrink-0 text-amber-300" />
          ACCEPT + SECURE RETURN LOAD
        </span>
      );

    case 'NEGOTIATE':
      return (
        <span className={`inline-flex items-center rounded-xl bg-amber-500 text-navy-950 shadow-md shadow-amber-950/60 border border-amber-300/40 ${sizeClasses} ${className}`}>
          <RefreshCw className="w-4 h-4 shrink-0" />
          NEGOTIATE
        </span>
      );

    case 'REASSIGN':
      return (
        <span className={`inline-flex items-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-950/60 border border-indigo-400/30 ${sizeClasses} ${className}`}>
          <RefreshCw className="w-4 h-4 shrink-0" />
          REASSIGN
        </span>
      );

    case 'WAIT':
      return (
        <span className={`inline-flex items-center rounded-xl bg-slate-700 text-white shadow-md border border-slate-600 ${sizeClasses} ${className}`}>
          <Clock className="w-4 h-4 shrink-0" />
          WAIT
        </span>
      );

    case 'REJECT':
      return (
        <span className={`inline-flex items-center rounded-xl bg-red-600 text-white shadow-md shadow-red-950/60 border border-red-400/30 ${sizeClasses} ${className}`}>
          <XCircle className="w-4 h-4 shrink-0" />
          REJECT
        </span>
      );

    default:
      return null;
  }
};

export const RiskChip: React.FC<{ level: RiskLevel; score?: number; className?: string }> = ({
  level,
  score,
  className = '',
}) => {
  const styles = {
    LOW: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80',
    MEDIUM: 'bg-amber-950/70 text-amber-400 border-amber-800/80',
    HIGH: 'bg-red-950/70 text-red-400 border-red-800/80',
  }[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${styles} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          level === 'LOW' ? 'bg-emerald-400' : level === 'MEDIUM' ? 'bg-amber-400' : 'bg-red-400'
        }`}
      />
      {level} RISK {score !== undefined && `(${score} pts)`}
    </span>
  );
};

export const DriverSignalBadge: React.FC<{ signal: DriverSignal; className?: string }> = ({
  signal,
  className = '',
}) => {
  switch (signal) {
    case 'reliable':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/80 ${className}`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          RELIABLE
        </span>
      );
    case 'caution':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-semibold bg-amber-950/70 text-amber-400 border border-amber-800/80 ${className}`}>
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          CAUTION
        </span>
      );
    case 'unreliable':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-semibold bg-red-950/70 text-red-400 border border-red-800/80 ${className}`}>
          <XCircle className="w-3 h-3 text-red-400" />
          HIGH RISK
        </span>
      );
  }
};

export const VehicleFitBadge: React.FC<{ fit: VehicleFitLabel; className?: string }> = ({
  fit,
  className = '',
}) => {
  const styles: Record<VehicleFitLabel, string> = {
    ideal: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80',
    acceptable: 'bg-indigo-950/70 text-indigo-400 border-indigo-800/80',
    oversized: 'bg-slate-800/80 text-slate-300 border-slate-700',
    tight: 'bg-amber-950/70 text-amber-400 border-amber-800/80',
    unsuitable: 'bg-red-950/70 text-red-400 border-red-800/80',
  };

  const styleClass = styles[fit] || styles.acceptable;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border uppercase tracking-wider ${styleClass} ${className}`}>
      {fit}
    </span>
  );
};
