/**
 * HaulSense - Driver Graphical Telemetry & Earnings Dashboard
 * Visual charts demonstrating:
 * 1. Weekly Earnings & Incentive Trajectory Curve (Towards ₹50,000 monthly target)
 * 2. Roundtrip Backhaul Earnings Multiplier (One-Way vs Return Haul Secured)
 * 3. Real-time Fuel Efficiency & OBD-II Eco-Driving Meter (4.2 km/L vs 4.0 km/L target)
 * 4. Punctuality SLA & Trust Radar
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  IndianRupee,
  Gauge,
  Fuel,
  Sparkles,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { formatINR } from '../utils';

export const DriverGraphicalTelemetry: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState(3);

  const weeklyEarnings = [
    { week: 'Week 1', earnings: 10200, returnBonus: 3200, trips: 6, label: '01 - 07 Sep' },
    { week: 'Week 2', earnings: 12800, returnBonus: 5200, trips: 8, label: '08 - 14 Sep' },
    { week: 'Week 3', earnings: 11500, returnBonus: 4000, trips: 7, label: '15 - 21 Sep' },
    { week: 'Week 4 (Current)', earnings: 14100, returnBonus: 6000, trips: 7, label: '22 - 30 Sep' },
  ];

  const currentWeekData = weeklyEarnings[selectedWeek];

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white font-heading">
              Driver Graphical Telemetry & Earnings Trajectory
            </h2>
            <p className="text-xs text-slate-400">
              Corridor revenue progress, fuel efficiency telemetry, and return backhaul multipliers.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
          Sync: TN 38 AB 4521
        </span>
      </div>

      {/* GRAPHICAL ROW 1: WEEKLY EARNINGS BAR CHART & FUEL EFFICIENCY RADIAL GAUGE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CHART 1: 4-Week Earnings & Return Haul Trajectory (7 cols) */}
        <div className="lg:col-span-7 bg-[#0E1522] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-white text-sm">
                Weekly Earnings & Incentive Progression
              </h3>
              <p className="text-[11px] text-slate-400">
                Monthly Target: ₹50,000 • Current Total: <strong className="text-emerald-400">{formatINR(48600)}</strong>
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              97.2% of Goal Reached
            </span>
          </div>

          {/* Graphical Bars */}
          <div className="pt-4 grid grid-cols-4 gap-3 items-end h-44">
            {weeklyEarnings.map((item, idx) => {
              const isSelected = idx === selectedWeek;
              const maxScale = 16000;
              const heightPercent = Math.min(100, (item.earnings / maxScale) * 100);

              return (
                <div
                  key={item.week}
                  onClick={() => setSelectedWeek(idx)}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                >
                  <span className="text-[10px] font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {formatINR(item.earnings)}
                  </span>

                  <div className="w-full bg-slate-900 rounded-xl h-32 p-1 flex items-end">
                    <div
                      className={`w-full rounded-lg transition-all duration-500 relative overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-lg shadow-emerald-600/30'
                          : 'bg-gradient-to-t from-slate-700 to-slate-600 group-hover:from-emerald-700 group-hover:to-teal-600'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    >
                      {/* Return bonus stripe at top */}
                      <div
                        className="absolute top-0 left-0 right-0 h-2 bg-amber-400/80"
                        title={`Return bonus included: ${formatINR(item.returnBonus)}`}
                      />
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider text-center ${
                      isSelected ? 'text-emerald-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    W{idx + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Interactive Selected Week Detail */}
          <div className="p-3 rounded-xl bg-[#090D14] border border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-white">{currentWeekData.week} Breakdown:</span>
              <span className="text-slate-400 ml-2">
                {currentWeekData.trips} corridor runs • Return Haul Bonus: {formatINR(currentWeekData.returnBonus)}
              </span>
            </div>
            <span className="text-emerald-400 font-bold font-mono text-sm">
              {formatINR(currentWeekData.earnings)}
            </span>
          </div>
        </div>

        {/* CHART 2: Fuel Efficiency & OBD-II Eco-Driving Radial Meter (5 cols) */}
        <div className="lg:col-span-5 bg-[#0E1522] border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-heading font-bold text-white text-sm">
                Fuel Efficiency & Eco-Driving Telemetry
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                OBD-II Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live diesel consumption for assigned truck TN 38 AB 4521
            </p>
          </div>

          {/* Gauge Center */}
          <div className="flex items-center justify-center py-2">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#1E293B"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#gradient-fuel)"
                  strokeWidth="10"
                  strokeDasharray="210 251.2"
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gradient-fuel" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <Fuel className="w-4 h-4 text-emerald-400 mb-0.5" />
                <span className="text-2xl font-extrabold font-mono text-white">4.2</span>
                <span className="text-[9px] font-mono uppercase text-emerald-300 tracking-wider">
                  km / Litre
                </span>
              </div>
            </div>
          </div>

          {/* Benchmark comparison pills */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#090D14] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Fleet Benchmark</span>
              <span className="font-mono font-bold text-slate-300 text-sm">4.0 km/L</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#090D14] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Eco-Driving Bonus</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">+₹800 Earned</span>
            </div>
          </div>
        </div>
      </div>

      {/* GRAPHICAL ROW 2: ROUNDTRIP BACKHAUL PAY MULTIPLIER VISUAL */}
      <div className="bg-[#0E1522] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="font-heading font-bold text-white text-base">
                Roundtrip Backhaul Pay Multiplier (One-Way vs Return Haul R1)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizes how accepting the recommended return haul R1 quadruples driver trip earnings.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
            +312% Payout Boost
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Outbound Leg Only */}
          <div className="p-4 rounded-xl bg-[#090D14] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-400 font-bold uppercase text-[11px]">
                Option 1: Outbound Only Leg
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                Chennai → Bengaluru
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">₹2,500</div>
            <p className="text-slate-400 text-[11px]">
              Standard corridor allowance. Returns empty without revenue.
            </p>
            <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden">
              <div className="bg-slate-600 h-full w-[24%]" />
            </div>
          </div>

          {/* Roundtrip with Return Load R1 */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 to-teal-950/40 border-2 border-emerald-500 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-emerald-400 font-bold uppercase text-[11px]">
                Option 2: Outbound + Return Load R1
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded bg-emerald-500 text-slate-950">
                Recommended ✓
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ₹10,300 <span className="text-xs font-normal text-slate-300">(₹2,500 + ₹7,800)</span>
            </div>
            <p className="text-emerald-300 text-[11px]">
              Secures Bengaluru → Chennai FMCG backhaul on assigned truck TN 38 AB 4521.
            </p>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
