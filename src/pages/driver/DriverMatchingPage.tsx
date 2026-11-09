/**
 * HaulSense - Vehicle Matching & Mismatch Resolution Workspace (/driver/matching)
 * Implements Sections 14 & 15 of the Master Implementation Prompt:
 * 1. Confirms vehicle suitability (96% match, ✓ Capacity, ✓ Body, ✓ Cargo, ✓ Availability, ✓ Health)
 * 2. Visualizes ⚠ VEHICLE MISMATCH (e.g. 6.2T load with 1.5T Mini Truck) with UNSUITABLE alert
 * 3. Provides "Request Alternative Vehicle" and "Notify Manager" connected to Manager Workspace!
 */

import React, { useState } from 'react';
import {
  Sliders,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Send,
  Sparkles,
  RefreshCw,
  Layers,
  Check,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLogistics } from '../../context/LogisticsContext';
import { evaluateVehicleForLoad } from '../../tools/matchVehicle';
import { LoadRequirement, Vehicle } from '../../types';

export const DriverMatchingPage: React.FC = () => {
  const { user } = useAuth();
  const { shipments, vehicles, requestVehicleAlternative } = useLogistics();

  // Test scenarios
  const [selectedScenario, setSelectedScenario] = useState<'fit' | 'mismatch' | 'custom'>('fit');
  const [customShipmentId, setCustomShipmentId] = useState('S-GOLDEN');
  const [customVehicleId, setCustomVehicleId] = useState('V1');
  const [notifiedManager, setNotifiedManager] = useState(false);

  // 6.2T FMCG load requirements from prompt
  const fmcgLoadReq: LoadRequirement = {
    cargoType: 'fmcg',
    cargoWeightTons: 6.2,
    cargoVolumeM3: 22,
    requiredVehicleType: 'Medium Truck',
    requiredBodyType: 'Closed Container',
    temperatureRequirement: 'ambient',
    specialHandling: 'none',
  };

  // Suitable vehicle: TN 38 AB 4521 (Medium Truck, 7.5T Closed)
  const idealVehicle = vehicles.find((v) => v.plateNumber.includes('4521')) || vehicles[0];

  // Mismatched vehicle: TN 09 CX 7821 (Mini Truck, 1.5T Open)
  const mismatchedVehicle = vehicles.find((v) => v.plateNumber.includes('7821')) || vehicles[1];

  const currentShipment = shipments.find((s) => s.id === customShipmentId) || shipments[0];
  const customVehicle = vehicles.find((v) => v.id === customVehicleId) || vehicles[0];

  const activeVehicle =
    selectedScenario === 'fit'
      ? idealVehicle
      : selectedScenario === 'mismatch'
      ? mismatchedVehicle
      : customVehicle;

  const activeRequirements =
    selectedScenario === 'custom' ? currentShipment.requirements : fmcgLoadReq;

  // Run deterministic evaluation
  const matchResult = evaluateVehicleForLoad(activeVehicle, activeRequirements, 'Chennai');

  const handleNotifyManager = () => {
    requestVehicleAlternative(
      selectedScenario === 'custom' ? currentShipment.id : 'S-GOLDEN',
      activeVehicle.id,
      matchResult.mismatchReasons.join('; ') || 'Payload capacity violation'
    );
    setNotifiedManager(true);
    setTimeout(() => setNotifiedManager(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-white font-heading">
              Vehicle-to-Load Intelligence Matcher
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              Deterministic Verification
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            HaulSense audits payload capacity, body geometry, cargo compatibility, and fleet readiness.
          </p>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="inline-flex rounded-xl border border-slate-800 bg-[#0E1522] p-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedScenario('fit')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedScenario === 'fit'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✓ Compatible Match (96%)
          </button>
          <button
            type="button"
            onClick={() => setSelectedScenario('mismatch')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedScenario === 'mismatch'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚠ Vehicle Mismatch (12%)
          </button>
          <button
            type="button"
            onClick={() => setSelectedScenario('custom')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedScenario === 'custom'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Custom Matcher Lab
          </button>
        </div>
      </div>

      {/* Custom Lab Selectors if active */}
      {selectedScenario === 'custom' && (
        <div className="p-4 rounded-xl bg-[#0E1522] border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Select Shipment Manifest</label>
            <select
              value={customShipmentId}
              onChange={(e) => setCustomShipmentId(e.target.value)}
              className="w-full bg-[#080C13] border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
            >
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}: {s.title} ({s.weightTons}T {s.cargoType})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Select Fleet Vehicle to Test</label>
            <select
              value={customVehicleId}
              onChange={(e) => setCustomVehicleId(e.target.value)}
              className="w-full bg-[#080C13] border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} — {v.vehicleType} ({v.capacityTons}T Payload, {v.bodyType})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* TOP COMPARISON CARDS: LOAD REQUIREMENTS vs YOUR ASSIGNED VEHICLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box 1: Load Requirements */}
        <div className="p-5 rounded-2xl bg-[#0E1522] border border-slate-800 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Load Requirements Profile
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Corridor Manifest
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Cargo Classification:</span>
              <span className="font-bold text-white capitalize">{activeRequirements.cargoType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Cargo Weight:</span>
              <span className="font-mono font-bold text-white">{activeRequirements.cargoWeightTons} Tons</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Cargo Volume:</span>
              <span className="font-mono text-slate-200">{activeRequirements.cargoVolumeM3} m³</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Required Vehicle Type:</span>
              <span className="font-medium text-slate-200">{activeRequirements.requiredVehicleType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Required Body Type:</span>
              <span className="font-medium text-slate-200">{activeRequirements.requiredBodyType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Required Payload Floor:</span>
              <span className="font-mono font-bold text-amber-300">≥ {activeRequirements.cargoWeightTons} Tons</span>
            </div>
          </div>
        </div>

        {/* Box 2: Your Assigned Vehicle */}
        <div
          className={`p-5 rounded-2xl border space-y-3.5 shadow-sm transition-all ${
            matchResult.isSuitable
              ? 'bg-[#0E1B26] border-emerald-700/80'
              : 'bg-[#1D1217] border-red-800/80 ring-1 ring-red-500/20'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Truck className={`w-4 h-4 ${matchResult.isSuitable ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                Assigned Vehicle Audit
              </span>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                matchResult.isSuitable
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                  : 'bg-red-950 text-red-400 border-red-700'
              }`}
            >
              Match: {matchResult.matchScore}% ({matchResult.fitLabel.toUpperCase()})
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Vehicle Registration:</span>
              <span className="font-mono font-bold text-white text-sm">{activeVehicle.plateNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Vehicle Type & Body:</span>
              <span className="font-medium text-slate-200">
                {activeVehicle.vehicleType} • {activeVehicle.bodyType}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Rated Payload Capacity:</span>
              <span
                className={`font-mono font-bold ${
                  activeVehicle.capacityTons >= activeRequirements.cargoWeightTons
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {activeVehicle.capacityTons} Tons
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Hold Volume:</span>
              <span className="font-mono text-slate-200">{activeVehicle.volumeCapacityM3} m³</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Mechanical Health:</span>
              <span className="font-mono font-bold text-cyan-400">{activeVehicle.health.overallScore}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Fleet Status:</span>
              <span className="font-mono uppercase text-slate-300">{activeVehicle.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 15: VEHICLE MISMATCH ALERT & ALTERNATIVE SUGGESTION */}
      {!matchResult.isSuitable && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#210D12] via-[#2D1219] to-[#1C0B10] border-2 border-red-600 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-950 text-red-400 border border-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-red-200 font-heading">
                    ⚠ VEHICLE MISMATCH DETECTED
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-900/80 text-red-200 border border-red-600 uppercase">
                    UNSUITABLE
                  </span>
                </div>
                <p className="text-xs text-red-300/90 mt-0.5">
                  Assigned truck {activeVehicle.plateNumber} violates safety and structural load criteria.
                </p>
              </div>
            </div>

            {/* Notification to Manager Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNotifyManager}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Notify Fleet Manager</span>
              </button>
            </div>
          </div>

          {/* Mismatch breakdown bullet points */}
          <div className="p-3.5 rounded-xl bg-[#0F0507] border border-red-900/60 space-y-1.5 text-xs">
            <span className="text-[11px] font-mono text-red-400 font-bold uppercase tracking-wider block">
              Specific Violations:
            </span>
            {matchResult.mismatchReasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-red-200">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>

          {/* System Recommended Alternative Vehicle */}
          <div className="p-4 rounded-xl bg-[#121927] border border-emerald-600/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                    Recommended Alternative:
                  </span>
                  <span className="font-bold text-white font-mono">{idealVehicle.plateNumber}</span>
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800">
                    96% Match
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {idealVehicle.vehicleType} • {idealVehicle.capacityTons}T Payload • Closed Container • Available at Chennai Yard
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNotifyManager}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              <span>Request Swap to {idealVehicle.plateNumber}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {notifiedManager && (
            <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Vehicle mismatch ticket dispatched to Fleet Manager console in real-time!</span>
            </div>
          )}
        </div>
      )}

      {/* DETERMINISTIC CHECKLIST TABLE (10-FACTOR ENGINE AUDIT) */}
      <div className="bg-[#0E1522] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="font-heading font-bold text-white text-base">
              Deterministic 10-Factor Suitability Audit
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Score: <strong className="text-white font-bold">{matchResult.matchScore}/100</strong>
          </span>
        </div>

        <div className="divide-y divide-slate-800/80 text-xs">
          {matchResult.factors.map((factor, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {factor.pass ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div>
                  <span className="font-semibold text-white">{factor.name}</span>
                  <p className="text-[11px] text-slate-400">{factor.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-slate-400 text-[11px]">Weight: {factor.weight} pts</span>
                <span
                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                    factor.pass ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                  }`}
                >
                  +{factor.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
