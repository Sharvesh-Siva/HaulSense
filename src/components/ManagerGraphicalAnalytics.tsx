/**
 * HaulSense - Manager Graphical Operational Demonstrations & Analytics Dashboard
 * Visual charts demonstrating:
 * 1. Corridor Profit Margin & Freight Yield Bar Chart (with 20% Target & 10% Floor lines)
 * 2. Fleet Payload Capacity & Utilization Donut / Gauge
 * 3. Trip-Cycle Profit Multiplier (Outbound vs Empty Deadhead vs Return Haul Secured)
 * 4. Driver Reliability & SLA Distribution Quadrant
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { formatINR } from '../utils';

export const ManagerGraphicalAnalytics: React.FC = () => {
  const [selectedCorridorIndex, setSelectedCorridorIndex] = useState(0);

  const corridorData = [
    {
      id: 'S-GOLDEN',
      lane: 'Chennai → Bengaluru',
      freight: 25000,
      cost: 14480,
      profit: 10520,
      margin: 42.1,
      status: 'ACCEPT + SECURE RETURN',
      tagColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-800',
    },
    {
      id: 'S-CASE-A',
      lane: 'Chennai → Vellore',
      freight: 12000,
      cost: 7368,
      profit: 4632,
      margin: 38.6,
      status: 'ACCEPT',
      tagColor: 'text-indigo-400 bg-indigo-950/80 border-indigo-800',
    },
    {
      id: 'S-CASE-B',
      lane: 'Chennai → Bengaluru',
      freight: 17500,
      cost: 13400,
      profit: 4100,
      margin: 23.4,
      status: 'NEGOTIATE',
      tagColor: 'text-amber-400 bg-amber-950/80 border-amber-800',
    },
    {
      id: 'S-CASE-C',
      lane: 'Chennai → Madurai',
      freight: 18000,
      cost: 17240,
      profit: 760,
      margin: 4.2,
      status: 'REJECT',
      tagColor: 'text-red-400 bg-red-950/80 border-red-800',
    },
    {
      id: 'S-CASE-D',
      lane: 'Chennai → Hosur',
      freight: 21000,
      cost: 12285,
      profit: 8715,
      margin: 41.5,
      status: 'ACCEPT',
      tagColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-800',
    },
  ];

  const fleetCapacity = {
    totalTons: 47.0,
    committedTons: 29.7,
    utilizationPercent: 63.2,
    totalVehicles: 5,
    activeVehicles: 4,
    maintenanceVehicles: 1,
  };

  const selectedCorridor = corridorData[selectedCorridorIndex];

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white font-heading">
              Operational Decision Analytics & Yield Demonstration
            </h2>
            <p className="text-xs text-slate-400">
              Corridor profitability modeling, fleet utilization, and roundtrip cycle economics.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
          Updated Real-Time
        </span>
      </div>

      {/* GRAPHICAL ROW 1: CORRIDOR MARGIN BAR GRAPH & FLEET CAPACITY DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CHART 1: Corridor Profit Margin & Target Thresholds (7 cols) */}
        <div className="lg:col-span-7 bg-[#121824] border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-white text-sm">
                Corridor Profit Margin & Target Thresholds
              </h3>
              <p className="text-[11px] text-slate-400">
                Operating margin percentage vs 20% Target (Green) & 10% Floor (Red)
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Target 20%
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2.5 h-0.5 bg-red-400 inline-block" /> Floor 10%
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-4 space-y-3.5">
            {corridorData.map((item, idx) => {
              const isSelected = idx === selectedCorridorIndex;
              const barColor =
                item.margin >= 20
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
                  : item.margin >= 10
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500'
                  : 'bg-gradient-to-r from-red-600 to-red-500';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCorridorIndex(idx)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#182133] border-indigo-500/60 shadow-md ring-1 ring-indigo-500/20'
                      : 'bg-[#0A0F17]/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-[11px]">{item.id}</span>
                      <span className="text-slate-300 font-medium">{item.lane}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[11px]">
                        Net: {formatINR(item.profit)}
                      </span>
                      <span
                        className={`font-mono font-bold text-xs px-2 py-0.2 rounded ${
                          item.margin >= 20
                            ? 'text-emerald-400 bg-emerald-950/80'
                            : item.margin >= 10
                            ? 'text-amber-400 bg-amber-950/80'
                            : 'text-red-400 bg-red-950/80'
                        }`}
                      >
                        {item.margin}% Margin
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar with Target & Floor Marker Lines */}
                  <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(100, (item.margin / 50) * 100)}%` }}
                    />
                    {/* 20% Target Line at 40% position (relative to 50 max scale) */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-emerald-400/80 z-10"
                      style={{ left: '40%' }}
                      title="Target Margin 20%"
                    />
                    {/* 10% Floor Line at 20% position */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-400/80 z-10"
                      style={{ left: '20%' }}
                      title="Floor Margin 10%"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: Fleet Tonnage Capacity & Utilization Donut / Gauge (5 cols) */}
        <div className="lg:col-span-5 bg-[#121824] border border-slate-800/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-heading font-bold text-white text-sm">
                Fleet Payload Capacity Allocation
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800">
                OBD-II Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Active tonnage allocation across 5 corridor transport vehicles
            </p>
          </div>

          {/* Radial Donut Visualization */}
          <div className="flex items-center justify-center py-2">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* SVG Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#1E293B"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#gradient-fleet)"
                  strokeWidth="12"
                  strokeDasharray={`${fleetCapacity.utilizationPercent * 2.51} 251.2`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gradient-fleet" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Center Metrics */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold font-mono text-white">
                  {fleetCapacity.utilizationPercent}%
                </span>
                <span className="text-[9px] font-mono uppercase text-cyan-300 tracking-wider">
                  Committed
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown stat pills */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#090D14] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Committed Payload</span>
              <span className="font-mono font-bold text-white text-sm">
                {fleetCapacity.committedTons} / {fleetCapacity.totalTons} Tons
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#090D14] border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Fleet Headroom</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {(fleetCapacity.totalTons - fleetCapacity.committedTons).toFixed(1)} Tons Free
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* GRAPHICAL ROW 2: TRIP-CYCLE PROFIT MULTIPLIER DEMONSTRATION */}
      <div className="bg-[#121824] border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="font-heading font-bold text-white text-base">
                Trip-Cycle Profit Multiplier Demonstration (Roundtrip vs Deadhead)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizes how pairing Outbound Haul S-GOLDEN with Return Load R1 completely transforms profit economics.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
            +345% Net Profit Expansion
          </span>
        </div>

        {/* 3 Comparative Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Scenario 1: Outbound Only (One-Way) */}
          <div className="p-4 rounded-xl bg-[#090D14] border border-slate-800 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-slate-400 text-[11px] uppercase font-bold">
                  Scenario A: Outbound Only
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  One-Way Leg
                </span>
              </div>
              <h4 className="font-bold text-white text-sm">Chennai → Bengaluru (350 km)</h4>
              <p className="text-[11px] text-slate-400 mt-1">Truck stays stationed in Bengaluru</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-slate-400">
                <span>Gross Freight:</span>
                <span className="font-mono text-slate-200">₹25,000</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Operating Cost:</span>
                <span className="font-mono text-slate-200">₹14,480</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800/60">
                <span>Net Leg Profit:</span>
                <span className="font-mono">+₹10,520 (42.1%)</span>
              </div>
            </div>
          </div>

          {/* Scenario 2: Empty Return Deadhead */}
          <div className="p-4 rounded-xl bg-[#180E12] border border-red-900/60 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-red-400 text-[11px] uppercase font-bold">
                  Scenario B: Empty Deadhead
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800">
                  Value Destroyer
                </span>
              </div>
              <h4 className="font-bold text-white text-sm">Return Empty to Chennai</h4>
              <p className="text-[11px] text-red-300 mt-1">Consumes fuel and tolls with 0 revenue</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-red-900/40">
              <div className="flex justify-between text-slate-400">
                <span>Return Revenue:</span>
                <span className="font-mono text-slate-500">₹0</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Empty Return Fuel + Toll:</span>
                <span className="font-mono text-red-400">-₹7,680</span>
              </div>
              <div className="flex justify-between text-amber-300 font-bold pt-1 border-t border-red-900/40">
                <span>Diluted Cycle Profit:</span>
                <span className="font-mono">+₹2,840 (8.9%)</span>
              </div>
            </div>
          </div>

          {/* Scenario 3: Return Haul R1 Secured (The Winner) */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#0C1E18] to-[#0A1713] border-2 border-emerald-500 shadow-lg space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-emerald-400 text-[11px] uppercase font-bold">
                  Scenario C: HaulSense Paired
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950">
                  Recommended ✓
                </span>
              </div>
              <h4 className="font-bold text-white text-sm">Roundtrip (Chennai ↔ Bengaluru)</h4>
              <p className="text-[11px] text-emerald-300 mt-1">Outbound 6.2T FMCG + Return Load R1 6.0T</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-emerald-800/60">
              <div className="flex justify-between text-slate-300">
                <span>Total Cycle Freight:</span>
                <span className="font-mono text-white font-bold">₹41,000</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Cycle Costs:</span>
                <span className="font-mono text-slate-300">₹24,500</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-emerald-800/80">
                <span>Net Roundtrip Profit:</span>
                <span className="font-mono text-base text-emerald-300">+₹16,500 (40.2%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
