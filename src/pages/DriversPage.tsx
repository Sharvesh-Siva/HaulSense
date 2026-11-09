/**
 * HaulSense - Drivers Trust Passport Directory
 * Modern Dark Operations Theme.
 */

import React from 'react';
import { Award, Phone } from 'lucide-react';
import { DRIVERS } from '../data/mockData';
import { evaluateDriverSignal } from '../tools/getTrustPassport';
import { DriverSignalBadge } from '../components/Badges';

export const DriversPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white font-heading">
          Driver Trust Passports & Requests
        </h1>
        <p className="text-xs text-slate-400">
          Carrier driver compliance registry, safety scores, and verified dispatch signals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {DRIVERS.map((driver) => {
          const signal = evaluateDriverSignal(driver);

          return (
            <div
              key={driver.id}
              className="bg-[#121824] rounded-2xl border border-slate-800/90 p-5 shadow-sm transition-all hover:border-indigo-500/40 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center text-sm shadow-xs font-mono">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white font-heading flex items-center gap-1.5">
                        {driver.name}
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                      </h3>
                      <span className="font-mono text-xs text-slate-400">{driver.id}</span>
                    </div>
                  </div>
                  <DriverSignalBadge signal={signal} />
                </div>

                <div className="my-4 p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Trust Rating</span>
                    <span className="text-xs text-slate-300 font-medium">
                      {driver.totalTripsCompleted} Hauls Executed
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-white leading-none">
                      {driver.reliabilityScore}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono font-semibold">/100 SCORE</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-500 block">On-Time</span>
                    <span className="font-bold font-mono text-slate-200">{driver.onTimePercentage}%</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-500 block">Cancel Rate</span>
                    <span className="font-bold font-mono text-slate-200">{driver.cancellationRatePercentage}%</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-500 block">Incidents</span>
                    <span
                      className={`font-bold font-mono ${
                        driver.incidentsCount === 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {driver.incidentsCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{driver.phone}</span>
                </span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase ${
                    driver.status === 'available'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                      : 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/80'
                  }`}
                >
                  {driver.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
