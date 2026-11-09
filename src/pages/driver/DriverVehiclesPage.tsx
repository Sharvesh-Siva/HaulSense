/**
 * HaulSense - Driver My Vehicles Workspace (/driver/vehicles)
 * Embodies the core architectural principle:
 * A Driver is NOT tied to one vehicle. The driver operates multiple assigned vehicles
 * across different corridors and trips.
 */

import React, { useState } from 'react';
import {
  Truck,
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  RotateCw,
  Wrench,
  Fuel,
  Gauge,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLogistics } from '../../context/LogisticsContext';
import { Vehicle } from '../../types';

export const DriverVehiclesPage: React.FC = () => {
  const { user } = useAuth();
  const { vehicles, drivers } = useLogistics();

  const currentDriver = drivers.find((d) => d.id === user?.driverId) || drivers[0];
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Group vehicles
  const currentAssigned = vehicles.find((v) => v.id === currentDriver.assignedVehicleId) || vehicles[0];
  const nextAssigned = vehicles.find((v) => v.id === currentDriver.nextAssignedVehicleId) || vehicles[1];
  const otherFleet = vehicles.filter(
    (v) => v.id !== currentAssigned.id && v.id !== nextAssigned.id
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-white font-heading">
            My Assigned Vehicles & Fleet Pool
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
            Multi-Vehicle Assignment Active
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          HaulSense models drivers operating specialized vehicles per corridor requirements, not static ownership.
        </p>
      </div>

      {/* Assignment Flow Banner (Current Assignment vs Next Assignment) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CURRENT ASSIGNMENT */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0F1E2E] to-[#0A1522] border-2 border-emerald-500/60 shadow-lg relative overflow-hidden">
          <div className="absolute top-3 right-3 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-[#070A0F] uppercase tracking-wider">
            Current Assignment
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">{currentAssigned.plateNumber}</h3>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                  {currentAssigned.vehicleType}
                </span>
              </div>
              <p className="text-xs text-emerald-400 font-medium">
                Assigned Trip: Chennai → Bengaluru (6.2T FMCG Haul)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#080D15] border border-slate-800/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Payload</span>
              <span className="font-mono font-bold text-white">{currentAssigned.capacityTons}T</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Body Type</span>
              <span className="font-medium text-slate-200">{currentAssigned.bodyType}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Health</span>
              <span className="font-mono font-bold text-emerald-400">{currentAssigned.health.overallScore}%</span>
            </div>
          </div>
        </div>

        {/* NEXT ASSIGNMENT */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#131628] to-[#0C0F1D] border border-indigo-700/60 shadow-lg relative overflow-hidden">
          <div className="absolute top-3 right-3 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 uppercase tracking-wider">
            Next Assignment
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-700 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">{nextAssigned.plateNumber}</h3>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                  {nextAssigned.vehicleType}
                </span>
              </div>
              <p className="text-xs text-indigo-300 font-medium">
                Scheduled Trip: Bengaluru → Hosur Feeder Haul
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#080D15] border border-slate-800/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Payload</span>
              <span className="font-mono font-bold text-white">{nextAssigned.capacityTons}T</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Body Type</span>
              <span className="font-medium text-slate-200">{nextAssigned.bodyType}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Health</span>
              <span className="font-mono font-bold text-indigo-300">{nextAssigned.health.overallScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ALL FLEET VEHICLES AVAILABLE TO DRIVER */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white font-heading">
          All Authorized Fleet Vehicles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const isCurrent = v.id === currentAssigned.id;
            const isNext = v.id === nextAssigned.id;
            const isMaint = v.status === 'in_maintenance';

            return (
              <div
                key={v.id}
                onClick={() => setSelectedVehicle(v)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-md ${
                  isCurrent
                    ? 'bg-[#0E1724] border-emerald-700/80 ring-1 ring-emerald-500/30'
                    : isNext
                    ? 'bg-[#101524] border-indigo-800/80'
                    : isMaint
                    ? 'bg-[#151114] border-red-900/60'
                    : 'bg-[#0E1522] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">{v.plateNumber}</span>
                      {isCurrent && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 uppercase">
                          Active
                        </span>
                      )}
                      {isNext && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500 text-white uppercase">
                          Next
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{v.vehicleType}</span>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isMaint
                        ? 'bg-red-950 text-red-400 border-red-800'
                        : v.status === 'available'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-blue-950 text-blue-400 border-blue-800'
                    }`}
                  >
                    {v.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-xs text-slate-400">
                  <div>
                    <span className="text-[10px] block">Capacity</span>
                    <span className="font-mono font-semibold text-slate-200">{v.capacityTons}T / {v.volumeCapacityM3}m³</span>
                  </div>
                  <div>
                    <span className="text-[10px] block">Body</span>
                    <span className="font-semibold text-slate-200 truncate block">{v.bodyType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block">Mileage</span>
                    <span className="font-mono font-semibold text-slate-200">{v.mileageKmPerLitre} km/L</span>
                  </div>
                </div>

                {/* Health & Docs */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-300">Health: <strong className="font-mono text-cyan-400">{v.health.overallScore}%</strong></span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Ins: {v.health.insuranceValidUntil}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VEHICLE TELEMETRY INSPECTION MODAL */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0D131F] border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-heading font-bold text-white text-base font-mono">
                  {selectedVehicle.plateNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedVehicle.vehicleType} • {selectedVehicle.bodyType}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#080C13] border border-slate-800">
                  <span className="text-[10px] text-slate-400">Payload Capacity</span>
                  <div className="font-bold text-white font-mono text-sm">{selectedVehicle.capacityTons} Tons</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080C13] border border-slate-800">
                  <span className="text-[10px] text-slate-400">Volumetric Capacity</span>
                  <div className="font-bold text-white font-mono text-sm">{selectedVehicle.volumeCapacityM3} m³</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] font-mono mb-2">
                  Mechanical Component Telemetry
                </h4>
                <div className="space-y-2">
                  {Object.entries({
                    Tyres: selectedVehicle.health.tyres,
                    Brakes: selectedVehicle.health.brakes,
                    Engine: selectedVehicle.health.engine,
                    Battery: selectedVehicle.health.battery,
                  }).map(([key, comp]) => (
                    <div
                      key={key}
                      className="p-2.5 rounded-xl bg-[#080C13] border border-slate-800/80 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-white">{key}</span>
                        <p className="text-[10px] text-slate-400">{comp.details}</p>
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          comp.status === 'good' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {comp.healthPercent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
