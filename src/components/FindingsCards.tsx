/**
 * HaulSense - Modern Dark Findings Display Cards
 * Dynamically rendered with evaluation badges (sufficient / insufficient / conflicting),
 * profit, trust, vehicle fit, return cycle, what-if, negotiation, and risk models.
 */

import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Truck,
  ArrowLeftRight,
  Sliders,
  DollarSign,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { formatINR } from '../utils';
import { DriverSignalBadge, RiskChip, VehicleFitBadge } from './Badges';

interface FindingsProps {
  toolOutputs: Record<string, any>;
}

export const FindingsCards: React.FC<FindingsProps> = ({ toolOutputs }) => {
  const profitData = toolOutputs['calculate_trip_profit'];
  const trustData = toolOutputs['get_trust_passport'];
  const vehicleData = toolOutputs['match_vehicle'];
  const returnData = toolOutputs['find_return_trip'];
  const whatIfData = toolOutputs['what_if_simulator'];
  const negotiationData = toolOutputs['simulate_negotiation'];
  const riskData = toolOutputs['evaluate_risk'];

  const hasAnyFindings = Boolean(
    profitData || trustData || vehicleData || returnData || whatIfData || negotiationData || riskData
  );

  if (!hasAnyFindings) {
    return (
      <div className="bg-[#121824] rounded-2xl border border-slate-800/90 p-8 text-center text-slate-400 shadow-sm">
        <Sliders className="w-10 h-10 mx-auto text-indigo-400/50 mb-3 stroke-[1.5]" />
        <h4 className="font-bold text-white font-heading">Decision Intelligence Feed</h4>
        <p className="text-xs mt-1.5 max-w-sm mx-auto text-slate-400 leading-relaxed">
          Operational evidence will populate here automatically as the agent selects and evaluates tools.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Profitability Card */}
      {profitData?.ok && (
        <div className="bg-[#121824] rounded-2xl border border-slate-800/90 p-5 shadow-sm transition-all hover:border-indigo-500/40">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">Trip Profitability</h4>
                <p className="text-[11px] text-slate-400">Deterministic cost accounting</p>
              </div>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${
                profitData.marginPercentage >= 20
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                  : profitData.marginPercentage >= 10
                  ? 'bg-amber-950/80 text-amber-400 border-amber-800/80'
                  : 'bg-red-950/80 text-red-400 border-red-800/80'
              }`}
            >
              {profitData.marginPercentage}% MARGIN
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5 text-xs">
            <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Offered Freight</span>
              <span className="text-sm font-bold font-mono text-white">
                {formatINR(profitData.offeredFreight)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Total Op Cost</span>
              <span className="text-sm font-bold font-mono text-slate-300">
                {formatINR(profitData.totalCost)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Fuel Cost</span>
              <span className="text-sm font-bold font-mono text-slate-400">
                {formatINR(profitData.fuelCost)}
              </span>
            </div>
            <div
              className={`p-2.5 rounded-xl border ${
                profitData.profit >= 0
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-red-950/40 border-red-800/60 text-red-300'
              }`}
            >
              <span className="block text-[11px] opacity-75">Outbound Profit</span>
              <span className="text-sm font-bold font-mono">
                {formatINR(profitData.profit)}
              </span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex justify-between">
            <span>Break-even freight: <strong className="font-mono text-slate-200">{formatINR(profitData.breakEvenFreight)}</strong></span>
            <span>Diesel benchmark: <strong className="font-mono text-slate-200">₹92/L</strong></span>
          </div>
        </div>
      )}

      {/* 2. Trust Passport Card */}
      {trustData?.ok && (
        <div className="bg-[#121824] rounded-2xl border border-slate-800/90 p-5 shadow-sm transition-all hover:border-indigo-500/40">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">Driver Trust Passport</h4>
                <p className="text-[11px] text-slate-400">Behavioral integrity & safety audit</p>
              </div>
            </div>
            {trustData.singleDriver && (
              <DriverSignalBadge signal={trustData.singleDriver.signal} />
            )}
          </div>

          {trustData.singleDriver && (
            <div className="mt-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white">{trustData.singleDriver.name}</span>
                  <span className="ml-2 text-xs font-mono text-slate-400">{trustData.singleDriver.driverId}</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-white leading-none">
                    {trustData.singleDriver.score}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono font-semibold">/100 TRUST</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 mt-3 text-xs">
                <div className="p-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-center">
                  <span className="text-slate-500 block text-[11px]">On-Time</span>
                  <span className="font-bold font-mono text-slate-200">{trustData.singleDriver.onTimePercentage}%</span>
                </div>
                <div className="p-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-center">
                  <span className="text-slate-500 block text-[11px]">Cancel Rate</span>
                  <span className="font-bold font-mono text-slate-200">{trustData.singleDriver.cancellationRatePercentage}%</span>
                </div>
                <div className="p-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-center">
                  <span className="text-slate-500 block text-[11px]">Incidents</span>
                  <span className={`font-bold font-mono ${trustData.singleDriver.incidentsCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {trustData.singleDriver.incidentsCount}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300 mt-3 bg-[#0B0F17] p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                {trustData.singleDriver.summary}
              </p>
            </div>
          )}

          {/* Ranked Available Drivers (if queried) */}
          {trustData.rankedDrivers && (
            <div className="mt-3.5">
              <span className="text-xs font-bold text-slate-400 block mb-2 font-mono uppercase tracking-wider">
                Available Replacement Drivers:
              </span>
              <div className="space-y-2">
                {trustData.rankedDrivers.slice(0, 3).map((d: any) => (
                  <div key={d.driverId} className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800 text-xs">
                    <div>
                      <span className="font-semibold text-white">{d.name}</span>
                      <span className="ml-1 text-[11px] font-mono text-slate-400">({d.driverId})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-300">{d.score}/100</span>
                      <DriverSignalBadge signal={d.signal} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Return Trip Opportunity Card */}
      {returnData?.ok && (
        <div className="bg-[#121824] rounded-2xl border border-slate-800/90 p-5 shadow-sm transition-all hover:border-indigo-500/40">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">Trip-Cycle Intelligence</h4>
                <p className="text-[11px] text-slate-400">Round-trip deadhead & backhaul economics</p>
              </div>
            </div>
            {returnData.bestOpportunity ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                +{formatINR(returnData.bestOpportunity.improvementVsEmptyReturn)} CYCLE GAIN
              </span>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono text-slate-400 bg-slate-800 border border-slate-700">
                EMPTY RETURN
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3.5 text-xs">
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/60">
              <span className="text-red-400 block font-medium">Empty Return Penalty</span>
              <span className="text-base font-bold font-mono text-red-300">
                -{formatINR(returnData.emptyReturnCost)}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Net if returning empty: {formatINR(returnData.outboundOnlyCycleProfit)}
              </span>
            </div>

            {returnData.bestOpportunity && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60">
                <span className="text-emerald-400 block font-medium">Full Trip-Cycle Net</span>
                <span className="text-base font-bold font-mono text-emerald-300">
                  {formatINR(returnData.bestOpportunity.tripCycleProfit)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Backhaul net: +{formatINR(returnData.bestOpportunity.returnNet)}
                </span>
              </div>
            )}
          </div>

          {returnData.bestOpportunity && (
            <div className="mt-3.5 p-3 bg-[#0B0F17] rounded-xl border border-slate-800 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-white">
                  Secured Return Haul: {returnData.bestOpportunity.load.id} ({returnData.bestOpportunity.load.origin} → {returnData.bestOpportunity.load.destination})
                </span>
                <span className="font-mono text-emerald-400 font-bold">{formatINR(returnData.bestOpportunity.load.offeredFreight)}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {returnData.bestOpportunity.load.weightTons}t {returnData.bestOpportunity.load.cargoType} • Status: {returnData.bestOpportunity.load.status}
              </div>
            </div>
          )}

          {/* Rejected Loads Transparency */}
          {returnData.rejectedLoads && returnData.rejectedLoads.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-slate-800">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Rejected Backhauls ({returnData.rejectedLoads.length})
              </span>
              <div className="space-y-1.5">
                {returnData.rejectedLoads.map((rej: any) => (
                  <div key={rej.load.id} className="text-xs p-2 rounded-lg bg-[#0B0F17] border border-slate-800 flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-300">{rej.load.id} ({rej.load.origin} → {rej.load.destination}):</span>{' '}
                      <span className="text-slate-400 text-[11px]">{rej.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Vehicle Fit Card */}
      {vehicleData?.ok && (
        <div className="bg-[#121824] rounded-2xl border border-slate-800/90 p-5 shadow-sm transition-all hover:border-indigo-500/40">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">Fleet Vehicle Match</h4>
                <p className="text-[11px] text-slate-400">Payload capacity & cargo spec compatibility</p>
              </div>
            </div>
            {vehicleData.bestVehicle && (
              <VehicleFitBadge fit={vehicleData.bestVehicle.fitLabel} />
            )}
          </div>

          {vehicleData.bestVehicle ? (
            <div className="mt-3.5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm">{vehicleData.bestVehicle.vehicle.id}</span>
                  <span className="ml-2 font-mono text-slate-400">{vehicleData.bestVehicle.vehicle.plateNumber}</span>
                </div>
                <span className="text-xs font-semibold text-slate-300">
                  {vehicleData.bestVehicle.vehicle.capacityTons}t rated capacity
                </span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                  <span>Payload Utilization</span>
                  <span className="font-bold text-white">{vehicleData.bestVehicle.utilizationPercentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#0B0F17] rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                    style={{ width: `${Math.min(100, vehicleData.bestVehicle.utilizationPercentage)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-2">No available fleet trucks match payload criteria.</p>
          )}
        </div>
      )}

      {/* 5. Negotiation Simulator Card */}
      {negotiationData?.ok && (
        <div className="bg-[#121824] rounded-2xl border border-slate-800/90 p-5 shadow-sm transition-all hover:border-indigo-500/40">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">Rate Negotiation Model</h4>
                <p className="text-[11px] text-slate-400">Commercial floor & target analysis</p>
              </div>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${
                negotiationData.isRealistic
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                  : 'bg-red-950/80 text-red-400 border-red-800/80'
              }`}
            >
              {negotiationData.isRealistic ? 'REALISTIC' : 'UNREALISTIC COUNTER'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mt-3.5 text-xs">
            <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800 text-center">
              <span className="text-slate-500 block text-[11px]">10% Floor</span>
              <span className="font-bold font-mono text-slate-300">
                {formatINR(negotiationData.minimumAcceptableFreight)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800 text-center">
              <span className="text-slate-500 block text-[11px]">20% Target</span>
              <span className="font-bold font-mono text-slate-300">
                {formatINR(negotiationData.targetPriceFreight)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-center">
              <span className="text-amber-400 block text-[11px] font-semibold">Counter-Offer</span>
              <span className="font-bold font-mono text-sm text-white">
                {formatINR(negotiationData.counterOfferFreight)}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-3 bg-[#0B0F17] p-2.5 rounded-xl border border-slate-800 leading-relaxed">
            {negotiationData.guidance}
          </p>
        </div>
      )}

      {/* 6. What-if Simulation Card */}
      {whatIfData?.ok && (
        <div className="bg-[#121824] rounded-2xl border border-slate-800/90 p-5 shadow-sm transition-all hover:border-indigo-500/40">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">What-If Sensitivity</h4>
                <p className="text-[11px] text-slate-400">Parameter stress testing</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400">
              Δ {formatINR(whatIfData.deltaProfit)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-3.5 text-xs">
            <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Baseline Profit</span>
              <span className="font-mono font-bold text-slate-300">{formatINR(whatIfData.baseline.profit)} ({whatIfData.baseline.marginPercentage}%)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60">
              <span className="text-indigo-400 block text-[11px]">Simulated Profit</span>
              <span className="font-mono font-bold text-white">{formatINR(whatIfData.simulated.profit)} ({whatIfData.simulated.marginPercentage}%)</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-3 bg-[#0B0F17] p-2.5 rounded-xl border border-slate-800 leading-relaxed">
            {whatIfData.verdict}
          </p>
        </div>
      )}

      {/* 7. Risk Evaluation Card */}
      {riskData?.ok && (
        <div className="bg-[#121824] rounded-2xl border border-slate-800/90 p-5 shadow-sm transition-all hover:border-indigo-500/40">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-950/80 border border-red-500/30 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">Risk Matrix</h4>
                <p className="text-[11px] text-slate-400">Holistic operations security scoring</p>
              </div>
            </div>
            <RiskChip level={riskData.level} score={riskData.score} />
          </div>

          <div className="flex items-center justify-between mt-3.5 text-xs bg-[#0B0F17] p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Transit Deadline Slack:</span>
            <span className={`font-mono font-bold ${riskData.deadlineSlackHours < 4 ? 'text-red-400' : 'text-emerald-400'}`}>
              {riskData.deadlineSlackHours} hours buffer
            </span>
          </div>

          {riskData.factors && riskData.factors.length > 0 && (
            <div className="mt-3.5 space-y-1.5">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Risk Factors</span>
              {riskData.factors.map((f: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#0B0F17] border border-slate-800">
                  <span className="text-slate-300">{f.description}</span>
                  <span className="font-mono font-bold text-red-400 shrink-0 ml-2">+{f.points}</span>
                </div>
              ))}
            </div>
          )}

          {riskData.mitigations && riskData.mitigations.length > 0 && (
            <div className="mt-3.5 p-3 bg-emerald-950/30 rounded-xl border border-emerald-800/50 text-xs">
              <span className="font-semibold text-emerald-400 block mb-1">Required Mitigations:</span>
              <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
                {riskData.mitigations.map((m: string, i: number) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
