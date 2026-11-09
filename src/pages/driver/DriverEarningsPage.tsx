/**
 * HaulSense - Driver Earnings Intelligence (/driver/earnings)
 * Implements Section 18 of Master Implementation Prompt:
 * - This Month's Net Driver Earnings: ₹48,600
 * - Metrics: Completed Trips, Average Trip Earnings, Return Load Bonus, Punctuality Incentives, Pending Settlement
 * - Complete Settlement Ledger
 * - Best Performing Corridors Analytics
 */

import React, { useState } from 'react';
import {
  IndianRupee,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Calendar,
  Award,
  Wallet,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLogistics } from '../../context/LogisticsContext';
import { formatINR } from '../../utils';

export const DriverEarningsPage: React.FC = () => {
  const { user } = useAuth();
  const { drivers } = useLogistics();

  const currentDriver = drivers.find((d) => d.id === user?.driverId) || drivers[0];
  const [downloadToast, setDownloadToast] = useState(false);

  const earningsHistory = [
    {
      tripId: 'TRIP-9041',
      route: 'Chennai → Bengaluru',
      date: '2026-09-28',
      basePay: 2500,
      returnBonus: 7800,
      incentive: 1200,
      total: 11500,
      status: 'settled',
    },
    {
      tripId: 'TRIP-8982',
      route: 'Chennai → Coimbatore',
      date: '2026-09-24',
      basePay: 4500,
      returnBonus: 3200,
      incentive: 800,
      total: 8500,
      status: 'settled',
    },
    {
      tripId: 'TRIP-8910',
      route: 'Bengaluru → Chennai',
      date: '2026-09-20',
      basePay: 2500,
      returnBonus: 7800,
      incentive: 0,
      total: 10300,
      status: 'settled',
    },
    {
      tripId: 'TRIP-8854',
      route: 'Chennai → Madurai',
      date: '2026-09-15',
      basePay: 3800,
      returnBonus: 5200,
      incentive: 1500,
      total: 10500,
      status: 'settled',
    },
    {
      tripId: 'TRIP-8801',
      route: 'Chennai → Vellore',
      date: '2026-09-10',
      basePay: 1200,
      returnBonus: 0,
      incentive: 400,
      total: 1600,
      status: 'settled',
    },
    {
      tripId: 'S-GOLDEN',
      route: 'Chennai → Bengaluru',
      date: 'Today (Active)',
      basePay: 2500,
      returnBonus: 0,
      incentive: 1200,
      total: 3700,
      status: 'pending',
    },
  ];

  const bestCorridors = [
    {
      corridor: 'Chennai → Bengaluru',
      tripsRun: 12,
      avgEarnings: 6200,
      totalEarned: 74400,
      punctuality: '98%',
    },
    {
      corridor: 'Chennai → Coimbatore',
      tripsRun: 8,
      avgEarnings: 8100,
      totalEarned: 64800,
      punctuality: '95%',
    },
    {
      corridor: 'Chennai → Madurai',
      tripsRun: 6,
      avgEarnings: 7400,
      totalEarned: 44400,
      punctuality: '93%',
    },
  ];

  const handleDownload = () => {
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white font-heading">
            Earnings & Settlement Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent pay statement, roundtrip backhaul bonuses, and corridor performance analytics.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="px-4 py-2 rounded-xl bg-[#0E1522] hover:bg-[#141F32] border border-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Download Tax Slip (PDF)</span>
        </button>
      </div>

      {downloadToast && (
        <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Driver Pay Slip for current settlement cycle downloaded successfully!</span>
        </div>
      )}

      {/* Main Month Earnings Big Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0C1E1B] via-[#0E2A23] to-[#0A1A18] border-2 border-emerald-500/70 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
            Total Driver Payout — This Month
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white mt-1">
            {formatINR(currentDriver.monthEarnings || 48600)}
          </div>
          <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Direct Deposit Account: HDFC Bank •••• 4091 (Verified KYC)</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#071311] p-3.5 rounded-xl border border-emerald-900/60 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">Completed Trips</span>
            <span className="font-mono font-bold text-white text-sm">28 Trips</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Return Haul Share</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{formatINR(18400)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Safety & SLA Bonus</span>
            <span className="font-mono font-bold text-amber-300 text-sm">{formatINR(3200)}</span>
          </div>
        </div>
      </div>

      {/* 4 Supporting Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0E1522] border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold block">Average Trip Pay</span>
          <div className="text-xl font-bold font-mono text-white mt-1">{formatINR(5850)}</div>
          <span className="text-[11px] text-emerald-400 mt-0.5 block">+14% vs fleet average</span>
        </div>

        <div className="bg-[#0E1522] border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold block">Return Haul Earnings</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{formatINR(18400)}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">From 6 closed backhauls</span>
        </div>

        <div className="bg-[#0E1522] border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold block">Pending Settlement</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{formatINR(7800)}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Disburses Friday 5:00 PM</span>
        </div>

        <div className="bg-[#0E1522] border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold block">Fuel Allowance Ratio</span>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">100% Covered</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Fleet fuel card active</span>
        </div>
      </div>

      {/* Best Performing Routes (Section 18) */}
      <div className="bg-[#0E1522] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="font-heading font-bold text-white text-base">
              Best Performing Corridors (High-Profit Routes)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Last 90 Days</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {bestCorridors.map((c, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#090D14] border border-slate-800/80 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between font-bold text-white text-sm">
                <span>{c.corridor}</span>
                <span className="font-mono text-emerald-400">{formatINR(c.avgEarnings)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Trips Completed:</span>
                <span className="font-mono text-slate-200">{c.tripsRun} runs</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Total Accumulated:</span>
                <span className="font-mono font-bold text-white">{formatINR(c.totalEarned)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>On-Time SLA:</span>
                <span className="font-mono text-emerald-400 font-bold">{c.punctuality}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings History Table */}
      <div className="bg-[#0E1522] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-heading font-bold text-white text-base">
          Recent Corridor Settlement Ledger
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090D14] text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Trip ID</th>
                <th className="p-3">Corridor Route</th>
                <th className="p-3">Date</th>
                <th className="p-3">Base Pay</th>
                <th className="p-3">Return Bonus</th>
                <th className="p-3">Incentive</th>
                <th className="p-3 font-bold text-right">Total Net</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {earningsHistory.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-white">{item.tripId}</td>
                  <td className="p-3 font-medium text-slate-300">{item.route}</td>
                  <td className="p-3 font-mono text-slate-400">{item.date}</td>
                  <td className="p-3 font-mono text-slate-300">{formatINR(item.basePay)}</td>
                  <td className="p-3 font-mono text-emerald-400 font-semibold">
                    {item.returnBonus > 0 ? `+${formatINR(item.returnBonus)}` : '—'}
                  </td>
                  <td className="p-3 font-mono text-amber-300">
                    {item.incentive > 0 ? `+${formatINR(item.incentive)}` : '—'}
                  </td>
                  <td className="p-3 font-mono font-bold text-white text-right">
                    {formatINR(item.total)}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        item.status === 'settled'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border-amber-800'
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
