/**
 * HaulSense - Driver Operations Overview Dashboard (/driver)
 * Highlights Current Trip lifecycle, Today's Earnings, Assigned Vehicle Health,
 * Next Scheduled Assignment (demonstrating multiple vehicle operations), and Return Opportunities.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  IndianRupee,
  Navigation,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  ShieldCheck,
  Activity,
  Calendar,
  Compass,
  ChevronRight,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLogistics } from '../../context/LogisticsContext';
import { formatDateTime, formatINR } from '../../utils';
import { TripLifecycleStatus } from '../../types';
import { DriverGraphicalTelemetry } from '../../components/DriverGraphicalTelemetry';
import { HistoricalEtaForecastChart } from '../../components/HistoricalEtaForecastChart';
import { CorridorMap } from '../../components/CorridorMap';

export const DriverOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const { shipments, vehicles, drivers, returnLoads, updateTripLifecycle, updateDriverAvailability } =
    useLogistics();
  const navigate = useNavigate();

  const currentDriver = drivers.find((d) => d.id === user?.driverId) || drivers[0];
  const activeShipment =
    shipments.find((s) => s.assignedDriverId === currentDriver.id && s.status !== 'delivered') ||
    shipments.find((s) => s.id === 'S-GOLDEN') ||
    shipments[0];

  const assignedVehicle =
    vehicles.find((v) => v.id === activeShipment?.assignedVehicleId) ||
    vehicles.find((v) => v.id === currentDriver.assignedVehicleId) ||
    vehicles[0];

  const nextVehicle =
    vehicles.find((v) => v.id === currentDriver.nextAssignedVehicleId) || vehicles[1];

  const recommendedReturn = returnLoads.find((r) => r.origin === activeShipment?.destination) || returnLoads[0];

  const lifecycleSteps: { key: TripLifecycleStatus; label: string }[] = [
    { key: 'assigned', label: 'Assigned' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'heading_to_pickup', label: 'To Pickup' },
    { key: 'arrived_at_pickup', label: 'At Pickup' },
    { key: 'goods_collected', label: 'Loaded' },
    { key: 'heading_to_delivery', label: 'In Transit' },
    { key: 'arrived_at_delivery', label: 'At Delivery' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'completed', label: 'Completed' },
  ];

  const rawStatus = activeShipment?.lifecycleStatus || 'assigned';
  const normalizedStatus: TripLifecycleStatus =
    rawStatus === 'pickup'
      ? 'arrived_at_pickup'
      : rawStatus === 'in_transit'
      ? 'heading_to_delivery'
      : rawStatus;

  const currentStepIndex = Math.max(
    0,
    lifecycleSteps.findIndex((s) => s.key === normalizedStatus)
  );

  const handleAdvanceLifecycle = () => {
    if (!activeShipment) return;
    if (currentStepIndex < lifecycleSteps.length - 1) {
      const nextStep = lifecycleSteps[currentStepIndex + 1].key;
      updateTripLifecycle(activeShipment.id, nextStep, currentDriver.name, 'driver');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0E1624] via-[#101C2F] to-[#0A1322] p-5 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold font-mono text-xl shadow-lg ring-2 ring-emerald-500/20">
            {currentDriver.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-white font-heading">
                Vanakkam, {currentDriver.name}
              </h1>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                Verified Fleet Driver
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Corridor Hub: Chennai Central Yard • License: TN-09-2019-HMV • Trust Passport: <strong className="text-emerald-400">{currentDriver.reliabilityScore}/100</strong>
            </p>
          </div>
        </div>

        {/* Quick Driver Action shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/driver/trip-map/${activeShipment?.id || 'S-GOLDEN'}`)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open Trip Map & Share GPS</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/driver/matching')}
            className="px-3.5 py-2 rounded-xl bg-[#141F32] hover:bg-[#1B2942] border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verify Truck Match</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/driver/loads')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Claim Return Haul</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Today's Trip Earnings */}
        <div className="bg-[#0E1522] border border-slate-800 p-4 rounded-xl shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Today's Earnings</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {formatINR(7800)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span>+₹1,200 On-Time Bonus eligible</span>
          </div>
        </div>

        {/* Card 2: Driver Availability State */}
        <div className="bg-[#0E1522] border border-slate-800 p-4 rounded-xl shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Fleet Availability</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-sm sm:text-base font-bold text-white capitalize font-mono">
            {currentDriver.status.replace('_', ' ')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Ready for dispatch
          </div>
        </div>

        {/* Card 3: Assigned Vehicle Health */}
        <div className="bg-[#0E1522] border border-slate-800 p-4 rounded-xl shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Assigned Truck Health</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400">
            {assignedVehicle.health.overallScore}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
            {assignedVehicle.plateNumber} ({assignedVehicle.vehicleType})
          </div>
        </div>

        {/* Card 4: Trust Score */}
        <div className="bg-[#0E1522] border border-slate-800 p-4 rounded-xl shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Trust Passport</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
            {currentDriver.reliabilityScore}/100
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Top 5% Carrier Reliability
          </div>
        </div>
      </div>

      {/* SECTION: ACTIVE TRIP & LIFECYCLE PROGRESS */}
      {activeShipment && (
        <div className="bg-[#0E1522] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase tracking-wider">
                  Active Dispatch Corridor
                </span>
                <span className="text-xs text-slate-400 font-mono">Trip ID: {activeShipment.id}</span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white font-heading">
                {activeShipment.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Driver Pay</span>
                <span className="text-base font-bold font-mono text-emerald-400">{formatINR(activeShipment.driverCost || 2500)}</span>
              </div>
              <button
                type="button"
                onClick={handleAdvanceLifecycle}
                disabled={currentStepIndex >= lifecycleSteps.length - 1}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>
                  {currentStepIndex < lifecycleSteps.length - 1
                    ? `Advance → ${lifecycleSteps[currentStepIndex + 1].label}`
                    : 'Trip Completed ✓'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stepper progress bar */}
          <div className="py-2">
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
              {lifecycleSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono mb-1.5 transition-all ${
                        isCurrent
                          ? 'bg-emerald-500 text-[#070A0F] ring-4 ring-emerald-500/20 shadow-md'
                          : isPassed
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : 'bg-[#151D2A] text-slate-500 border border-slate-800'
                      }`}
                    >
                      {isPassed && !isCurrent ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${
                        isCurrent
                          ? 'text-emerald-400 font-bold'
                          : isPassed
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{
                  width: `${((currentStepIndex + 1) / lifecycleSteps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Trip Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Column 1: Route & Timing */}
            <div className="p-3.5 rounded-xl bg-[#090D14] border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">
                Route & Schedule
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Corridor</span>
                <span className="font-bold text-white">{activeShipment.origin} → {activeShipment.destination}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Distance</span>
                <span className="font-mono text-slate-200">{activeShipment.distanceKm} km</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Pickup Deadline</span>
                <span className="font-mono text-amber-300">{formatDateTime(activeShipment.departureTime)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Delivery Deadline</span>
                <span className="font-mono text-emerald-400">{formatDateTime(activeShipment.deliveryDeadline)}</span>
              </div>
            </div>

            {/* Column 2: Cargo & Requirements */}
            <div className="p-3.5 rounded-xl bg-[#090D14] border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">
                Cargo Requirements
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Cargo Type</span>
                <span className="font-bold text-white capitalize">{activeShipment.cargoType}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Cargo Weight</span>
                <span className="font-mono text-slate-200">{activeShipment.weightTons} Tons</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Cargo Volume</span>
                <span className="font-mono text-slate-200">{activeShipment.requirements?.cargoVolumeM3 || 22} m³</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Required Body</span>
                <span className="text-indigo-300 font-semibold">{activeShipment.requirements?.requiredBodyType || 'Closed Container'}</span>
              </div>
            </div>

            {/* Column 3: Assigned Vehicle Confirmation */}
            <div className="p-3.5 rounded-xl bg-[#090D14] border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Assigned Vehicle
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                  96% Match ✓
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Truck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-white text-sm font-mono">{assignedVehicle.plateNumber}</h4>
                  <p className="text-[11px] text-slate-400">{assignedVehicle.vehicleType} • {assignedVehicle.capacityTons}T Payload</p>
                </div>
              </div>
              <div className="pt-1 text-[11px] text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Payload fits comfortably (82.7% utilization)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE GOOGLE MAPS CORRIDOR NAVIGATION & BACKHAUL RADAR */}
      <CorridorMap role="driver" defaultShipmentId={activeShipment?.id || 'S-GOLDEN'} />

      {/* HISTORICAL TRIP PERFORMANCE VS CURRENT JOURNEY ETA FORECASTING */}
      <HistoricalEtaForecastChart
        role="driver"
        defaultShipmentId={activeShipment?.id || 'S-GOLDEN'}
      />

      {/* GRAPHICAL DASHBOARD: TELEMETRY & EARNINGS PROGRESSION */}
      <DriverGraphicalTelemetry />

      {/* SECTION: TWO-COLUMN CARDS: NEXT ASSIGNMENT & RETURN LOAD OPPORTUNITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Next Scheduled Assignment (Vehicle B tomorrow concept) */}
        <div className="bg-[#0E1522] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <h3 className="font-heading font-bold text-white text-sm sm:text-base">
                Next Scheduled Assignment
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800">
              Tomorrow 09:00 AM
            </span>
          </div>

          <p className="text-xs text-slate-400">
            You will operate an alternative fleet vehicle for your next scheduled corridor leg:
          </p>

          <div className="p-4 rounded-xl bg-[#090D14] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-300 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white font-mono text-sm">{nextVehicle.plateNumber}</h4>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                    {nextVehicle.vehicleType}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Scheduled Route: Bengaluru → Hosur Corridor ({nextVehicle.capacityTons}T Payload)
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400 block">{formatINR(3200)}</span>
              <span className="text-[10px] text-slate-500 font-mono">Confirmed</span>
            </div>
          </div>
        </div>

        {/* Return Load Opportunity Card (Section 17 of Prompt) */}
        <div className="bg-[#0E1522] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="font-heading font-bold text-white text-sm sm:text-base">
                Return Haul Opportunity
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              High Trip-Cycle Benefit
            </span>
          </div>

          <p className="text-xs text-slate-400">
            System identified a return load matching your destination ({activeShipment?.destination}):
          </p>

          <div className="p-4 rounded-xl bg-[#090D14] border border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white font-mono text-sm">{recommendedReturn.id}</span>
                <span className="text-xs text-slate-300">
                  {recommendedReturn.origin} → {recommendedReturn.destination}
                </span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800">
                  Vehicle Compatible ✓
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Cargo: {recommendedReturn.cargoType.toUpperCase()} ({recommendedReturn.weightTons}T) • Distance: {recommendedReturn.distanceKm} km
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Driver Share</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  +{formatINR(recommendedReturn.driverShare)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/driver/loads')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer whitespace-nowrap"
              >
                View & Claim
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
