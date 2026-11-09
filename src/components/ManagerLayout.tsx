/**
 * HaulSense - Manager Operations Layout
 * Upgraded with:
 * - Unique navigation item keys (fixing duplicate '/manager/agent/S-GOLDEN' key warning)
 * - Dedicated 'Live Fleet Tracking' (/manager/tracking) navigation entry
 * - Functional Manager ↔ Driver Workspace Switcher backed by AuthContext RBAC
 * - Security & Operational Audit Log quick-inspector modal
 */

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Inbox,
  Send,
  Truck,
  LineChart,
  Sliders,
  TrendingUp,
  Bell,
  Settings,
  RotateCw,
  LogOut,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  X,
  MessageSquare,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import { Emblem } from './Emblem';
import { useAuth } from '../context/AuthContext';
import { useLogistics } from '../context/LogisticsContext';
import { TripChatDrawer } from './TripChatDrawer';
import { RealtimeAlertBanner } from './RealtimeAlertBanner';

export const ManagerLayout: React.FC = () => {
  const { user, isDevSimulatorMode, setDevSimulatorMode, switchWorkspace, logout } = useAuth();
  const { notifications, markNotificationAsRead, auditLogs, refreshAuditLogs } = useLogistics();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const managerNotifs = notifications.filter(
    (n) => n.targetRole === 'manager' || n.targetRole === 'all'
  );
  const unreadCount = managerNotifs.filter((n) => !n.read).length;

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  const handleSwitchToDriver = () => {
    const res = switchWorkspace('driver', { forceDevSimulator: true });
    if (res.success) {
      navigate('/driver');
    }
  };

  const navItems = [
    { id: 'ops-control', label: 'Operations Control', path: '/manager', icon: LayoutDashboard, end: true },
    { id: 'live-tracking', label: 'Live Fleet Tracking', path: '/manager/tracking', icon: Compass, badge: 'LIVE' },
    { id: 'corridor-loads', label: 'Corridor Loads', path: '/manager/shipments', icon: Layers },
    { id: 'driver-requests', label: 'Driver Requests', path: '/manager/drivers', icon: Inbox, badge: '1' },
    { id: 'trip-lifecycle', label: 'Trip Lifecycle', path: '/manager/agent/S-GOLDEN', icon: Send },
    { id: 'fleet-trucks', label: 'Fleet & Trucks', path: '/manager/vehicles', icon: Truck },
    { id: 'trip-comms', label: 'Trip Comms (Chat)', path: '/manager/chat', icon: MessageSquare },
    { id: 'analytics-7', label: 'Analytics Dashboards (7)', path: '/manager/returns', icon: LineChart, hasDropdown: true },
    { id: 'simulator', label: 'Simulator', path: '/manager/agent/S-CASE-B', icon: Sliders },
    { id: 'fleet-profit', label: 'Fleet Profit', path: '/manager/agent/S-CASE-A', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F3F4F6] flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Operations Header */}
      <header className="bg-[#0E1420] border-b border-slate-800/80 px-4 md:px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-md">
        {/* Brand Section */}
        <div className="flex items-center gap-3">
          <Emblem size={34} onClick={() => navigate('/manager')} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-base tracking-tight text-white">
                HaulSense
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold uppercase">
                MVP 2026
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">
              {user?.name || 'Karthik Subramanian'} • Fleet Operations Control
            </span>
          </div>
        </div>

        {/* Right utility toolbar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification bell with live badge and dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}

            {/* Notification Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0D131F] border border-slate-700 shadow-2xl z-50 overflow-hidden text-xs">
                <div className="p-3 bg-[#121A29] border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white font-heading">Dispatch & Telemetry Alerts</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotifDropdown(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto p-2 space-y-2">
                  {managerNotifs.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">No active alerts</div>
                  ) : (
                    managerNotifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          n.read
                            ? 'bg-[#0E1522] border-slate-800/80 opacity-70'
                            : 'bg-[#141C2B] border-indigo-700/60 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white flex items-center gap-1.5 font-heading">
                            {n.type === 'mismatch_alert' ||
                            n.type === 'incident' ||
                            n.type === 'route_deviation' ||
                            n.type === 'fuel_anomaly' ||
                            n.type === 'delay_alert' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                            )}
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                          From {n.source.toUpperCase()} •{' '}
                          {new Date(n.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live Trip Dispatch Chat with Driver */}
          <button
            type="button"
            onClick={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
            className={`p-1.5 rounded-lg transition-colors relative cursor-pointer flex items-center gap-1.5 ${
              isChatDrawerOpen
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Live Corridor Chat with Driver (Ravi Kumar)"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline text-xs font-semibold text-slate-300">
              Trip Chat
            </span>
          </button>

          {/* Security & Audit Log Button */}
          <button
            type="button"
            onClick={() => {
              refreshAuditLogs();
              setIsAuditModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Security & Operational Audit Logs"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => refreshAuditLogs()}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Sync Live Telemetry"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Functional Manager / Driver Workspace Switcher */}
          <div className="bg-[#080C13] p-0.5 rounded-lg border border-slate-800 flex items-center text-xs">
            <button
              type="button"
              onClick={() => navigate('/manager')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                location.pathname.startsWith('/manager')
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Manager
            </button>
            <button
              type="button"
              onClick={handleSwitchToDriver}
              className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                location.pathname.startsWith('/driver')
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
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

      {/* Horizontal Operational Tab Navigation Bar */}
      <nav className="bg-[#0E1420]/90 border-b border-slate-800 px-4 md:px-6 py-1.5 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-950/90 text-indigo-400 border border-indigo-800/80 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`
            }
          >
            <item.icon className="w-3.5 h-3.5 shrink-0" />
            <span>{item.label}</span>
            {item.badge && (
              <span
                className={`px-1.5 py-0.2 rounded-full font-mono text-[9px] font-bold flex items-center justify-center ${
                  item.badge === 'LIVE'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                    : 'bg-amber-500 text-slate-950'
                }`}
              >
                {item.badge}
              </span>
            )}
            {item.hasDropdown && (
              <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Real-Time Telemetry & Critical Trip Alert Banner */}
      <RealtimeAlertBanner role="manager" />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-8 overflow-y-auto">
        <Outlet />
      </main>

      {/* Floating / Slide-out Trip Dispatch Chat Drawer */}
      <TripChatDrawer
        tripId="S-GOLDEN"
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
      />

      {/* Security & Operational Audit Log Modal (Phase 10) */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D131F] border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-xs">
            <div className="p-4 bg-[#121A29] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-white text-sm font-heading">
                    Security & Operational Audit Trail
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Verified RBAC events, GPS telemetry sessions, and lifecycle state transitions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDevSimulatorMode}
                    onChange={(e) => setDevSimulatorMode(e.target.checked)}
                    className="rounded border-slate-700"
                  />
                  <span>Dev Role Simulator Mode</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#090D16] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          log.status === 'denied'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="font-bold text-white">{log.actorName}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        ({log.actorRole} • {log.targetRecord})
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1">{log.details}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
