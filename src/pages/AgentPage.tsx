/**
 * HaulSense - HaulSense Agent Execution Workspace (/manager/agent/:shipmentId)
 * Modern Dark Operations theme with Master Prompt requirements:
 * 1. Objective input: text box + shipment selector + Run Agent button.
 * 2. Live reasoning timeline: thought, tool called, result summary, evaluation badge (sufficient/insufficient/conflicting).
 * 3. Replan indicator: visible marker whenever agent loops back.
 * 4. Tool panel: seven tools with status (idle, running, done).
 * 5. Final decision card: large action badge (ACCEPT, NEGOTIATE, REASSIGN, WAIT, REJECT), confidence, rationale, key numbers, follow-up action.
 * 6. Run history for replay.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Play,
  RotateCcw,
  Clock,
  Truck,
  UserCheck,
  AlertTriangle,
  ArrowLeft,
  Sliders,
  TrendingUp,
  ShieldCheck,
  ArrowLeftRight,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { ALL_SHIPMENTS, TARGET_SHIPMENTS } from '../data/mockData';
import { streamAgentRun, getLastSavedTrace } from '../agent/clientStream';
import { AgentEvent, FinalRecommendationSummary } from '../types';
import { formatDateTime, formatINR } from '../utils';
import { AgentTimeline } from '../components/AgentTimeline';
import { FindingsCards } from '../components/FindingsCards';
import { RecommendationCard } from '../components/RecommendationCard';

export const AgentPage: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();

  const activeShipment = ALL_SHIPMENTS.find((s) => s.id === shipmentId) || TARGET_SHIPMENTS[0];

  const [userQuestion, setUserQuestion] = useState('Should we accept this shipment?');
  const [isRunning, setIsRunning] = useState(false);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [toolOutputs, setToolOutputs] = useState<Record<string, any>>({});
  const [recommendation, setRecommendation] = useState<FinalRecommendationSummary | null>(null);
  const [runSummary, setRunSummary] = useState<{
    stepsCompleted: number;
    toolsUsed: string[];
    replansCount: number;
    executionTimeMs: number;
  } | null>(null);
  const [isReplayed, setIsReplayed] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTools, setActiveTools] = useState<string[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 7 Deterministic tools registry status tracker for the Tool Panel
  const allTools = [
    { id: 'calculate_trip_profit', name: 'Trip Profitability', icon: TrendingUp },
    { id: 'get_trust_passport', name: 'Trust Passport', icon: ShieldCheck },
    { id: 'match_vehicle', name: 'Vehicle Matcher', icon: Truck },
    { id: 'find_return_trip', name: 'Return Trip Engine', icon: ArrowLeftRight },
    { id: 'what_if_simulator', name: 'What-If Simulator', icon: Sliders },
    { id: 'simulate_negotiation', name: 'Negotiation Engine', icon: DollarSign },
    { id: 'evaluate_risk', name: 'Risk Evaluator', icon: AlertTriangle },
  ];

  useEffect(() => {
    if (activeShipment) {
      const saved = getLastSavedTrace(activeShipment.id);
      if (saved && saved.recommendation) {
        setEvents(saved.events);
        setRecommendation(saved.recommendation);
        setIsReplayed(true);
        const outputs: Record<string, any> = {};
        const tools: string[] = [];
        for (const e of saved.events) {
          if (e.type === 'tool_result') {
            outputs[e.tool] = e.data;
          }
          if (e.type === 'tool_called') {
            tools.push(e.tool);
          }
        }
        setToolOutputs(outputs);
        setActiveTools(tools);
        setRunSummary({
          stepsCompleted: saved.events.filter((e) => e.type === 'tool_called').length,
          toolsUsed: saved.toolsInvoked,
          replansCount: saved.events.filter((e) => e.type === 'replan').length,
          executionTimeMs: saved.durationMs,
        });
      } else {
        setEvents([]);
        setToolOutputs({});
        setActiveTools([]);
        setRecommendation(null);
        setRunSummary(null);
        setIsReplayed(false);
        setCurrentStep(0);
      }
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [activeShipment?.id]);

  const handleRunAgent = async () => {
    if (isRunning) return;

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsRunning(true);
    setEvents([]);
    setToolOutputs({});
    setActiveTools([]);
    setRecommendation(null);
    setRunSummary(null);
    setIsReplayed(false);
    setCurrentStep(0);

    try {
      await streamAgentRun({
        shipment: activeShipment,
        userQuestion,
        signal: abortController.signal,
        onEvent: (event) => {
          setEvents((prev) => [...prev, event]);

          if (event.type === 'tool_called') {
            setCurrentStep(event.step);
            setActiveTools((prev) => Array.from(new Set([...prev, event.tool])));
          }

          if (event.type === 'tool_result') {
            setToolOutputs((prev) => ({
              ...prev,
              [event.tool]: event.data,
            }));
          }

          if (event.type === 'recommendation') {
            setRecommendation(event.recommendation);
            setRunSummary(event.runSummary);
          }
        },
      });
    } catch (err) {
      console.error('Run failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReplayLastRun = () => {
    const saved = getLastSavedTrace(activeShipment.id);
    if (!saved) return;

    setIsRunning(false);
    setEvents(saved.events);
    setRecommendation(saved.recommendation || null);
    setIsReplayed(true);

    const outputs: Record<string, any> = {};
    const tools: string[] = [];
    for (const e of saved.events) {
      if (e.type === 'tool_result') {
        outputs[e.tool] = e.data;
      }
      if (e.type === 'tool_called') {
        tools.push(e.tool);
      }
    }
    setToolOutputs(outputs);
    setActiveTools(tools);
    setRunSummary({
      stepsCompleted: saved.events.filter((e) => e.type === 'tool_called').length,
      toolsUsed: saved.toolsInvoked,
      replansCount: saved.events.filter((e) => e.type === 'replan').length,
      executionTimeMs: saved.durationMs,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Shipment Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/manager')}
            className="p-2 rounded-xl border border-slate-800 bg-[#121824] text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg md:text-xl font-bold text-white font-heading">
                HaulSense Agent Dispatch Console
              </h1>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/80">
                {activeShipment.id}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous agent orchestrator evaluating full trip-cycle economics
            </p>
          </div>
        </div>

        {/* Case Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          <span className="text-slate-500 font-mono text-[11px] uppercase mr-1">Corridors:</span>
          {TARGET_SHIPMENTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => navigate(`/manager/agent/${s.id}`)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shrink-0 cursor-pointer ${
                s.id === activeShipment.id
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-900/40 border border-indigo-500/50'
                  : 'bg-[#121824] text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {s.id.replace('S-', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Seven Tools Status Panel (Master Prompt Item 4) */}
      <div className="bg-[#121824] border border-slate-800/90 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Agent Deterministic Tools Capability Matrix (7 Tools)
          </span>
          <span className="text-[11px] text-indigo-400 font-mono">
            {activeTools.length}/7 Tools Invoked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {allTools.map((t) => {
            const isToolActive = activeTools.includes(t.id);
            const isToolDone = Boolean(toolOutputs[t.id]);

            return (
              <div
                key={t.id}
                className={`p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                  isToolDone
                    ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-300'
                    : isToolActive && isRunning
                    ? 'bg-indigo-950/40 border-indigo-800 text-indigo-300 animate-pulse'
                    : 'bg-[#0B0F17] border-slate-800/80 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <t.icon className="w-4 h-4 shrink-0" />
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                      isToolDone
                        ? 'bg-emerald-900 text-emerald-200'
                        : isToolActive && isRunning
                        ? 'bg-indigo-900 text-indigo-200'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isToolDone ? 'DONE' : isToolActive && isRunning ? 'RUNNING' : 'IDLE'}
                  </span>
                </div>
                <span className="font-semibold truncate text-[11px]">{t.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Objective & Shipment Brief (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#121824] rounded-2xl border border-slate-800/90 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3.5">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                1. Objective & Brief
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {formatINR(activeShipment.offeredFreight)}
              </span>
            </div>

            <h3 className="font-bold text-sm text-white font-heading leading-snug">
              {activeShipment.title}
            </h3>

            {/* Route & Cargo Specs */}
            <div className="mt-3.5 p-3.5 bg-[#0B0F17] rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Route Corridor:</span>
                <span className="font-bold text-white">
                  {activeShipment.origin} → {activeShipment.destination}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Distance:</span>
                <span className="font-mono text-slate-200">{activeShipment.distanceKm} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cargo Payload:</span>
                <span className="font-medium text-slate-200 capitalize">
                  {activeShipment.weightTons}t {activeShipment.cargoType} {activeShipment.isHighValue && '• High Value'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Departure:</span>
                <span className="font-mono text-slate-300">{formatDateTime(activeShipment.departureTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delivery Deadline:</span>
                <span className="font-mono text-red-400 font-semibold">{formatDateTime(activeShipment.deliveryDeadline)}</span>
              </div>
            </div>

            {/* Vehicle & Driver Assigned */}
            <div className="mt-3 p-3 bg-[#0B0F17] rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Truck:</span>
                <span className="font-mono font-bold text-slate-200">
                  {activeShipment.assignedVehicleId || 'Auto-matched by agent'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Driver:</span>
                <span className="font-mono font-bold text-slate-200">
                  {activeShipment.assignedDriverId || 'Verified by agent'}
                </span>
              </div>
            </div>

            {/* Objective Input matching Master Prompt */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300 font-heading mb-1.5">
                Manager Objective Directive:
              </label>
              <textarea
                rows={2}
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-700 bg-[#0B0F17] text-white focus:outline-none focus:border-indigo-500"
                placeholder="Ask HaulSense Agent..."
              />
            </div>

            {/* Run Agent CTA */}
            <div className="mt-4 space-y-2">
              <button
                type="button"
                disabled={isRunning}
                onClick={handleRunAgent}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <BrainCircuit className="w-4 h-4 text-indigo-200 animate-spin" />
                    <span>Agent Orchestrating Tools...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-indigo-200 fill-indigo-200" />
                    <span>Run HaulSense Agent</span>
                  </>
                )}
              </button>

              {getLastSavedTrace(activeShipment.id) && (
                <button
                  type="button"
                  onClick={handleReplayLastRun}
                  disabled={isRunning}
                  className="w-full py-2 text-center text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-indigo-400" />
                  <span>Replay last run history</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Agent Reasoning Timeline with Evaluation Badges (4 cols) */}
        <div className="lg:col-span-4">
          <AgentTimeline
            events={events}
            isRunning={isRunning}
            currentStep={currentStep}
            maxSteps={10}
          />
        </div>

        {/* Column 3: Findings Cards (4 cols) */}
        <div className="lg:col-span-4">
          <FindingsCards toolOutputs={toolOutputs} />
        </div>
      </div>

      {/* Final Decision Card (Full Width Below Columns) */}
      {recommendation && (
        <div className="mt-6">
          <RecommendationCard
            recommendation={recommendation}
            runSummary={runSummary || undefined}
            isReplayed={isReplayed}
          />
        </div>
      )}
    </div>
  );
};
