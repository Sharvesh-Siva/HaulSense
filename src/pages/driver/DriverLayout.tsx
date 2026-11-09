/**
 * HaulSense - Driver Workspace Shell & Navigation Layout
 * Upgraded with:
 * - Dedicated 'My Trip Map' (/driver/trip-map) navigation item
 * - RBAC-enforced Manager / Driver workspace switcher (blocks unauthorized driver elevation in strict Production mode while allowing Dev Role Simulator or Manager Auth)
 */

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Truck,
  Layers,
  Sparkles,
  ShieldCheck,
  IndianRupee,
  Activity,
  FileText,
  Compass,
  LogOut,
  Bell,
  Sliders,
  Send,
  User,
  MessageSquare,
  MapPin,
  Lock,
  X,
} from 'lucide-react';
import { Emblem } from '../../components/Emblem';
import { useAuth } from '../../context/AuthContext';
import { useLogistics } from '../../context/LogisticsContext';
import { DriverAssistModal } from './DriverAssistModal';
import { DriverNotificationsModal } from './DriverNotificationsModal';
import { DriverProfileModal } from './DriverProfileModal';
import { TripChatDrawer } from '../../components/TripChatDrawer';
import { RealtimeAlertBanner } from '../../components/RealtimeAlertBanner';

export const DriverLayout: React.FC = () => {
  const { user, loginManager, switchWorkspace, logout } = useAuth();
  const { drivers, notifications, isGpsTrackingActive, updateDriverAvailability } =
    useLogistics();
  const navigate = useNavigate();

  const currentDriver = drivers.find((d) => d.id === user?.driverId) || drivers[0];
  const [isAssistOpen, setIsAssistOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  // Manager Auth Prompt when a strict production Driver clicks "Manager"
  const [showManagerAuthModal, setShowManagerAuthModal] = useState(false);
  const [mgrEmail, setMgrEmail] = useState('manager@haulsense.in');
  const [mgrPass, setMgrPass] = useState('haul123');
  const [mgrAuthError, setMgrAuthError] = useState<string | null>(null);

  const unreadNotifs = notifications.filter(
    (n) => (n.targetRole === 'driver' || n.targetRole === 'all') && !n.read
  ).length;

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  const handleSwitchToManager = () => {
    const res = switchWorkspace('manager');
    if (res.success) {
      navigate('/manager');
    } else {
      setMgrAuthError(res.error || null);
      setShowManagerAuthModal(true);
    }
  };

  const handleAuthorizeManagerSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    const res = loginManager(mgrEmail, mgrPass, false);
    if (res.success) {
      setShowManagerAuthModal(false);
      navigate('/manager');
    } else {
      setMgrAuthError(res.error || 'Invalid Manager credentials');
    }
  };

  const navItems = [
    { id: 'drv-overview', label: 'Overview', path: '/driver', icon: Compass, end: true },
    { id: 'drv-trip-map', label: 'My Trip Map (GPS)', path: '/driver/trip-map', icon: MapPin, badge: isGpsTrackingActive ? 'GPS LIVE' : undefined },
    { id: 'drv-trips', label: 'My Trips', path: '/driver/trips', icon: Send },
    { id: 'drv-chat', label: 'Dispatch Chat', path: '/driver/chat', icon: MessageSquare },
    { id: 'drv-vehicles', label: 'My Vehicles', path: '/driver/vehicles', icon: Truck },
    { id: 'drv-matching', label: 'Vehicle Matching', path: '/driver/matching', icon: Sliders },
    { id: 'drv-loads', label: 'Load Opportunities', path: '/driver/loads', icon: Layers },
    { id: 'drv-earnings', label: 'Earnings', path: '/driver/earnings', icon: IndianRupee },
    { id: 'drv-trust', label: 'Trust Passport', path: '/driver/trust', icon: ShieldCheck },
    { id: 'drv-health', label: 'Vehicle Health', path: '/driver/health', icon: Activity },
    { id: 'drv-docs', label: 'Documents', path: '/driver/documents', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F3F4F6] flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Operations Header */}
      <header className="bg-[#0E1420] border-b border-slate-800/80 px-4 md:px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-md">
        {/* Brand & Driver Identity */}
        <div className="flex items-center gap-3">
          <Emblem size={34} onClick={() => navigate('/driver')} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-base tracking-tight text-white">
                HaulSense
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/70 font-bold uppercase tracking-wider">
                Driver Portal
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="text-[10px] text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1 hover:text-emerald-400 transition-colors text-left"
            >
              <span>{currentDriver.name}</span>
              <span className="text-slate-600">•</span>
              <span>Trust {currentDriver.reliabilityScore}/100</span>
            </button>
          </div>
        </div>

        {/* Right utility toolbar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Availability Status Selector */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#080C13] px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                currentDriver.status === 'available'
                  ? 'bg-emerald-400 animate-pulse'
                  : currentDriver.status === 'on_trip'
                  ? 'bg-blue-400'
                  : 'bg-amber-400'
              }`}
            />
            <select
              value={currentDriver.status}
              onChange={(e) => updateDriverAvailability(currentDriver.id, e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer font-mono"
            >
              <option value="available">Available</option>
              <option value="on_trip">On Trip</option>
              <option value="available_after_delivery">Available After Delivery</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          {/* Live Dispatch Comms Chat */}
          <button
            type="button"
            onClick={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
            className={`p-1.5 rounded-xl transition-all relative cursor-pointer flex items-center gap-1.5 ${
              isChatDrawerOpen
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Live Dispatch Comms with Manager (Karthik S)"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline text-xs font-semibold text-slate-300">
              Dispatch Chat
            </span>
          </button>

          {/* AI Driver Assist Button */}
          <button
            type="button"
            onClick={() => setIsAssistOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span className="hidden md:inline">Driver Assist</span>
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Dispatch Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-[#070A0F] font-bold text-[9px] rounded-full flex items-center justify-center font-mono animate-pulse">
                {unreadNotifs}
              </span>
            )}
          </button>

          {/* Profile / Preferences */}
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Profile & Preferences"
          >
            <User className="w-4 h-4" />
          </button>

          {/* Manager / Driver Toggle */}
          <div className="bg-[#080C13] p-0.5 rounded-lg border border-slate-800 flex items-center text-xs">
            <button
              type="button"
              onClick={handleSwitchToManager}
              className="px-3 py-1 rounded-md font-medium text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => navigate('/driver')}
              className="px-3 py-1 rounded-md font-bold bg-emerald-600 text-white shadow-sm transition-all cursor-pointer"
            >
              Driver
            </button>
          </div>

          {/* Sign Out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Horizontal Driver Sub-Navigation Bar */}
      <nav className="bg-[#0E1420]/90 border-b border-slate-800 px-4 md:px-6 py-1.5 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/80 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`
            }
          >
            <item.icon className="w-3.5 h-3.5 shrink-0" />
            <span>{item.label}</span>
            {item.badge && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-mono text-[9px] font-bold">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Real-Time Telemetry & Critical Trip Alert Banner */}
      <RealtimeAlertBanner role="driver" />

      {/* Main View Outlet */}
      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-8 overflow-y-auto">
        <Outlet />
      </main>

      {/* AI Driver Assist Modal */}
      {isAssistOpen && (
        <DriverAssistModal onClose={() => setIsAssistOpen(false)} driver={currentDriver} />
      )}

      {/* Notifications Modal */}
      {isNotifOpen && (
        <DriverNotificationsModal onClose={() => setIsNotifOpen(false)} />
      )}

      {/* Profile & Preferences Modal */}
      {isProfileOpen && (
        <DriverProfileModal onClose={() => setIsProfileOpen(false)} driver={currentDriver} />
      )}

      {/* Floating / Slide-out Dispatch Chat Drawer */}
      <TripChatDrawer
        tripId="S-GOLDEN"
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
      />

      {/* RBAC Manager Authorization Required Modal when in Production Driver Mode */}
      {showManagerAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1524] border border-indigo-700/80 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Lock className="w-4 h-4" />
                <h3 className="text-sm font-bold text-white font-heading">
                  Manager Portal Authorization Required
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManagerAuthModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {mgrAuthError && (
              <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-700/70 text-amber-200 text-[11px]">
                {mgrAuthError}
              </div>
            )}

            <form onSubmit={handleAuthorizeManagerSwitch} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Manager Email
                </label>
                <input
                  type="email"
                  required
                  value={mgrEmail}
                  onChange={(e) => setMgrEmail(e.target.value)}
                  className="w-full bg-[#080C14] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Manager Password
                </label>
                <input
                  type="password"
                  required
                  value={mgrPass}
                  onChange={(e) => setMgrPass(e.target.value)}
                  className="w-full bg-[#080C14] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const simRes = switchWorkspace('manager', { forceDevSimulator: true });
                    if (simRes.success) {
                      setShowManagerAuthModal(false);
                      navigate('/manager');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold cursor-pointer"
                >
                  Use Dev Role Simulator
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                >
                  Authorize & Enter Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
