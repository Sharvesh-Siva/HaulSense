/**
 * HaulSense - Driver Mobile Experience Portal (/driver)
 * Modern Dark Operations Theme.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  CheckCircle2,
  LogOut,
  IndianRupee,
  Package,
  CircleDot,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DRIVERS, TARGET_SHIPMENTS } from '../data/mockData';
import { formatDateTime, formatINR } from '../utils';

type DriverTab = 'assigned' | 'available' | 'status' | 'earnings';
type TripStep = 'assigned' | 'acknowledged' | 'in_transit' | 'completed';

export const DriverPortalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DriverTab>('assigned');
  const [tripStep, setTripStep] = useState<TripStep>('assigned');
  const [expressedLoads, setExpressedLoads] = useState<string[]>([]);

  const currentDriver = DRIVERS.find((d) => d.id === user?.driverId) || DRIVERS[0];
  const activeTrip = TARGET_SHIPMENTS[0]; // S-GOLDEN

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  const handleAdvanceStep = () => {
    if (tripStep === 'assigned') setTripStep('acknowledged');
    else if (tripStep === 'acknowledged') setTripStep('in_transit');
    else if (tripStep === 'in_transit') setTripStep('completed');
  };

  const toggleInterest = (id: string) => {
    setExpressedLoads((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-[#F3F4F6] flex flex-col pb-24 selection:bg-emerald-500 selection:text-white">
      {/* Driver Mobile Header */}
      <header className="bg-[#0E1420] border-b border-slate-800 text-white p-4 sticky top-0 z-40 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold flex items-center justify-center font-mono text-sm shadow-md">
            {currentDriver.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold font-heading">{currentDriver.name}</h1>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold uppercase">
                Verified Driver
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {currentDriver.id} • Trust Score: <strong className="text-emerald-400">{currentDriver.reliabilityScore}/100</strong>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/manager')}
            className="text-[11px] font-mono font-bold text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg border border-slate-800 bg-[#121824]"
          >
            Manager View
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {/* TAB 1: ASSIGNED TRIPS */}
        {activeTab === 'assigned' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white font-heading">
                Active Assigned Corridor Haul
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
                {activeTrip.id}
              </span>
            </div>

            {/* Trip Manifest Card */}
            <div className="bg-[#121824] rounded-2xl border border-slate-800/90 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400 block font-mono">Corridor Route</span>
                  <span className="font-bold text-base text-white font-heading">
                    {activeTrip.origin} → {activeTrip.destination}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-mono">Driver Pay</span>
                  <span className="font-mono font-bold text-emerald-400 text-lg">
                    {formatINR(activeTrip.driverCost)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 my-3.5 text-xs">
                <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Payload</span>
                  <span className="font-semibold text-slate-200 capitalize">
                    {activeTrip.weightTons}t {activeTrip.cargoType}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Corridor Distance</span>
                  <span className="font-semibold font-mono text-slate-200">
                    {activeTrip.distanceKm} km
                  </span>
                </div>
              </div>

              {/* Status Stepper */}
              <div className="my-5 pt-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Trip Execution Stepper
                </span>

                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {/* Step 1 */}
                  <div className="relative">
                    <div
                      className={`absolute -left-[27px] top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        tripStep !== 'assigned'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 text-white ring-4 ring-[#121824]'
                      }`}
                    >
                      {tripStep !== 'assigned' ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-white block">
                        Acknowledge & Confirm Load
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {tripStep === 'assigned'
                          ? 'Awaiting driver confirmation'
                          : 'Acknowledged at 06:00 AM'}
                      </span>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <div
                      className={`absolute -left-[27px] top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        tripStep === 'in_transit' || tripStep === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tripStep === 'completed' ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : (
                        '2'
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-white block">
                        Depart Hub / Start Trip
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {tripStep === 'in_transit'
                          ? 'On road to Bengaluru'
                          : tripStep === 'completed'
                          ? 'Transit completed'
                          : 'Pending departure'}
                      </span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <div
                      className={`absolute -left-[27px] top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        tripStep === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tripStep === 'completed' ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : (
                        '3'
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-white block">
                        Delivery & POD Signoff
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {tripStep === 'completed'
                          ? 'Delivered successfully'
                          : 'Awaiting arrival at destination'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {tripStep !== 'completed' ? (
                <button
                  type="button"
                  onClick={handleAdvanceStep}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {tripStep === 'assigned' && <span>Acknowledge Assignment</span>}
                  {tripStep === 'acknowledged' && <span>Start Trip (Depart Hub)</span>}
                  {tripStep === 'in_transit' && <span>Mark Completed (Arrived)</span>}
                  <ArrowRight className="w-4 h-4 text-emerald-200" />
                </button>
              ) : (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Trip Successfully Completed!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AVAILABLE LOADS */}
        {activeTab === 'available' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white font-heading">
              Available Open Loads ({TARGET_SHIPMENTS.length})
            </h2>
            <p className="text-xs text-slate-400 mb-2">
              Express interest in upcoming return or outbound hauls.
            </p>

            {TARGET_SHIPMENTS.map((s) => (
              <div
                key={s.id}
                className="bg-[#121824] rounded-2xl border border-slate-800/90 p-4 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs font-heading">
                    {s.origin} → {s.destination}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    Pay: {formatINR(s.driverCost)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{s.weightTons}t {s.cargoType}</span>
                  <span>{s.distanceKm} km</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleInterest(s.id)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    expressedLoads.includes(s.id)
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-[#0B0F17] hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {expressedLoads.includes(s.id)
                    ? '✓ Interest Expressed'
                    : 'Express Interest'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: TRIP STATUS */}
        {activeTab === 'status' && (
          <div className="bg-[#121824] rounded-2xl border border-slate-800/90 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white font-heading">
              Live Trip Status Manifest
            </h2>
            <div className="p-3.5 bg-[#0B0F17] rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Truck:</span>
                <span className="font-mono font-bold text-white">V1 (TN-09-AB-1234)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Phase:</span>
                <span className="font-bold capitalize text-amber-400 font-mono">{tripStep.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Departure Slot:</span>
                <span className="text-slate-200">{formatDateTime(activeTrip.departureTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delivery Deadline:</span>
                <span className="text-red-400 font-mono font-semibold">{formatDateTime(activeTrip.deliveryDeadline)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dispatch control is tracking this trip cycle. In case of mechanical issues or toll plaza congestion, contact hub dispatch immediately.
            </p>
          </div>
        )}

        {/* TAB 4: EARNINGS & HISTORY */}
        {activeTab === 'earnings' && (
          <div className="space-y-4">
            <div className="bg-[#121824] rounded-2xl border border-slate-800/90 p-5 shadow-sm">
              <span className="text-xs text-slate-400 font-medium block">Month-to-Date Earnings</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 block mt-1">
                ₹38,500
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                14 Hauls Completed • Zero Toll Penalties
              </span>
            </div>

            <div className="bg-[#121824] rounded-2xl border border-slate-800/90 p-4 shadow-sm">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
                Recent Settlement Logs
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[#0B0F17] border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-white block">Chennai → Bengaluru</span>
                    <span className="text-[11px] text-slate-500">Delivered yesterday</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">+₹2,500</span>
                </div>

                <div className="p-3 rounded-xl bg-[#0B0F17] border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-white block">Bengaluru → Chennai (Return R1)</span>
                    <span className="text-[11px] text-slate-500">Delivered 3 days ago</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">+₹1,500</span>
                </div>

                <div className="p-3 rounded-xl bg-[#0B0F17] border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-white block">Chennai → Madurai</span>
                    <span className="text-[11px] text-slate-500">Delivered 5 days ago</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">+₹3,200</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Driver Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0E1420] border-t border-slate-800 px-2 py-2.5 flex items-center justify-around z-50 text-slate-400">
        <button
          type="button"
          onClick={() => setActiveTab('assigned')}
          className={`flex flex-col items-center text-xs font-medium cursor-pointer ${
            activeTab === 'assigned' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Truck className="w-5 h-5 mb-1" />
          <span>Assigned</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('available')}
          className={`flex flex-col items-center text-xs font-medium cursor-pointer ${
            activeTab === 'available' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-5 h-5 mb-1" />
          <span>Loads</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('status')}
          className={`flex flex-col items-center text-xs font-medium cursor-pointer ${
            activeTab === 'status' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CircleDot className="w-5 h-5 mb-1" />
          <span>Status</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('earnings')}
          className={`flex flex-col items-center text-xs font-medium cursor-pointer ${
            activeTab === 'earnings' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <IndianRupee className="w-5 h-5 mb-1" />
          <span>Earnings</span>
        </button>
      </nav>
    </div>
  );
};
