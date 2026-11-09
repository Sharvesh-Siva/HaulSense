/**
 * HaulSense - Fleet Assets Roster
 * Modern Dark Operations Theme.
 */

import React from 'react';
import { Truck } from 'lucide-react';
import { VEHICLES } from '../data/mockData';

export const VehiclesPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white font-heading">
          Fleet Assets & Truck Roster
        </h1>
        <p className="text-xs text-slate-400">
          Carrier vehicles, payload capacity ratings, maintenance schedules, and assigned drivers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {VEHICLES.map((vehicle) => (
          <div
            key={vehicle.id}
            className="bg-[#121824] rounded-2xl border border-slate-800/90 p-5 shadow-sm transition-all hover:border-indigo-500/40"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white font-heading">{vehicle.id}</h3>
                  <span className="font-mono text-xs text-slate-400">{vehicle.plateNumber}</span>
                </div>
              </div>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase ${
                  vehicle.status === 'available'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                    : vehicle.status === 'in_maintenance'
                    ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                    : 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/80'
                }`}
              >
                {vehicle.status.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Payload Capacity:</span>
                <span className="font-bold text-white">{vehicle.capacityTons} Metric Tons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Benchmark Mileage:</span>
                <span className="font-mono text-slate-300">{vehicle.mileageKmPerLitre} km/L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Station:</span>
                <span className="text-slate-200">{vehicle.currentLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Driver:</span>
                <span className="font-mono font-semibold text-indigo-400">
                  {vehicle.driverId || 'None'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Supported Cargo
              </span>
              <div className="flex flex-wrap gap-1.5">
                {vehicle.supportedCargo.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#0B0F17] border border-slate-800 text-slate-300 capitalize font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
