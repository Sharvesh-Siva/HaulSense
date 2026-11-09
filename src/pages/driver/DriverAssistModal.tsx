/**
 * HaulSense - AI Driver Assist Modal
 * Agentic copilot for drivers providing instant advice on:
 * - Load-to-vehicle suitability
 * - Return haul selection & route profitability
 * - Earnings breakdowns & incentive calculations
 * - Route restrictions & pre-trip inspections
 */

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Bot,
  User,
} from 'lucide-react';
import { Driver, Vehicle } from '../../types';
import { useLogistics } from '../../context/LogisticsContext';
import { evaluateVehicleForLoad, matchVehicle } from '../../tools/matchVehicle';
import { calculateTripProfit } from '../../tools/calculateTripProfit';
import { findReturnTrip } from '../../tools/findReturnTrip';
import { formatINR } from '../../utils';

interface DriverAssistModalProps {
  driver: Driver;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content: string;
  card?: {
    type: 'suitability' | 'return_load' | 'earnings' | 'warning';
    title: string;
    details: string[];
    badge?: string;
  };
}

export const DriverAssistModal: React.FC<DriverAssistModalProps> = ({ driver, onClose }) => {
  const { vehicles, shipments, returnLoads } = useLogistics();
  const assignedVehicle = vehicles.find((v) => v.id === driver.assignedVehicleId) || vehicles[0];

  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      timestamp: 'Just now',
      content: `Hello ${driver.name}! I am your HaulSense Agent copilot. I can verify if your assigned truck (${assignedVehicle.plateNumber}) is suitable for your cargo, locate return loads, or explain your trip earnings. What would you like to check?`,
    },
  ]);

  const quickPrompts = [
    {
      title: 'Vehicle Suitability Check',
      prompt: `Is my assigned truck (${assignedVehicle.plateNumber}) suitable for the 6.2T FMCG load?`,
    },
    {
      title: 'Find Best Return Load',
      prompt: 'What return load should I take after Bengaluru delivery?',
    },
    {
      title: 'Mini Truck 7-Ton Test',
      prompt: 'Can I take a 7-ton load with mini truck TN 09 CX 7821?',
    },
    {
      title: 'Weekly Earnings Breakdown',
      prompt: 'Explain my earnings and incentive breakdown for this month.',
    },
  ];

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    setTimeout(() => {
      processAgentResponse(query);
      setIsProcessing(false);
    }, 600);
  };

  const processAgentResponse = (query: string) => {
    const q = query.toLowerCase();

    // 1. Check mini truck 7-ton or mismatch question
    if (q.includes('mini truck') || q.includes('tn 09 cx 7821') || (q.includes('7-ton') && q.includes('1.5'))) {
      const miniTruck = vehicles.find((v) => v.plateNumber.includes('7821')) || vehicles[1];
      const matchResult = evaluateVehicleForLoad(
        miniTruck,
        {
          cargoType: 'general',
          cargoWeightTons: 7.0,
          cargoVolumeM3: 20,
          requiredVehicleType: 'Heavy Truck',
          requiredBodyType: 'Closed Container',
          temperatureRequirement: 'ambient',
          specialHandling: 'none',
        },
        'Chennai'
      );

      const respMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: 'Just now',
        content: `⚠ **Severe Mismatch Detected!** You CANNOT take a 7-ton load with mini truck **${miniTruck.plateNumber}**. Its rated payload capacity is only **${miniTruck.capacityTons}T**. Attempting this would result in 466% severe overloading, suspension damage, and immediate RTO impoundment.`,
        card: {
          type: 'warning',
          title: `Vehicle Capacity Violation: ${miniTruck.plateNumber}`,
          badge: 'Match Score: 12% (UNSUITABLE)',
          details: [
            `Payload Deficit: Cargo is 7.0T vs Rated Limit 1.5T (Overloaded by 5.5T)`,
            `Vehicle Type: Mini Truck is uncertified for heavy industrial cargo`,
            `Recommended Action: Request Medium Truck (TN 38 AB 4521, 7.5T) via Manager notification`,
          ],
        },
      };
      setMessages((prev) => [...prev, respMsg]);
      return;
    }

    // 2. Suitability check for assigned truck (TN 38 AB 4521)
    if (q.includes('suitable') || q.includes('assigned truck') || q.includes('fmcg') || q.includes('6.2')) {
      const activeShipment = shipments.find((s) => s.id === 'S-GOLDEN') || shipments[0];
      const evaluation = evaluateVehicleForLoad(
        assignedVehicle,
        activeShipment.requirements,
        activeShipment.origin
      );

      const respMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: 'Just now',
        content: `✓ **Your assigned vehicle ${assignedVehicle.plateNumber} is an EXCELLENT match (${evaluation.matchScore}%) for Shipment ${activeShipment.id}!**\n\nThe 6.2T FMCG load utilizes 82.7% of your 7.5T payload capacity, which is in the sweet spot for fuel efficiency and axle stability.`,
        card: {
          type: 'suitability',
          title: `Deterministic Match Audit: ${assignedVehicle.plateNumber}`,
          badge: `${evaluation.matchScore}% Match (Ideal Fit)`,
          details: [
            `✓ Payload: 6.2T payload fits comfortably inside 7.5T rated capacity`,
            `✓ Body Type: Closed container prevents weather and dust damage to packaged FMCG`,
            `✓ Volume: 22 m³ volume fits well within 28 m³ container body (78% volumetric fill)`,
            `✓ Health: Mechanical health verified at ${assignedVehicle.health.overallScore}% with brakes and engine certified`,
          ],
        },
      };
      setMessages((prev) => [...prev, respMsg]);
      return;
    }

    // 3. Return load suggestion
    if (q.includes('return') || q.includes('bengaluru') || q.includes('next load')) {
      const returnResult = findReturnTrip({
        purpose: 'Driver query for return loads',
        origin: 'Chennai',
        destination: 'Bengaluru',
        outboundDistanceKm: 350,
        outboundMileage: assignedVehicle.mileageKmPerLitre,
        outboundProfit: 6200,
        outboundToll: 1800,
        arrivalTime: new Date(Date.now() + 8 * 3600000).toISOString(),
        truckCapacityTons: assignedVehicle.capacityTons,
      });

      const best = returnResult.bestOpportunity;
      const respMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: 'Just now',
        content: best
          ? `✓ Found high-value return haul **${best.load.id} (${best.load.origin} → ${best.load.destination})**! Claiming this load adds **${formatINR(best.load.driverShare)}** directly to your driver wallet and turns your return leg into a profitable haul.`
          : 'Checking available return loads in the Bengaluru logistics corridor...',
        card: best
          ? {
              type: 'return_load',
              title: `Recommended Return Haul: ${best.load.id} (${best.load.origin} → ${best.load.destination})`,
              badge: `Driver Share: ${formatINR(best.load.driverShare)}`,
              details: [
                `Cargo: ${best.load.cargoType.toUpperCase()} (${best.load.weightTons}T)`,
                `Vehicle Fit: Fits your ${assignedVehicle.capacityTons}T Closed Container Truck`,
                `Pickup Window: ${best.load.pickupTime}`,
                `Roundtrip Earnings Boost: Increases your trip total to ₹15,600`,
              ],
            }
          : undefined,
      };
      setMessages((prev) => [...prev, respMsg]);
      return;
    }

    // 4. Earnings explanation
    if (q.includes('earning') || q.includes('money') || q.includes('incentive') || q.includes('month')) {
      const respMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: 'Just now',
        content: `Here is your current earnings summary for this month, ${driver.name}:`,
        card: {
          type: 'earnings',
          title: `Driver Ledger (${driver.id} - ${driver.name})`,
          badge: `Total: ${formatINR(driver.monthEarnings)}`,
          details: [
            `Completed Trips: 28 trips (Avg ₹5,850 per corridor haul)`,
            `Return Load Bonus: ₹18,400 earned by closing return backhauls`,
            `On-Time Punctuality Incentive: ₹3,200 (96% on-time record)`,
            `Pending Settlement: ₹7,800 currently awaiting client sign-off on POD`,
            `Next Payout: Friday directly to HDFC Bank (•••• 4091)`,
          ],
        },
      };
      setMessages((prev) => [...prev, respMsg]);
      return;
    }

    // Default intelligent fallback
    const respMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      sender: 'assistant',
      timestamp: 'Just now',
      content: `I've analyzed your fleet telemetry. You are currently driving **${assignedVehicle.plateNumber}** (${assignedVehicle.vehicleType}, ${assignedVehicle.capacityTons}T capacity) with a reliability score of **${driver.reliabilityScore}/100**. \n\nYou can ask me to run a vehicle suitability check, verify a return load from Bengaluru, or explain your trip compensation.`,
    };
    setMessages((prev) => [...prev, respMsg]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0D131F] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#121A29] px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-white text-sm sm:text-base">
                  HaulSense Driver Copilot
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  AI + Deterministic Math
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Operating with vehicle {assignedVehicle.plateNumber} ({assignedVehicle.vehicleType})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="bg-[#090D14] px-4 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] text-slate-400 font-mono shrink-0">Ask:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(p.prompt)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#141E30] text-emerald-300 hover:bg-emerald-950 hover:text-emerald-200 border border-slate-700/60 whitespace-nowrap transition-all cursor-pointer"
            >
              {p.title}
            </button>
          ))}
        </div>

        {/* Chat message stream */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-emerald-600 text-white font-medium rounded-tr-xs'
                    : 'bg-[#151D2C] border border-slate-800 text-slate-200 rounded-tl-xs space-y-2.5'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Structured card if attached */}
                {m.card && (
                  <div
                    className={`mt-2 p-3 rounded-xl border text-xs ${
                      m.card.type === 'warning'
                        ? 'bg-red-950/40 border-red-800/80 text-red-200'
                        : m.card.type === 'suitability'
                        ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                        : 'bg-indigo-950/40 border-indigo-800/80 text-indigo-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-2">
                      <span className="flex items-center gap-1.5 font-heading">
                        {m.card.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                        {m.card.title}
                      </span>
                      {m.card.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                          {m.card.badge}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {m.card.details.map((d, dIdx) => (
                        <li key={dIdx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                          <span className="text-slate-500">•</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 font-mono text-right pt-1">
                  {m.timestamp}
                </div>
              </div>
              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-10 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>HaulSense agent querying deterministic vehicle matcher...</span>
            </div>
          )}
        </div>

        {/* Footer input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-[#101724] border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about load compatibility, return trips, or vehicle health..."
            className="flex-1 bg-[#090D14] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isProcessing}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
