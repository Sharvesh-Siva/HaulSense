/**
 * HaulSense - Driver Notifications & Operational Dispatch Alerts
 */

import React from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Package,
  Layers,
  RotateCw,
} from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';

interface NotificationsModalProps {
  onClose: () => void;
}

export const DriverNotificationsModal: React.FC<NotificationsModalProps> = ({ onClose }) => {
  const { notifications, markNotificationAsRead, clearNotifications } = useLogistics();

  const driverNotifs = notifications.filter(
    (n) => n.targetRole === 'driver' || n.targetRole === 'all'
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0D131F] border border-slate-700 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#121A29] px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-sm">
                Driver Dispatch Notifications
              </h3>
              <p className="text-[11px] text-slate-400">
                {driverNotifs.filter((n) => !n.read).length} unread alerts from Fleet Dispatch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {driverNotifs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              All caught up! No active dispatch notifications.
            </div>
          ) : (
            driverNotifs.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  n.read
                    ? 'bg-[#101622] border-slate-800/80 opacity-70'
                    : 'bg-[#152032] border-emerald-800/60 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {n.type === 'mismatch_alert' ||
                    n.type === 'incident' ||
                    n.type === 'route_deviation' ||
                    n.type === 'fuel_anomaly' ||
                    n.type === 'delay_alert' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : n.type === 'return_load_match' ? (
                      <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Package className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <span className="font-bold text-white font-heading">{n.title}</span>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed mb-2">{n.message}</p>
                {n.telemetryMetric && (
                  <div className="mb-2">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] text-cyan-300">
                      {n.telemetryMetric}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Source: {n.source.toUpperCase()}</span>
                  <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-[#101724] border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={clearNotifications}
            className="text-xs text-slate-400 hover:text-red-400 font-medium px-2 py-1 transition-colors"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
