/**
 * HaulSense - Live Agent Reasoning Timeline Component
 * Updated with modern dark theme and Master Prompt requirements:
 * - Each step shows: Iteration #, Thought/Purpose, Tool Called, Result Summary,
 *   and explicit Evaluation Badge (SUFFICIENT / INSUFFICIENT / CONFLICTING).
 * - Visible Replan Indicator whenever the agent loops back.
 * - Live Step Counter (e.g. Step X of 8 / 10).
 */

import React from 'react';
import {
  Check,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  BrainCircuit,
  Cpu,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';
import { AgentEvent } from '../types';

interface AgentTimelineProps {
  events: AgentEvent[];
  isRunning: boolean;
  currentStep: number;
  maxSteps: number;
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({
  events,
  isRunning,
  currentStep,
  maxSteps,
}) => {
  if (events.length === 0 && !isRunning) {
    return (
      <div className="bg-[#121824] rounded-2xl border border-slate-800/90 p-8 text-center text-slate-400 shadow-sm">
        <BrainCircuit className="w-10 h-10 mx-auto text-indigo-400/50 mb-3 stroke-[1.5]" />
        <h4 className="font-bold text-white font-heading">Autonomous Agent Timeline</h4>
        <p className="text-xs mt-1.5 max-w-sm mx-auto text-slate-400 leading-relaxed">
          Click "Run Agent" to initiate autonomous tool selection, result evaluation, and replan loops.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#121824] rounded-2xl border border-slate-800/90 shadow-sm p-5">
      {/* Header with step counter matching Master Prompt */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <h4 className="text-sm font-bold text-white font-heading">Autonomous Agent Activity</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-[#0B0F17] text-indigo-400 border border-indigo-800/60">
            Step {Math.min(currentStep, maxSteps)} of {maxSteps}
          </span>
          {isRunning && (
            <span className="text-xs text-indigo-400 font-medium flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Live
            </span>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {events.map((event, idx) => {
          if (event.type === 'understood') {
            return (
              <div key={idx} className="relative group">
                <div className="absolute -left-[29px] top-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shadow-sm ring-4 ring-[#121824]">
                  <BrainCircuit className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-[#0B0F17] p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white font-heading">Goal Interpreted</span>
                    <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">1. Goal Understanding</span>
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed">{event.goal}</p>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-mono">{event.keyContext}</p>
                </div>
              </div>
            );
          }

          if (event.type === 'tool_called') {
            const isCompleted = events.some(
              (e) => e.type === 'tool_result' && e.tool === event.tool && e.step === event.step
            );

            return (
              <div key={idx} className="relative">
                <div
                  className={`absolute -left-[29px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm ring-4 ring-[#121824] ${
                    isCompleted ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white animate-pulse'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </div>
                <div className="bg-[#0B0F17] p-3 rounded-xl border border-slate-800 shadow-sm text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-400">
                      {event.tool}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Step {event.step}</span>
                  </div>
                  <p className="text-slate-300 mt-1 italic text-[11px]">
                    "{event.purpose}"
                  </p>
                </div>
              </div>
            );
          }

          if (event.type === 'tool_result') {
            // Determine evaluation tag per Master Prompt: sufficient / insufficient / conflicting
            const evalBadge = (event.summary && event.summary.includes('failed'))
              ? 'CONFLICTING'
              : (event.tool === 'find_return_trip' && event.summary.includes('No compatible'))
              ? 'INSUFFICIENT'
              : 'SUFFICIENT';

            return (
              <div key={idx} className="relative pl-1">
                <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/40 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Result: {event.tool}</span>
                    </div>
                    {/* Evaluation Badge matching master prompt requirements */}
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        evalBadge === 'SUFFICIENT'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : evalBadge === 'INSUFFICIENT'
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : 'bg-red-950 text-red-400 border-red-800'
                      }`}
                    >
                      {evalBadge}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed font-mono">
                    {event.summary}
                  </p>
                </div>
              </div>
            );
          }

          if (event.type === 'replan') {
            return (
              <div key={idx} className="relative">
                <div className="absolute -left-[29px] top-0 w-6 h-6 rounded-full bg-amber-500 text-navy-950 flex items-center justify-center text-xs shadow-sm ring-4 ring-[#121824]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-800/80 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-amber-300 font-heading">
                      Replan Loop #{event.attempt}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-700/60">
                      Replanning
                    </span>
                  </div>
                  <p className="text-amber-200 mt-1 font-medium">{event.reason}</p>
                  <p className="text-[11px] text-amber-300/80 mt-1">{event.instruction}</p>
                </div>
              </div>
            );
          }

          if (event.type === 'evaluating') {
            return (
              <div key={idx} className="relative">
                <div className="absolute -left-[29px] top-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs shadow-sm ring-4 ring-[#121824]">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div className="bg-purple-950/20 p-2.5 rounded-xl border border-purple-900/40 text-xs text-purple-300">
                  <span className="font-semibold block text-[11px] text-purple-400">Synthesizing Observations:</span>
                  <p className="text-[11px] mt-0.5 text-slate-300">{event.observation}</p>
                </div>
              </div>
            );
          }

          if (event.type === 'recommendation') {
            return (
              <div key={idx} className="relative">
                <div className="absolute -left-[29px] top-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow-sm ring-4 ring-[#121824]">
                  <FileCheck2 className="w-3.5 h-3.5" />
                </div>
                <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/80 text-xs">
                  <span className="font-bold text-emerald-300 block font-heading">
                    Final Operational Recommendation Reached
                  </span>
                  <p className="text-emerald-200 font-semibold mt-0.5">
                    Verdict: {event.recommendation.action}
                  </p>
                </div>
              </div>
            );
          }

          if (event.type === 'error') {
            return (
              <div key={idx} className="relative">
                <div className="absolute -left-[29px] top-0 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shadow-sm ring-4 ring-[#121824]">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
                <div className="bg-red-950/30 p-3 rounded-xl border border-red-800/80 text-xs text-red-200">
                  <span className="font-bold block font-heading text-red-300">Execution Notice</span>
                  <p className="mt-1">{event.message}</p>
                </div>
              </div>
            );
          }

          return null;
        })}

        {isRunning && (
          <div className="relative pl-1 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Orchestrating next tool...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
