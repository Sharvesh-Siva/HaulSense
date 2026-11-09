/**
 * HaulSense - Operations Portal Landing & Role-Based Authentication
 * Phase 2 & Phase 10 Implementation:
 * - Clearly separates Enterprise Production Authentication (Manager Credentials & Driver PIN)
 *   from the Development Role Simulator (Preview Mode).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Truck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  KeyRound,
  X,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { Emblem } from '../components/Emblem';
import { useAuth } from '../context/AuthContext';
import { DRIVERS } from '../data/mockData';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginManager, loginDriver, loginAsDefaultManager } = useAuth();

  const [activeTab, setActiveTab] = useState<'switcher' | 'enterprise'>('switcher');
  const [selectedDriverId, setSelectedDriverId] = useState('DRV-001');

  // Enterprise form states
  const [enterpriseRole, setEnterpriseRole] = useState<'manager' | 'driver'>('manager');
  const [managerEmail, setManagerEmail] = useState('manager@haulsense.in');
  const [managerPassword, setManagerPassword] = useState('haul123');
  const [driverPin, setDriverPin] = useState('1234');
  const [enterpriseError, setEnterpriseError] = useState<string | null>(null);

  const handleEnterManagerSim = () => {
    loginAsDefaultManager();
    navigate('/manager');
  };

  const handleEnterDriverSim = () => {
    const res = loginDriver(selectedDriverId, '1234', true);
    if (res.success) {
      navigate('/driver');
    }
  };

  const handleEnterpriseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnterpriseError(null);

    if (enterpriseRole === 'manager') {
      const res = loginManager(managerEmail, managerPassword, false);
      if (res.success) {
        navigate('/manager');
      } else {
        setEnterpriseError(res.error || 'Authentication failed');
      }
    } else {
      const res = loginDriver(selectedDriverId, driverPin, false);
      if (res.success) {
        navigate('/driver');
      } else {
        setEnterpriseError(res.error || 'Driver PIN verification failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] flex items-center justify-center p-4 md:p-8 relative selection:bg-indigo-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Container */}
      <div className="w-full max-w-4xl bg-[#111722]/95 border border-slate-800/80 rounded-2xl shadow-2xl p-6 md:p-8 backdrop-blur-xl relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between pb-6">
          <div className="flex items-center gap-3.5">
            <Emblem size={44} onClick={handleEnterManagerSim} />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold text-white font-heading tracking-tight">
                  HaulSense Authentication
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 font-semibold uppercase tracking-wider">
                  RBAC Secured Portal
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Sign in with verified enterprise credentials or use the Development Role Simulator.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEnterManagerSim}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Continue to Dashboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Dev Role Simulator vs Enterprise Sign In */}
        <div className="bg-[#0B0F17]/90 p-1 rounded-xl border border-slate-800/80 flex items-center mb-7">
          <button
            type="button"
            onClick={() => setActiveTab('switcher')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'switcher'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Dev Role Simulator (Preview Mode)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('enterprise')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'enterprise'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4 text-indigo-200" />
            <span>Enterprise Sign In (Production RBAC)</span>
          </button>
        </div>

        {/* Switcher Tab View */}
        {activeTab === 'switcher' ? (
          <div className="space-y-4">
            <div className="px-3.5 py-2 rounded-xl bg-indigo-950/40 border border-indigo-800/50 text-[11px] text-indigo-200 flex items-center justify-between">
              <span>
                <strong>Development Preview Simulator:</strong> Allows rapid evaluation of both Manager and Driver portals. Use the <em>Enterprise Sign In</em> tab to test strict single-role production enforcement.
              </span>
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Transporter / Fleet Manager */}
              <div className="bg-[#141C2B]/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full tracking-wider uppercase">
                      Dispatch Lead
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white font-heading">
                    Transporter / Fleet Manager
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Full oversight of loads, Live Fleet Tracking map, multi-route recommendations, driver approvals, and backhaul optimization.
                  </p>

                  <div className="mt-5 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Dedicated Live Fleet Tracking & Route Engine</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Live Profit & Fuel Sensitivity Math</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Instant Return Load Locking & Audit Trail</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEnterManagerSim}
                  className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-indigo-600/25"
                >
                  <span>Enter Manager Portal</span>
                  <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Card 2: Driver Mobile Portal */}
              <div className="bg-[#141C2B]/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 rounded-full tracking-wider uppercase">
                      Verified Operator
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white font-heading">
                    Driver Mobile Portal
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    My Trip Map with real smartphone GPS sharing, 9-stage delivery workflow, automatic route target switching, and e-POD.
                  </p>

                  {/* Driver profile selector */}
                  <div className="mt-5">
                    <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Select Driver Profile:
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        className="w-full appearance-none bg-[#0B0F17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer pr-10"
                      >
                        {DRIVERS.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} ({driver.assignedVehicleId || '10T Multi-Axle'} • Trust {driver.reliabilityScore}/100)
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEnterDriverSim}
                  className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-emerald-600/25"
                >
                  <span>Enter Driver Portal</span>
                  <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Enterprise Credentials Form (Production RBAC) */
          <div className="max-w-md mx-auto bg-[#141C2B] p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-heading">
                  Enterprise RBAC Sign In
                </h3>
                <p className="text-xs text-slate-400">
                  Strict role isolation (Drivers cannot access Manager routes)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#0B0F17] p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEnterpriseRole('manager');
                  setEnterpriseError(null);
                }}
                className={`py-2 rounded-lg font-bold cursor-pointer transition-all ${
                  enterpriseRole === 'manager'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fleet Manager
              </button>
              <button
                type="button"
                onClick={() => {
                  setEnterpriseRole('driver');
                  setEnterpriseError(null);
                }}
                className={`py-2 rounded-lg font-bold cursor-pointer transition-all ${
                  enterpriseRole === 'driver'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fleet Driver
              </button>
            </div>

            <form onSubmit={handleEnterpriseSubmit} className="space-y-3.5">
              {enterpriseRole === 'manager' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Manager Email
                    </label>
                    <input
                      type="email"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      required
                      placeholder="manager@haulsense.in"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-[#0B0F17] text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={managerPassword}
                      onChange={(e) => setManagerPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-[#0B0F17] text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Driver Operator ID
                    </label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-[#0B0F17] text-white focus:outline-none focus:border-emerald-500"
                    >
                      {DRIVERS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.id} — {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      4-Digit Driver PIN
                    </label>
                    <input
                      type="password"
                      value={driverPin}
                      onChange={(e) => setDriverPin(e.target.value)}
                      required
                      placeholder="1234"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-[#0B0F17] text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </>
              )}

              {enterpriseError && (
                <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs">
                  {enterpriseError}
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-3 px-4 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  enterpriseRole === 'manager'
                    ? 'bg-indigo-600 hover:bg-indigo-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                <span>
                  {enterpriseRole === 'manager'
                    ? 'Authorize Manager Session'
                    : 'Authorize Driver Session'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>HaulSense Logistics Decision Intelligence © 2026</span>
          <div className="flex items-center gap-3">
            <span>Chennai • Bengaluru • Madurai Corridor</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => navigate('/diagnostics')}
              className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
            >
              Diagnostics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
