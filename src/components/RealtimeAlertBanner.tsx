/**
 * HaulSense - Real-Time Critical Trip Notification Banner & Telemetry Alert Center
 * Alerts Fleet Managers and Drivers in real time about critical trip status changes:
 * - Transit Delays (delay_alert)
 * - CAN-Bus Fuel Anomalies (fuel_anomaly)
 * - GPS Corridor Route Deviations (route_deviation)
 * - Trip Lifecycle Status Transitions & Incidents (status_change, incident, mismatch_alert)
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Fuel,
  MapPin,
  Navigation,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { useLogistics, AppNotification } from '../context/LogisticsContext';

interface RealtimeAlertBannerProps {
  role: 'manager' | 'driver';
}

export const RealtimeAlertBanner: React.FC<RealtimeAlertBannerProps> = ({ role }) => {
  const navigate = useNavigate();
  const {
    notifications,
    acknowledgeNotification,
    reportTripDelay,
    reportFuelAnomaly,
    reportRouteDeviation,
  } = useLogistics();

  const [isExpanded, setIsExpanded] = useState(false);
  const [filterType, setFilterType] = useState<
    'all' | 'delay_alert' | 'fuel_anomaly' | 'route_deviation' | 'status_change'
  >('all');

  const roleNotifications = useMemo(
    () =>
      notifications.filter(
        (n) => (n.targetRole === role || n.targetRole === 'all') && !n.read && !n.acknowledged
      ),
    [notifications, role]
  );

  const filteredAlerts = useMemo(
    () =>
      filterType === 'all'
        ? roleNotifications
        : roleNotifications.filter((n) => n.type === filterType),
    [roleNotifications, filterType]
  );

  // Pick the highest priority unread alert for the top bar
  const topAlert: AppNotification | undefined = useMemo(() => {
    const critical = roleNotifications.find((n) => n.severity === 'critical');
    if (critical) return critical;
    const warning = roleNotifications.find((n) => n.severity === 'warning');
    if (warning) return warning;
    return roleNotifications[0];
  }, [roleNotifications]);

  if (!topAlert) {
    return null;
  }

  const getAlertIcon = (type: AppNotification['type']) => {
    if (type === 'fuel_anomaly') return <Fuel className="w-4 h-4 text-amber-400 shrink-0" />;
    if (type === 'route_deviation') return <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />;
    if (type === 'delay_alert') return <Clock className="w-4 h-4 text-amber-400 shrink-0" />;
    if (type === 'incident' || type === 'mismatch_alert')
      return <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />;
    return <Bell className="w-4 h-4 text-cyan-400 shrink-0" />;
  };

  const getAlertBadgeLabel = (type: AppNotification['type']) => {
    switch (type) {
      case 'fuel_anomaly':
        return 'FUEL ANOMALY';
      case 'route_deviation':
        return 'ROUTE DEVIATION';
      case 'delay_alert':
        return 'TRANSIT DELAY';
      case 'incident':
        return 'INCIDENT ALERT';
      case 'mismatch_alert':
        return 'VEHICLE MISMATCH';
      case 'status_change':
        return 'TRIP STATUS';
      default:
        return 'DISPATCH ALERT';
    }
  };

  const handleInspectOnMap = (alert: AppNotification) => {
    if (role === 'manager') {
      navigate('/manager/tracking');
    } else {
      navigate(
        alert.relatedShipmentId
          ? `/driver/trip-map/${alert.relatedShipmentId}`
          : '/driver/trip-map'
      );
    }
  };

  const isCritical = topAlert.severity === 'critical';
  const isWarning = topAlert.severity === 'warning';

  return (
    <div
      className={`border-b transition-all ${
        isCritical
          ? 'bg-gradient-to-r from-red-950/85 via-[#181118] to-[#0E1420] border-red-800/80'
          : isWarning
          ? 'bg-gradient-to-r from-amber-950/75 via-[#181612] to-[#0E1420] border-amber-800/70'
          : 'bg-gradient-to-r from-cyan-950/70 via-[#0F1826] to-[#0E1420] border-cyan-800/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        {/* Left: Primary Alert Info */}
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 mt-1.5 sm:mt-0 animate-ping ${
              isCritical ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-cyan-400'
            }`}
          />
          {getAlertIcon(topAlert.type)}
          <span
            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
              isCritical
                ? 'bg-red-950 text-red-300 border-red-700'
                : isWarning
                ? 'bg-amber-950 text-amber-300 border-amber-700'
                : 'bg-cyan-950 text-cyan-300 border-cyan-700'
            }`}
          >
            {getAlertBadgeLabel(topAlert.type)}
          </span>

          <div className="min-w-0 flex-1">
            <span className="font-bold text-white mr-2">{topAlert.title}</span>
            <span className="text-slate-300 hidden md:inline">{topAlert.message}</span>
          </div>

          {topAlert.telemetryMetric && (
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full bg-black/40 border border-slate-700 font-mono text-[10px] text-cyan-300 shrink-0">
              {topAlert.telemetryMetric}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleInspectOnMap(topAlert)}
            className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Navigation className="w-3 h-3 text-cyan-400" />
            <span>Locate on Map</span>
          </button>

          <button
            type="button"
            onClick={() => acknowledgeNotification(topAlert.id)}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/70 text-emerald-300 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Acknowledge</span>
          </button>

          {roleNotifications.length > 1 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <span>All ({roleNotifications.length})</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Full Real-Time Alert Queue & Filter Drawer */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-3 pt-1.5 border-t border-slate-800/80 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: `All Active (${roleNotifications.length})` },
                  { id: 'route_deviation', label: 'Route Deviations' },
                  { id: 'fuel_anomaly', label: 'Fuel Anomalies' },
                  { id: 'delay_alert', label: 'Transit Delays' },
                  { id: 'status_change', label: 'Status Changes' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                    filterType === tab.id
                      ? 'bg-cyan-600 text-slate-950'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 mr-1">Simulate Live Alert:</span>
              <button
                type="button"
                onClick={() =>
                  reportTripDelay(
                    'S-GOLDEN',
                    'V1',
                    20,
                    'NH-48 Vellore highway lane closure reported via live GPS'
                  )
                }
                className="px-2 py-0.5 rounded bg-amber-950/90 hover:bg-amber-900 border border-amber-700 text-amber-300 font-mono text-[10px] cursor-pointer"
              >
                +Delay
              </button>
              <button
                type="button"
                onClick={() => reportFuelAnomaly('S-GOLDEN', 'V1', 17.4)}
                className="px-2 py-0.5 rounded bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 font-mono text-[10px] cursor-pointer"
              >
                +Fuel Anomaly
              </button>
              <button
                type="button"
                onClick={() =>
                  reportRouteDeviation('S-GOLDEN', 'V1', 1950, 'Krishnagiri Toll Interchange')
                }
                className="px-2 py-0.5 rounded bg-red-950/90 hover:bg-red-900 border border-red-700 text-red-300 font-mono text-[10px] cursor-pointer"
              >
                +Deviation
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-2.5 rounded-xl bg-[#0B101B]/95 border border-slate-800 flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.type)}
                    <span className="font-bold text-white truncate">{alert.title}</span>
                    {alert.telemetryMetric && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-300 shrink-0">
                        {alert.telemetryMetric}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{alert.message}</p>
                  <div className="text-[10px] font-mono text-slate-500">
                    {new Date(alert.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    • Shipment: {alert.relatedShipmentId || 'FLEET'}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => acknowledgeNotification(alert.id)}
                    className="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[10px] font-bold cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInspectOnMap(alert)}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[10px] font-bold cursor-pointer"
                  >
                    Map
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
