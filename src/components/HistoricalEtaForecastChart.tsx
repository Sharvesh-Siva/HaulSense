/**
 * HaulSense - Historical Trip Performance vs. Current Journey Metrics & ETA Forecasting
 * Built with Recharts to compare 30-day historical corridor baselines (P50 / P90 elapsed time,
 * segment velocity, and fuel burn) against real-time vehicle GPS telemetry, route deviations,
 * fuel anomalies, and traffic delays for high-precision arrival time forecasting.
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Fuel,
  Gauge,
  Navigation,
  ShieldCheck,
  Zap,
  Activity,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { CorridorCheckpointMetric } from '../types';

interface HistoricalEtaForecastChartProps {
  defaultShipmentId?: string;
  role?: 'manager' | 'driver';
}

const CORRIDOR_WAYPOINT_TEMPLATES: Record<
  string,
  Array<{
    checkpoint: string;
    distanceKm: number;
    histMinutes: number;
    p90Minutes: number;
    histSpeed: number;
    histFuelL: number;
  }>
> = {
  'S-GOLDEN': [
    { checkpoint: 'Chennai Bay 4', distanceKm: 0, histMinutes: 0, p90Minutes: 0, histSpeed: 48, histFuelL: 0 },
    { checkpoint: 'Sriperumbudur Toll', distanceKm: 42, histMinutes: 52, p90Minutes: 68, histSpeed: 50, histFuelL: 10.2 },
    { checkpoint: 'Kanchipuram Bypass', distanceKm: 78, histMinutes: 94, p90Minutes: 115, histSpeed: 56, histFuelL: 18.8 },
    { checkpoint: 'Vellore NH-48 Hub', distanceKm: 142, histMinutes: 162, p90Minutes: 192, histSpeed: 60, histFuelL: 34.0 },
    { checkpoint: 'Ambur Grade', distanceKm: 195, histMinutes: 218, p90Minutes: 254, histSpeed: 58, histFuelL: 46.8 },
    { checkpoint: 'Krishnagiri Plaza', distanceKm: 258, histMinutes: 284, p90Minutes: 326, histSpeed: 61, histFuelL: 61.5 },
    { checkpoint: 'Hosur SIPCOT Border', distanceKm: 312, histMinutes: 342, p90Minutes: 392, histSpeed: 52, histFuelL: 74.8 },
    { checkpoint: 'Bengaluru Peenya', distanceKm: 350, histMinutes: 385, p90Minutes: 440, histSpeed: 46, histFuelL: 84.0 },
  ],
  'S-CASE-A': [
    { checkpoint: 'Ambattur Gate 2', distanceKm: 0, histMinutes: 0, p90Minutes: 0, histSpeed: 45, histFuelL: 0 },
    { checkpoint: 'Poonamallee Check', distanceKm: 24, histMinutes: 34, p90Minutes: 46, histSpeed: 46, histFuelL: 6.1 },
    { checkpoint: 'Sriperumbudur Hub', distanceKm: 48, histMinutes: 62, p90Minutes: 80, histSpeed: 54, histFuelL: 12.0 },
    { checkpoint: 'Walajapet Toll', distanceKm: 105, histMinutes: 124, p90Minutes: 148, histSpeed: 58, histFuelL: 25.8 },
    { checkpoint: 'Ranipet / Vellore', distanceKm: 140, histMinutes: 165, p90Minutes: 195, histSpeed: 55, histFuelL: 34.5 },
  ],
  'S-CASE-B': [
    { checkpoint: 'Chennai Hub', distanceKm: 0, histMinutes: 0, p90Minutes: 0, histSpeed: 48, histFuelL: 0 },
    { checkpoint: 'Chengalpattu Toll', distanceKm: 62, histMinutes: 74, p90Minutes: 92, histSpeed: 54, histFuelL: 16.2 },
    { checkpoint: 'Tindivanam NH-38', distanceKm: 128, histMinutes: 148, p90Minutes: 176, histSpeed: 56, histFuelL: 33.5 },
    { checkpoint: 'Villupuram Junction', distanceKm: 168, histMinutes: 195, p90Minutes: 228, histSpeed: 55, histFuelL: 44.0 },
    { checkpoint: 'Trichy Bypass', distanceKm: 332, histMinutes: 372, p90Minutes: 425, histSpeed: 58, histFuelL: 86.5 },
    { checkpoint: 'Madurai Ring Rd', distanceKm: 460, histMinutes: 515, p90Minutes: 580, histSpeed: 54, histFuelL: 120.2 },
  ],
  'S-CASE-D': [
    { checkpoint: 'Oragadam SEZ', distanceKm: 0, histMinutes: 0, p90Minutes: 0, histSpeed: 50, histFuelL: 0 },
    { checkpoint: 'Kanchipuram NH-48', distanceKm: 45, histMinutes: 54, p90Minutes: 68, histSpeed: 55, histFuelL: 11.2 },
    { checkpoint: 'Vellore Checkpost', distanceKm: 118, histMinutes: 134, p90Minutes: 162, histSpeed: 58, histFuelL: 28.5 },
    { checkpoint: 'Krishnagiri Hub', distanceKm: 235, histMinutes: 258, p90Minutes: 298, histSpeed: 60, histFuelL: 56.4 },
    { checkpoint: 'Hosur Checkpost', distanceKm: 298, histMinutes: 328, p90Minutes: 382, histSpeed: 48, histFuelL: 72.0 },
    { checkpoint: 'Electronic City BLR', distanceKm: 340, histMinutes: 376, p90Minutes: 435, histSpeed: 44, histFuelL: 82.5 },
  ],
};

export const HistoricalEtaForecastChart: React.FC<HistoricalEtaForecastChartProps> = ({
  defaultShipmentId = 'S-GOLDEN',
  role = 'manager',
}) => {
  const {
    shipments,
    vehicles,
    fleetTelemetry,
    reportTripDelay,
    reportFuelAnomaly,
    reportRouteDeviation,
  } = useLogistics();

  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(defaultShipmentId);
  const [activeChartTab, setActiveChartTab] = useState<'eta_curve' | 'velocity_fuel' | 'sla_window'>(
    'eta_curve'
  );
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const selectedShipment = useMemo(
    () => shipments.find((s) => s.id === selectedShipmentId) || shipments[0],
    [shipments, selectedShipmentId]
  );

  const assignedVehicle = useMemo(
    () =>
      vehicles.find((v) => v.id === selectedShipment?.assignedVehicleId) || vehicles[0],
    [vehicles, selectedShipment]
  );

  const liveTelemetry = useMemo(
    () =>
      fleetTelemetry[assignedVehicle?.id] ||
      Object.values(fleetTelemetry).find((t) => t.shipmentId === selectedShipment?.id) ||
      fleetTelemetry.V1,
    [fleetTelemetry, assignedVehicle, selectedShipment]
  );

  // Build dynamic checkpoint metrics combining 30-day historical baseline + live vehicle telemetry
  const {
    checkpointMetrics,
    slaDeadlineMinutes,
    historicalTotalMinutes,
    forecastedTotalMinutes,
    etaVarianceMinutes,
    liveAvgSpeedKmh,
    historicalAvgSpeedKmh,
    fuelVariancePct,
    slaConfidenceScore,
    projectedEtaFormatted,
  } = useMemo(() => {
    const totalDist = selectedShipment?.distanceKm || 350;
    const remainingKm =
      liveTelemetry && liveTelemetry.shipmentId === selectedShipment?.id
        ? Math.min(totalDist, Math.max(0, liveTelemetry.remainingDistanceKm))
        : Math.round(totalDist * 0.42);
    const completedKm = Math.max(0, totalDist - remainingKm);

    const template = CORRIDOR_WAYPOINT_TEMPLATES[selectedShipment?.id] || [
      { checkpoint: `${selectedShipment?.origin || 'Origin'} Hub`, distanceKm: 0, histMinutes: 0, p90Minutes: 0, histSpeed: 50, histFuelL: 0 },
      { checkpoint: 'Corridor Toll 1', distanceKm: Math.round(totalDist * 0.25), histMinutes: Math.round(totalDist * 0.28), p90Minutes: Math.round(totalDist * 0.34), histSpeed: 55, histFuelL: Math.round(totalDist * 0.06) },
      { checkpoint: 'Midway Checkpost', distanceKm: Math.round(totalDist * 0.55), histMinutes: Math.round(totalDist * 0.62), p90Minutes: Math.round(totalDist * 0.74), histSpeed: 58, histFuelL: Math.round(totalDist * 0.13) },
      { checkpoint: 'Border Plaza', distanceKm: Math.round(totalDist * 0.82), histMinutes: Math.round(totalDist * 0.92), p90Minutes: Math.round(totalDist * 1.08), histSpeed: 52, histFuelL: Math.round(totalDist * 0.19) },
      { checkpoint: `${selectedShipment?.destination || 'Dest'} Dock`, distanceKm: totalDist, histMinutes: Math.round(totalDist * 1.12), p90Minutes: Math.round(totalDist * 1.28), histSpeed: 48, histFuelL: Math.round(totalDist * 0.24) },
    ];

    const delayPenaltyMin =
      (liveTelemetry?.delayMinutes || 0) +
      (liveTelemetry?.routeDeviationDetected ? 24 : 0) +
      (selectedShipment?.id === 'S-GOLDEN' ? 6 : 0);

    const liveSpeed =
      liveTelemetry?.speedKmh && liveTelemetry.speedKmh > 0 ? liveTelemetry.speedKmh : 60;
    const speedFactor = Math.max(0.72, Math.min(1.35, 56 / Math.max(25, liveSpeed)));

    const fuelSpikeFactor = liveTelemetry?.fuelAnomalyDetected
      ? 1 + (liveTelemetry.fuelVariancePercent || 16.8) / 100
      : 1.03;

    const metrics: CorridorCheckpointMetric[] = template.map((pt, index) => {
      const ratio = totalDist > 0 ? pt.distanceKm / totalDist : index / Math.max(1, template.length - 1);
      const isCompleted = pt.distanceKm <= completedKm;
      const isCurrent =
        !isCompleted &&
        (index === 0 || template[index - 1].distanceKm <= completedKm);

      const proportionalDelay = Math.round(delayPenaltyMin * ratio);
      const forecastedMin =
        index === 0
          ? 0
          : Math.round(pt.histMinutes * speedFactor + proportionalDelay);

      const currentActualMin =
        isCompleted || isCurrent ? forecastedMin : null;

      const segLiveSpeed =
        index === 0
          ? pt.histSpeed
          : isCompleted || isCurrent
          ? Math.max(22, Math.round(liveSpeed + (index % 2 === 0 ? 3 : -2)))
          : Math.round((liveSpeed + pt.histSpeed) / 2);

      const currentFuel =
        Math.round(pt.histFuelL * fuelSpikeFactor * 10) / 10;

      return {
        checkpoint: pt.checkpoint,
        distanceKm: pt.distanceKm,
        historicalAvgElapsedMin: pt.histMinutes,
        historicalP90ElapsedMin: pt.p90Minutes,
        currentJourneyElapsedMin: currentActualMin,
        forecastedElapsedMin: forecastedMin,
        historicalAvgSpeedKmh: pt.histSpeed,
        currentSpeedKmh: segLiveSpeed,
        historicalFuelBurnLitres: pt.histFuelL,
        currentFuelBurnLitres: currentFuel,
        status: isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming',
        anomalyNote:
          liveTelemetry?.routeDeviationDetected && isCurrent
            ? 'Route Deviation (+24m)'
            : liveTelemetry?.fuelAnomalyDetected && isCurrent
            ? `Fuel Spike (+${(liveTelemetry.fuelVariancePercent || 16.8).toFixed(1)}%)`
            : undefined,
      };
    });

    const lastPt = metrics[metrics.length - 1];
    const histTotal = lastPt?.historicalAvgElapsedMin || 385;
    const forecastTotal = lastPt?.forecastedElapsedMin || 379;
    const slaLimit = Math.round(histTotal * 1.14); // 14% SLA buffer above 30-day average
    const variance = forecastTotal - histTotal;

    const avgHistSpeed = Math.round(
      metrics.reduce((acc, m) => acc + m.historicalAvgSpeedKmh, 0) / metrics.length
    );

    const fuelVar = liveTelemetry?.fuelAnomalyDetected
      ? liveTelemetry.fuelVariancePercent || 16.8
      : 2.4;

    const bufferToSla = slaLimit - forecastTotal;
    const confidence = Math.max(
      42,
      Math.min(99, Math.round(88 + bufferToSla * 0.35 - (liveTelemetry?.routeDeviationDetected ? 18 : 0)))
    );

    const remainingMinutes = Math.max(15, Math.round((forecastTotal * remainingKm) / Math.max(1, totalDist)));
    const projectedDate = new Date(Date.now() + remainingMinutes * 60000);
    const etaFormatted = projectedDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      checkpointMetrics: metrics,
      slaDeadlineMinutes: slaLimit,
      historicalTotalMinutes: histTotal,
      forecastedTotalMinutes: forecastTotal,
      etaVarianceMinutes: variance,
      liveAvgSpeedKmh: liveSpeed,
      historicalAvgSpeedKmh: avgHistSpeed,
      fuelVariancePct: fuelVar,
      slaConfidenceScore: confidence,
      projectedEtaFormatted: etaFormatted,
    };
  }, [selectedShipment, liveTelemetry]);

  // Arrival Window Probability Distribution (Tab 3)
  const slaDistributionData = useMemo(() => {
    const base = historicalTotalMinutes;
    const curr = forecastedTotalMinutes;
    const points = [-45, -30, -15, 0, 15, 30, 45, 60];
    return points.map((offset) => {
      const elapsedMark = base + offset;
      const histDist = Math.round(
        Math.exp(-Math.pow(offset / 24, 2)) * 100
      );
      const currOffset = elapsedMark - curr;
      const currentForecastProb = Math.round(
        Math.exp(-Math.pow(currOffset / 18, 2)) * 100
      );
      return {
        windowLabel: `${Math.floor(elapsedMark / 60)}h ${elapsedMark % 60}m`,
        elapsedMinutes: elapsedMark,
        historicalProbability: histDist,
        currentJourneyProbability: currentForecastProb,
      };
    });
  }, [historicalTotalMinutes, forecastedTotalMinutes]);

  const handleQuickSimulateAlert = (type: 'delay' | 'fuel' | 'deviation') => {
    const sId = selectedShipment?.id || 'S-GOLDEN';
    const vId = assignedVehicle?.id || 'V1';

    if (type === 'delay') {
      reportTripDelay(
        sId,
        vId,
        25,
        'Heavy commercial truck congestion reported at highway toll plaza'
      );
      setActionFeedback('Dispatched +25m Transit Delay Alert & recalculated ETA forecast curve.');
    } else if (type === 'fuel') {
      reportFuelAnomaly(sId, vId, 18.5);
      setActionFeedback('Dispatched +18.5% Fuel Burn Anomaly Alert to Manager & Driver consoles.');
    } else {
      reportRouteDeviation(sId, vId, 2150, 'NH-48 Industrial Bypass Interchange');
      setActionFeedback('Dispatched 2.15 km Route Deviation Alert & updated ETA trajectory.');
    }

    setTimeout(() => setActionFeedback(null), 4000);
  };

  return (
    <div className="bg-[#0E1522] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Top Header & Shipment Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/50 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base md:text-lg font-extrabold text-white font-heading tracking-tight">
                Historical Trip Performance vs. Live Journey ETA Forecasting
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/70 uppercase">
                Recharts Telemetry Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Benchmarks 30-day corridor P50/P90 elapsed times, velocity & fuel burn against live vehicle telemetry for predictive arrival forecasting
            </p>
          </div>
        </div>

        {/* Corridor Shipment Selector & View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedShipment?.id || 'S-GOLDEN'}
            onChange={(e) => setSelectedShipmentId(e.target.value)}
            aria-label="Select corridor shipment for ETA forecast"
            className="bg-[#090D16] border border-slate-700 text-slate-200 text-xs font-mono font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {shipments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}: {s.origin} → {s.destination} ({s.assignedVehicleId || 'V1'})
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-xl bg-[#090D16] border border-slate-800 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveChartTab('eta_curve')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeChartTab === 'eta_curve'
                  ? 'bg-cyan-600 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ETA Forecast Curve
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('velocity_fuel')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeChartTab === 'velocity_fuel'
                  ? 'bg-cyan-600 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Speed & Fuel Burn
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('sla_window')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeChartTab === 'sla_window'
                  ? 'bg-cyan-600 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SLA Probability
            </button>
          </div>
        </div>
      </div>

      {/* 4 Forecasting KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Projected ETA & Baseline Variance */}
        <div className="bg-[#090E17] border border-slate-800/90 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase mb-1">
            <span>Forecasted Arrival (ETA)</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold font-mono text-white">
              {projectedEtaFormatted}
            </span>
            <span
              className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                etaVarianceMinutes <= 0
                  ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/60'
                  : etaVarianceMinutes <= 18
                  ? 'bg-amber-950/90 text-amber-400 border border-amber-800/60'
                  : 'bg-red-950/90 text-red-400 border border-red-800/60'
              }`}
            >
              {etaVarianceMinutes <= 0
                ? `${etaVarianceMinutes}m Ahead`
                : `+${etaVarianceMinutes}m vs Hist`}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 font-mono">
            Forecast: {Math.floor(forecastedTotalMinutes / 60)}h {forecastedTotalMinutes % 60}m • Hist P50:{' '}
            {Math.floor(historicalTotalMinutes / 60)}h {historicalTotalMinutes % 60}m
          </div>
        </div>

        {/* Card 2: Current Velocity vs 30-Day Historical Average */}
        <div className="bg-[#090E17] border border-slate-800/90 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase mb-1">
            <span>Corridor Velocity</span>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold font-mono text-emerald-400">
              {liveAvgSpeedKmh} km/h
            </span>
            <span className="text-xs text-slate-400 font-mono">
              vs {historicalAvgSpeedKmh} km/h Hist
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            Vehicle: <span className="text-slate-200 font-mono font-semibold">{assignedVehicle?.plateNumber}</span> •{' '}
            {liveTelemetry?.isLiveDeviceGps ? 'Live Smartphone GPS' : 'Corridor Telemetry'}
          </div>
        </div>

        {/* Card 3: Fuel Efficiency & Anomaly Status */}
        <div className="bg-[#090E17] border border-slate-800/90 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase mb-1">
            <span>Fuel Burn vs Baseline</span>
            <Fuel
              className={`w-4 h-4 ${
                liveTelemetry?.fuelAnomalyDetected ? 'text-amber-400' : 'text-indigo-400'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-extrabold font-mono ${
                liveTelemetry?.fuelAnomalyDetected ? 'text-amber-400' : 'text-white'
              }`}
            >
              {liveTelemetry?.fuelAnomalyDetected
                ? `+${fuelVariancePct.toFixed(1)}% Spike`
                : `${assignedVehicle?.mileageKmPerLitre || 4.2} km/L`}
            </span>
            <span className="text-xs font-mono text-slate-400">
              ({checkpointMetrics[checkpointMetrics.length - 1]?.currentFuelBurnLitres}L proj)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            {liveTelemetry?.fuelAnomalyDetected
              ? '⚠ CAN-bus fuel burn above corridor threshold'
              : '✓ Within 30-day corridor fuel band'}
          </div>
        </div>

        {/* Card 4: On-Time SLA Confidence */}
        <div className="bg-[#090E17] border border-slate-800/90 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase mb-1">
            <span>SLA Arrival Confidence</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-extrabold font-mono ${
                slaConfidenceScore >= 85
                  ? 'text-cyan-400'
                  : slaConfidenceScore >= 70
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {slaConfidenceScore}%
            </span>
            <span className="text-xs font-mono text-slate-400">
              Buffer: {Math.max(0, slaDeadlineMinutes - forecastedTotalMinutes)}m
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            SLA Ceiling: {Math.floor(slaDeadlineMinutes / 60)}h {slaDeadlineMinutes % 60}m max transit
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="bg-[#090D16] border border-slate-800/90 rounded-2xl p-4">
        {activeChartTab === 'eta_curve' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Cumulative Elapsed Time (Mins) Across Corridor Checkpoints — Historical P50/P90 vs. Current Journey Forecast
                </h3>
                <p className="text-[11px] text-slate-400">
                  Solid emerald line shows completed journey checkpoints; cyan curve projects remaining arrival trajectory based on live GPS speed & delays
                </p>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-lg shrink-0">
                Remaining: {liveTelemetry?.remainingDistanceKm ?? 195} km
              </span>
            </div>

            <div className="w-full h-72 min-w-0" style={{ height: 290 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ComposedChart
                  data={checkpointMetrics}
                  margin={{ top: 12, right: 24, left: 4, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="histBaselineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="checkpoint"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    unit="m"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D131F',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: any, name: any) => [
                      value !== null && value !== undefined ? `${value} mins` : 'Upcoming Checkpoint',
                      String(name || ''),
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <ReferenceLine
                    y={slaDeadlineMinutes}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{
                      value: `Consignee SLA Limit (${slaDeadlineMinutes}m)`,
                      fill: '#f87171',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="historicalAvgElapsedMin"
                    name="30-Day Historical Avg (P50)"
                    fill="url(#histBaselineGrad)"
                    stroke="#6366f1"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="historicalP90ElapsedMin"
                    name="Historical Congestion Bound (P90)"
                    stroke="#f59e0b"
                    strokeDasharray="5 5"
                    strokeWidth={1.8}
                    dot={{ r: 3, fill: '#f59e0b' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecastedElapsedMin"
                    name="Live Telemetry ETA Forecast Trajectory"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    strokeDasharray="3 3"
                    dot={{ r: 4, fill: '#06b6d4' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="currentJourneyElapsedMin"
                    name="Current Journey Actual Elapsed"
                    stroke="#10b981"
                    strokeWidth={3.5}
                    dot={{ r: 5, fill: '#10b981', stroke: '#052e16', strokeWidth: 2 }}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChartTab === 'velocity_fuel' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Corridor Segment Velocity (km/h) & Cumulative Fuel Consumption (Litres)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Compares historical segment speed & diesel burn against current truck telemetry to pinpoint toll delays or fuel anomalies
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg shrink-0">
                Rated Efficiency: {assignedVehicle?.mileageKmPerLitre || 4.2} km/L
              </span>
            </div>

            <div className="w-full h-72 min-w-0" style={{ height: 290 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ComposedChart
                  data={checkpointMetrics}
                  margin={{ top: 12, right: 24, left: 4, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="checkpoint" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    yAxisId="speed"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    unit=" km/h"
                  />
                  <YAxis
                    yAxisId="fuel"
                    orientation="right"
                    stroke="#f59e0b"
                    fontSize={11}
                    tickLine={false}
                    unit=" L"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D131F',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar
                    yAxisId="speed"
                    dataKey="historicalAvgSpeedKmh"
                    name="Historical Avg Speed (km/h)"
                    fill="#334155"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                  />
                  <Bar
                    yAxisId="speed"
                    dataKey="currentSpeedKmh"
                    name="Current Journey Speed (km/h)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                  />
                  <Line
                    yAxisId="fuel"
                    type="monotone"
                    dataKey="historicalFuelBurnLitres"
                    name="Historical Fuel Burn (L)"
                    stroke="#818cf8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="fuel"
                    type="monotone"
                    dataKey="currentFuelBurnLitres"
                    name="Current Journey Fuel Burn (L)"
                    stroke="#f59e0b"
                    strokeWidth={2.8}
                    dot={{ r: 4, fill: '#f59e0b' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChartTab === 'sla_window' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Arrival Time Probability Density — Historical Distribution vs. Live Journey Forecast
                </h3>
                <p className="text-[11px] text-slate-400">
                  Evaluates arrival window certainty relative to the consignee delivery SLA deadline
                </p>
              </div>
              <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-1 rounded-lg shrink-0">
                Confidence: {slaConfidenceScore}% On-Time
              </span>
            </div>

            <div className="w-full h-72 min-w-0" style={{ height: 290 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart
                  data={slaDistributionData}
                  margin={{ top: 12, right: 24, left: 4, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="histProbGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="currProbGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="windowLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D131F',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="historicalProbability"
                    name="30-Day Historical Arrival Probability (%)"
                    stroke="#6366f1"
                    fill="url(#histProbGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="currentJourneyProbability"
                    name="Current Journey Forecasted Window (%)"
                    stroke="#06b6d4"
                    fill="url(#currProbGrad)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Interactive Telemetry Anomaly & ETA Impact Trigger Bar */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-slate-200">Live Telemetry Alert & ETA Impact Test:</strong> Trigger a real-time corridor event to broadcast alerts to {role === 'manager' ? 'Driver & Manager consoles' : 'Fleet Dispatch & Driver consoles'} and dynamically shift the ETA forecast:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleQuickSimulateAlert('delay')}
            className="px-3 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-700/70 text-amber-300 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>+25m Toll Delay Alert</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickSimulateAlert('fuel')}
            className="px-3 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/70 text-indigo-300 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Fuel className="w-3.5 h-3.5 text-indigo-400" />
            <span>+18.5% Fuel Anomaly</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickSimulateAlert('deviation')}
            className="px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-700/70 text-red-300 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Route Deviation Alert</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}
    </div>
  );
};
