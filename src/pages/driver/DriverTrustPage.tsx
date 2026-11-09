/**
 * HaulSense - Driver Trust Passport & Reliability Credential (/driver/trust)
 * Implements Section 19 of Master Implementation Prompt:
 * - Driver integrity score (92/100 - Platinum Reliable)
 * - Punctuality, Low Cancellation, Zero Incidents verification badges
 * - Telemetry & Shipper feedback ratings
 */

import React from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Star,
  Download,
  Share2,
  TrendingUp,
  UserCheck,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLogistics } from '../../context/LogisticsContext';

export const DriverTrustPage: React.FC = () => {
  const { user } = useAuth();
  const { drivers } = useLogistics();

  const currentDriver = drivers.find((d) => d.id === user?.driverId) || drivers[0];

  const badges = [
    {
      title: '96% On-Time Corridor Record',
      desc: 'Punctual arrival across 187 long-haul freight dispatches',
      icon: Clock,
      color: 'text-emerald-400 bg-emerald-950 border-emerald-800',
    },
    {
      title: 'Zero Safety Violations',
      desc: 'Clean driving record with no black marks or moving violations',
      icon: ShieldCheck,
      color: 'text-cyan-400 bg-cyan-950 border-cyan-800',
    },
    {
      title: 'Verified Commercial KYC',
      desc: 'Biometrics, Aadhaar, and Commercial HMV license verified',
      icon: UserCheck,
      color: 'text-indigo-400 bg-indigo-950 border-indigo-800',
    },
    {
      title: 'Ultra-Low Cancellation (<2%)',
      desc: 'Guaranteed load fulfillment with minimal turnaround friction',
      icon: Award,
      color: 'text-amber-400 bg-amber-950 border-amber-800',
    },
  ];

  const reviews = [
    {
      shipper: 'Hindustan Consumer Logistics',
      rating: 5,
      corridor: 'Chennai → Bengaluru',
      comment: 'Arrived at warehouse dock 15 mins ahead of schedule. Proper cargo tarping and gentle handling.',
      date: '24 Sep 2026',
    },
    {
      shipper: 'TVS Industrial Automotive',
      rating: 5,
      corridor: 'Chennai → Hosur',
      comment: 'Superb reliability. Maintained exact temperature logs and verified seal numbers without delays.',
      date: '18 Sep 2026',
    },
    {
      shipper: 'Reliance Retail Distribution',
      rating: 4.8,
      corridor: 'Bengaluru → Chennai',
      comment: 'Smooth return load fulfillment. Digital proof-of-delivery uploaded immediately.',
      date: '10 Sep 2026',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-white font-heading">
              Driver Trust Passport
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              Cryptographically Verified
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Your portable carrier integrity credential unlocking higher freight rates and premium corridor allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3.5 py-2 rounded-xl bg-[#0E1522] hover:bg-[#141F32] border border-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Certificate</span>
          </button>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0C1E26] via-[#102936] to-[#0A1A22] border-2 border-emerald-500/70 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Radial score badge */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex flex-col items-center justify-center text-white shadow-xl ring-4 ring-emerald-500/30">
            <span className="text-3xl font-extrabold font-mono tracking-tight">
              {currentDriver.reliabilityScore}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-200">
              / 100 Score
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-heading">{currentDriver.name}</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase">
                Tier: Platinum Carrier
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Commercial Driver ID: <strong className="font-mono text-white">{currentDriver.id}</strong> • Experience: {currentDriver.experienceYears} Years
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Background Verified
              </span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> {currentDriver.rating} Rating
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-[#07131A] p-3.5 rounded-xl border border-emerald-900/60 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">Total Trips</span>
            <span className="font-mono font-bold text-white text-base">{currentDriver.totalTripsCompleted}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">On-Time SLA</span>
            <span className="font-mono font-bold text-emerald-400 text-base">{currentDriver.onTimePercentage}%</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Cancellations</span>
            <span className="font-mono font-bold text-cyan-400 text-base">{currentDriver.cancellationRatePercentage}%</span>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-3">
        <h3 className="font-heading font-bold text-white text-base">
          Verified Driver Competency Badges
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#0E1522] border border-slate-800 space-y-2 text-xs flex flex-col justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${b.color}`}>
                  <b.icon className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-xs">{b.title}</h4>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{b.desc}</p>
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Audited by HaulSense
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shippers & Fleet Manager Reviews */}
      <div className="bg-[#0E1522] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-white text-base">
            Shipper & Dispatch Feedback
          </h3>
          <span className="text-xs font-mono text-slate-400">Average: 4.9 / 5.0</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reviews.map((r, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#090D14] border border-slate-800/80 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{r.shipper}</span>
                <div className="flex items-center text-amber-400 font-mono text-[11px]">
                  <span>★</span>
                  <span>{r.rating}</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">{r.corridor} • {r.date}</span>
              <p className="text-slate-300 text-[11px] italic leading-relaxed">
                "{r.comment}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
