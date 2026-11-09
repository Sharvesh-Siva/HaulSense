/**
 * HaulSense - Final Operational Recommendation Card
 * Updated with modern dark theme and gold accents matching UI requirements.
 */

import React, { useState } from 'react';
import {
  Check,
  Copy,
  Clock,
  Truck,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { FinalRecommendationSummary } from '../types';
import { formatINR, formatPercent } from '../utils';
import { ActionBadge, RiskChip } from './Badges';

interface RecommendationCardProps {
  recommendation: FinalRecommendationSummary;
  runSummary?: {
    stepsCompleted: number;
    toolsUsed: string[];
    replansCount: number;
    executionTimeMs: number;
  };
  isReplayed?: boolean;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  runSummary,
  isReplayed = false,
}) => {
  const [copied, setCopied] = useState(false);

  const copySummaryText = () => {
    const text = `[HAULSENSE DECISION SUMMARY]
Action: ${recommendation.action}
Profit (Outbound): ${formatINR(recommendation.outboundProfit)} (${formatPercent(recommendation.outboundMargin)})
Trip-Cycle Net: ${formatINR(recommendation.tripCycleProfit)}
Risk: ${recommendation.riskLevel || 'LOW'}
Assigned Driver: ${recommendation.assignedDriverId || 'None'}
Assigned Vehicle: ${recommendation.assignedVehicleId || 'None'}
Return Load: ${recommendation.selectedReturnLoadId || 'None'}
${recommendation.recommendedFreight ? `Counter-Offer Freight: ${formatINR(recommendation.recommendedFreight)}\n` : ''}
Key Decision Factors:
${recommendation.decisionFactors.map((f) => `- ${f}`).join('\n')}

Next Immediate Action:
${recommendation.nextAction}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#121824] rounded-2xl border-2 border-slate-700/80 shadow-2xl p-6 relative overflow-hidden transition-all">
      {/* Top Banner Gold Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-indigo-500 to-emerald-400" />

      {isReplayed && (
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          Replayed from a recorded run
        </div>
      )}

      {/* Header with Action Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <span className="text-xs font-mono font-bold text-amber-400/90 tracking-wider uppercase block mb-1.5">
            Operational Commitment Verdict
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <ActionBadge action={recommendation.action} size="lg" />
            {recommendation.riskLevel && <RiskChip level={recommendation.riskLevel} />}
          </div>
        </div>

        <button
          type="button"
          onClick={copySummaryText}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-[#0B0F17] text-slate-300 hover:text-white hover:border-indigo-500/50 transition-all self-start sm:self-auto cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied to Clipboard' : 'Copy Summary'}
        </button>
      </div>

      {/* Metrics Row (Derived strictly from tools) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
        <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800">
          <span className="text-xs text-slate-400 block">Outbound Profit</span>
          <span className="text-xl font-bold font-mono text-white">
            {formatINR(recommendation.outboundProfit)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Margin: <strong className="text-emerald-400 font-mono">{formatPercent(recommendation.outboundMargin)}</strong>
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60">
          <span className="text-xs text-emerald-400 block font-medium">Trip-Cycle Net</span>
          <span className="text-xl font-bold font-mono text-emerald-300">
            {formatINR(recommendation.tripCycleProfit)}
          </span>
          {recommendation.cycleImprovement !== undefined && recommendation.cycleImprovement > 0 && (
            <span className="text-[11px] text-emerald-400 font-medium block mt-1">
              +{formatINR(recommendation.cycleImprovement)} backhaul gain
            </span>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800">
          <span className="text-xs text-slate-400 block">Assigned Fleet</span>
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 mt-1.5">
            <Truck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Truck: <strong className="font-mono text-white">{recommendation.assignedVehicleId || 'Auto-matched'}</strong></span>
          </div>
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 mt-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Driver: <strong className="font-mono text-white">{recommendation.assignedDriverId || 'Verified'}</strong></span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800">
          <span className="text-xs text-slate-400 block">Counter-Offer / Return</span>
          {recommendation.recommendedFreight ? (
            <div className="mt-1">
              <span className="text-base font-bold font-mono text-amber-400">
                {formatINR(recommendation.recommendedFreight)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Negotiation target</span>
            </div>
          ) : recommendation.selectedReturnLoadId ? (
            <div className="mt-1">
              <span className="text-sm font-bold font-mono text-emerald-400">
                Load {recommendation.selectedReturnLoadId}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Secured backhaul</span>
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-500 mt-2 block">None required</span>
          )}
        </div>
      </div>

      {/* Operational Reasoning & Decision Factors */}
      <div className="space-y-4">
        <div>
          <h5 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 font-heading">
            Operational Reasoning
          </h5>
          <p className="text-xs md:text-sm text-slate-200 leading-relaxed bg-[#0B0F17] p-4 rounded-xl border border-slate-800">
            {recommendation.reasoning}
          </p>
        </div>

        <div>
          <h5 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 font-heading">
            Decisive Factors
          </h5>
          <ul className="space-y-2">
            {recommendation.decisionFactors.map((factor, index) => (
              <li
                key={index}
                className="flex items-start gap-2.5 text-xs text-slate-300 bg-[#0B0F17] p-3 rounded-xl border border-slate-800"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <span className="leading-relaxed">{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Immediate Next Directive */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#0B0F17] to-indigo-950/60 border border-indigo-800/60 flex items-start gap-3.5">
          <ArrowRight className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 block mb-1">
              Immediate Dispatch Directive
            </span>
            <p className="text-xs md:text-sm font-medium text-slate-200 leading-relaxed">
              {recommendation.nextAction}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Run Summary */}
      {runSummary && (
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span>
              Tools Invoked: <strong className="text-white font-mono">{runSummary.toolsUsed.length}</strong> ({runSummary.toolsUsed.join(', ')})
            </span>
            <span>•</span>
            <span>
              Replans: <strong className="text-amber-400 font-mono">{runSummary.replansCount}</strong>
            </span>
          </div>
          <div className="font-mono text-slate-400">
            Execution Time: {(runSummary.executionTimeMs / 1000).toFixed(2)}s
          </div>
        </div>
      )}
    </div>
  );
};
