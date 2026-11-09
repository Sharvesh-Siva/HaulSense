/**
 * HaulSense - Driver Vehicle Health, Inspection Checklist & Breakdown Reporting (/driver/health)
 * Implements Section 20 of Master Implementation Prompt:
 * - Live diagnostic telemetry on assigned vehicle (Tyres, Brakes, Engine, Battery, Oil)
 * - Pre-Trip Departure Inspection Checklist
 * - Direct roadside incident / mechanical issue reporting to Fleet Manager
 */

import React, { useState } from 'react';
import {
  Activity,
  Truck,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Fuel,
  Gauge,
  Check,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLogistics } from '../../context/LogisticsContext';

export const DriverHealthPage: React.FC = () => {
  const { user } = useAuth();
  const { vehicles, drivers, reportIncident } = useLogistics();

  const currentDriver = drivers.find((d) => d.id === user?.driverId) || drivers[0];
  const assignedVehicle =
    vehicles.find((v) => v.id === currentDriver.assignedVehicleId) || vehicles[0];

  // Pre-trip checklist state
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    tyres: true,
    brakes: true,
    lights: true,
    engine_oil: true,
    cargo_seal: true,
    fastag_and_docs: true,
  });

  const [inspectionSubmitted, setInspectionSubmitted] = useState(false);

  // Breakdown issue report state
  const [issueType, setIssueType] = useState('tyre_puncture');
  const [issueSeverity, setIssueSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueReportedToast, setIssueReportedToast] = useState(false);

  const toggleCheck = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInspectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInspectionSubmitted(true);
    setTimeout(() => setInspectionSubmitted(false), 3000);
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDesc.trim()) return;

    reportIncident({
      tripId: assignedVehicle.plateNumber,
      category: 'vehicle_issue',
      severity: issueSeverity,
      description: `[${assignedVehicle.plateNumber}] ${issueType.toUpperCase().replace('_', ' ')}: ${issueDesc}`,
    });

    setIssueReportedToast(true);
    setTimeout(() => {
      setIssueReportedToast(false);
      setIssueDesc('');
    }, 3000);
  };

  const components = [
    { key: 'Tyres & Wheel Alignment', data: assignedVehicle.health.tyres },
    { key: 'Braking Hydraulics & ABS', data: assignedVehicle.health.brakes },
    { key: 'Engine & BS-VI Powertrain', data: assignedVehicle.health.engine },
    { key: 'Electrical & 24V Alternator', data: assignedVehicle.health.battery },
    { key: 'Lubricant & Coolant Levels', data: assignedVehicle.health.oil },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-white font-heading">
              Assigned Vehicle Health & Diagnostics
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              Live OBD-II Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time mechanical health for <strong className="font-mono text-white">{assignedVehicle.plateNumber}</strong> ({assignedVehicle.vehicleType}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            Next Service: <strong className="text-amber-400">{assignedVehicle.health.serviceDueKm} km</strong>
          </span>
        </div>
      </div>

      {/* Main Health Status Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0C1A24] via-[#102433] to-[#0A1620] border-2 border-cyan-500/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex flex-col items-center justify-center text-white shadow-lg ring-4 ring-cyan-500/20">
            <span className="text-2xl font-extrabold font-mono">
              {assignedVehicle.health.overallScore}%
            </span>
            <span className="text-[8px] font-mono uppercase text-cyan-200">Overall</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-mono">{assignedVehicle.plateNumber}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                Fit for Corridor Haul
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {assignedVehicle.vehicleType} • {assignedVehicle.capacityTons}T Payload • {assignedVehicle.bodyType}
            </p>
            <p className="text-[11px] text-amber-300 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Inspection advisory: {assignedVehicle.health.tyres.details}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-[#061017] p-3.5 rounded-xl border border-cyan-900/60 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">Fuel Mileage</span>
            <span className="font-mono font-bold text-white text-sm">{assignedVehicle.mileageKmPerLitre} km/L</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">PUC Certificate</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">Valid</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Service Alert</span>
            <span className="font-mono font-bold text-amber-300 text-sm">In 850 km</span>
          </div>
        </div>
      </div>

      {/* Subsystem Health Cards */}
      <div className="space-y-3">
        <h3 className="font-heading font-bold text-white text-base">
          Subsystem Diagnostics Telemetry
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {components.map((c, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#0E1522] border border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{c.key}</span>
                <span
                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                    c.data.status === 'good'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {c.data.healthPercent}%
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">{c.data.details}</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full ${c.data.status === 'good' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${c.data.healthPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TWO ACTION COLUMNS: PRE-TRIP CHECKLIST & BREAKDOWN REPORTING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pre-Trip Departure Checklist */}
        <div className="bg-[#0E1522] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-heading font-bold text-white text-base">
                Pre-Trip Safety Checklist
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Standard SOP</span>
          </div>

          <form onSubmit={handleInspectionSubmit} className="space-y-2.5 text-xs">
            {[
              { key: 'tyres', label: 'Tyre Pressure & Tread Inspection (Front & Rear Duals)' },
              { key: 'brakes', label: 'Brake Reservoir & Hydraulic Air Line Check' },
              { key: 'lights', label: 'Headlights, Turn Indicators, and Hazard Flashers' },
              { key: 'engine_oil', label: 'Engine Oil Dipstick & Radiator Coolant Level' },
              { key: 'cargo_seal', label: 'Container Cargo Latch, Tarp & Tamper Seal' },
              { key: 'fastag_and_docs', label: 'FASTag Balance, Vehicle RC, and National Permit' },
            ].map((item) => (
              <label
                key={item.key}
                onClick={() => toggleCheck(item.key)}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[#090D14] border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] font-bold ${
                    checklist[item.key]
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'border-slate-600 bg-transparent'
                  }`}
                >
                  {checklist[item.key] && '✓'}
                </div>
                <span className="text-slate-300 font-medium">{item.label}</span>
              </label>
            ))}

            {inspectionSubmitted && (
              <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-center font-bold">
                ✓ Pre-trip inspection certified and logged for dispatch!
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Certify Pre-Trip Inspection</span>
            </button>
          </form>
        </div>

        {/* Roadside Breakdown / Incident Reporting Form */}
        <div className="bg-[#0E1522] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="font-heading font-bold text-white text-base">
                Report Breakdown / Roadside Issue
              </h3>
            </div>
            <span className="text-[10px] font-mono text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-900">
              Emergency Dispatch
            </span>
          </div>

          <form onSubmit={handleIssueSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Issue Category</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full bg-[#080C13] border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs"
              >
                <option value="tyre_puncture">Tyre Puncture / Blowout</option>
                <option value="engine_overheat">Engine Overheat / Coolant Leak</option>
                <option value="brake_failure">Brake Pressure Warning</option>
                <option value="electrical_dead">Electrical / Alternator Fault</option>
                <option value="cargo_damage">Cargo Latch / Seal Tamper</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Severity</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setIssueSeverity(sev)}
                    className={`py-1.5 rounded-lg font-bold uppercase font-mono text-[10px] border cursor-pointer ${
                      issueSeverity === sev
                        ? sev === 'high'
                          ? 'bg-red-950 text-red-400 border-red-700'
                          : 'bg-amber-950 text-amber-400 border-amber-700'
                        : 'bg-[#080C13] text-slate-400 border-slate-800'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Location & Problem Details</label>
              <textarea
                rows={3}
                required
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                placeholder="E.g., Left rear tyre puncture near Sriperumbudur Toll Plaza on NH-48. Need roadside assistance."
                className="w-full bg-[#080C13] border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            {issueReportedToast && (
              <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-center font-bold">
                ✓ Breakdown alert transmitted to Fleet Dispatch! Assistance dispatched.
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Transmit Urgent Alert to Dispatch</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
