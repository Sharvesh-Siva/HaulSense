/**
 * HaulSense - Return Load Opportunities Registry & Analytics
 * Modern Dark Operations Theme.
 */

import React from 'react';
import { ArrowLeftRight, Clock } from 'lucide-react';
import { RETURN_LOADS } from '../data/mockData';
import { formatDateTime, formatINR } from '../utils';

export const ReturnLoadsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white font-heading">
          Return Haul Opportunities (Analytics)
        </h1>
        <p className="text-xs text-slate-400">
          Open backhauls on key southern logistics corridors to eliminate empty return deadheads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {RETURN_LOADS.map((load) => (
          <div
            key={load.id}
            className="bg-[#121824] rounded-2xl border border-slate-800/90 p-5 shadow-sm transition-all hover:border-indigo-500/40 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="font-mono font-bold text-xs text-indigo-400">{load.id}</span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase ${
                    load.status === 'unconfirmed'
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                      : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                  }`}
                >
                  {load.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-white font-heading">
                <span>{load.origin}</span>
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{load.destination}</span>
              </div>

              <div className="mt-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Freight Tariff:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {formatINR(load.offeredFreight)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payload Weight:</span>
                  <span className="font-medium text-slate-200">{load.weightTons} tons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cargo Type:</span>
                  <span className="capitalize font-medium text-slate-200">{load.cargoType}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Corridor Distance:</span>
                  <span className="font-mono text-slate-300">{load.distanceKm} km</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Pickup: {formatDateTime(load.pickupTime)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
