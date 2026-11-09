/**
 * HaulSense - Driver Load Opportunities & Return Trip Backhaul Marketplace (/driver/loads)
 * Implements Sections 16 & 17 of Master Implementation Prompt:
 * - Corridor Load discovery matched to vehicle capabilities
 * - Direct connection to Return Trip Opportunity Engine (e.g. R1 Bengaluru → Chennai, ₹7,800 driver share)
 * - Express Interest & Claim Backhaul actions connecting to Manager Workspace.
 */

import React, { useState } from 'react';
import {
  Layers,
  Truck,
  ArrowRight,
  IndianRupee,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  MapPin,
  Filter,
  Check,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLogistics } from '../../context/LogisticsContext';
import { formatINR } from '../../utils';
import { ReturnLoad } from '../../types';

export const DriverLoadsPage: React.FC = () => {
  const { user } = useAuth();
  const { returnLoads, vehicles, drivers, claimReturnLoad } = useLogistics();

  const currentDriver = drivers.find((d) => d.id === user?.driverId) || drivers[0];
  const assignedVehicle = vehicles.find((v) => v.id === currentDriver.assignedVehicleId) || vehicles[0];

  const [filterType, setFilterType] = useState<'all' | 'returns' | 'compatible'>('all');
  const [claimedToast, setClaimedToast] = useState<string | null>(null);

  const filteredLoads = returnLoads.filter((load) => {
    if (filterType === 'returns' && load.destination !== 'Chennai') return false;
    if (filterType === 'compatible' && load.weightTons > assignedVehicle.capacityTons) return false;
    return true;
  });

  const handleClaim = (load: ReturnLoad) => {
    claimReturnLoad(load.id, currentDriver.id);
    setClaimedToast(load.id);
    setTimeout(() => setClaimedToast(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-white font-heading">
              Corridor Load Opportunities
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              Live Backhaul Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified return freight matched against your vehicle ({assignedVehicle.plateNumber}, {assignedVehicle.capacityTons}T Payload).
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex rounded-xl border border-slate-800 bg-[#0E1522] p-1 text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Loads ({returnLoads.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('returns')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterType === 'returns'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chennai Backhauls
          </button>
          <button
            type="button"
            onClick={() => setFilterType('compatible')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterType === 'compatible'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            100% Compatible
          </button>
        </div>
      </div>

      {/* Featured Return Load Callout (Section 17: Bengaluru -> Chennai R1) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0C1B26] via-[#102738] to-[#0A1A28] border-2 border-emerald-500/70 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 uppercase tracking-wider">
                  Top Recommended Return Haul
                </span>
                <span className="text-xs text-slate-300 font-mono">Load ID: R1</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white font-heading mt-0.5">
                Bengaluru → Chennai Express FMCG Backhaul
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Driver Share Earnings</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{formatINR(7800)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#07111A] border border-emerald-900/60 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">Distance</span>
            <span className="font-mono font-bold text-white">350 km</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Payload</span>
            <span className="font-mono font-bold text-white">6.0T (FMCG)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Vehicle Compatibility</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Fits {assignedVehicle.plateNumber}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Trip-Cycle Benefit</span>
            <span className="font-mono font-bold text-amber-300 uppercase">High (+68% Cycle Profit)</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-300">
            Eliminates empty deadhead back to Chennai Central Depot.
          </span>
          <button
            type="button"
            onClick={() => handleClaim(returnLoads[0])}
            disabled={returnLoads[0].status === 'reserved'}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{returnLoads[0].status === 'reserved' ? 'Claimed ✓' : 'Claim Return Haul'}</span>
          </button>
        </div>
      </div>

      {claimedToast && (
        <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Return haul {claimedToast} successfully claimed! Dispatch schedule updated.</span>
        </div>
      )}

      {/* Grid of All Available Corridor Loads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLoads.map((load) => {
          const isCompatible = load.weightTons <= assignedVehicle.capacityTons;
          return (
            <div
              key={load.id}
              className="bg-[#0E1522] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">{load.id}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        load.status === 'reserved'
                          ? 'bg-blue-950 text-blue-400 border-blue-800'
                          : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      }`}
                    >
                      {load.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Driver Pay</span>
                    <span className="font-mono font-bold text-sm text-emerald-400">
                      {formatINR(load.driverShare)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{load.origin}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span>{load.destination}</span>
                    <span className="text-xs text-slate-400 font-mono">({load.distanceKm} km)</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Cargo: <strong className="text-slate-200 capitalize">{load.cargoType}</strong> ({load.weightTons} Tons)
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#090D14] border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Vehicle Compatibility:</span>
                    {isCompatible ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Compatible ({load.weightTons}T ≤ {assignedVehicle.capacityTons}T)
                      </span>
                    ) : (
                      <span className="text-red-400 font-medium">
                        Exceeds truck payload ({load.weightTons}T &gt; {assignedVehicle.capacityTons}T)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Pickup Window:</span>
                    <span className="font-mono text-slate-200">{load.pickupTime}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Offered Freight: {formatINR(load.offeredFreight)}
                </span>
                <button
                  type="button"
                  onClick={() => handleClaim(load)}
                  disabled={load.status === 'reserved' || !isCompatible}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{load.status === 'reserved' ? 'Reserved' : 'Express Interest'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
