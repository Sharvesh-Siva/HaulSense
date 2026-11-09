/**
 * HaulSense - Driver My Trips Page (/driver/trips)
 * Categorized view of Upcoming, Active, and Completed corridor hauls.
 * Detailed trip manifest drawer with load requirements, assigned vehicle audit,
 * lifecycle progression, and incident reporting.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Truck,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  IndianRupee,
  Calendar,
  Layers,
  FileText,
  MapPin,
  Navigation,
  X,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLogistics } from '../../context/LogisticsContext';
import { formatDateTime, formatINR } from '../../utils';
import { Shipment, TripLifecycleStatus } from '../../types';

export const DriverTripsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shipments, vehicles, updateTripLifecycle, reportIncident } = useLogistics();

  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'completed'>('active');
  const [selectedTrip, setSelectedTrip] = useState<Shipment | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [issueCategory, setIssueCategory] = useState<'traffic_delay' | 'vehicle_issue' | 'loading_delay' | 'customer_delay'>('traffic_delay');
  const [issueSeverity, setIssueSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueReportedToast, setIssueReportedToast] = useState(false);

  // Categorize shipments
  const activeTrips = shipments.filter(
    (s) =>
      s.status !== 'delivered' &&
      s.lifecycleStatus !== 'delivered' &&
      s.lifecycleStatus !== 'completed' &&
      (s.lifecycleStatus !== 'assigned' || s.id === 'S-GOLDEN')
  );

  const upcomingTrips = shipments.filter(
    (s) => s.lifecycleStatus === 'assigned' && s.id !== 'S-GOLDEN'
  );

  const completedTrips = shipments.filter(
    (s) => s.status === 'delivered' || s.lifecycleStatus === 'delivered' || s.lifecycleStatus === 'completed'
  );

  const displayedTrips =
    activeTab === 'active'
      ? activeTrips
      : activeTab === 'upcoming'
      ? upcomingTrips
      : completedTrips;

  const handleAdvanceStatus = (trip: Shipment) => {
    const order: TripLifecycleStatus[] = [
      'assigned',
      'accepted',
      'heading_to_pickup',
      'arrived_at_pickup',
      'goods_collected',
      'heading_to_delivery',
      'arrived_at_delivery',
      'delivered',
      'completed',
    ];
    const current = trip.lifecycleStatus || 'assigned';
    const normalized =
      current === 'pickup'
        ? 'arrived_at_pickup'
        : current === 'in_transit'
        ? 'heading_to_delivery'
        : current;
    const idx = order.indexOf(normalized);
    const next: TripLifecycleStatus = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : 'completed';

    updateTripLifecycle(trip.id, next);
    if (selectedTrip?.id === trip.id) {
      setSelectedTrip({ ...trip, lifecycleStatus: next });
    }
  };

  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip || !issueDesc.trim()) return;

    reportIncident({
      tripId: selectedTrip.id,
      category: issueCategory,
      severity: issueSeverity,
      description: issueDesc,
    });

    setIssueReportedToast(true);
    setTimeout(() => {
      setIssueReportedToast(false);
      setIsReportOpen(false);
      setIssueDesc('');
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white font-heading">
            My Corridor Trips
          </h1>
          <p className="text-xs text-slate-400">
            Assigned freight contracts, active corridor runs, and historical haul settlements.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="inline-flex rounded-xl border border-slate-800 bg-[#0E1522] p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({activeTrips.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upcoming ({upcomingTrips.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({completedTrips.length})
          </button>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedTrips.map((trip) => {
          const veh = vehicles.find((v) => v.id === trip.assignedVehicleId) || vehicles[0];
          return (
            <div
              key={trip.id}
              onClick={() => setSelectedTrip(trip)}
              className="bg-[#0E1522] border border-slate-800 hover:border-emerald-600/60 rounded-2xl p-4.5 shadow-md flex flex-col justify-between transition-all cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">{trip.id}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
                      {(trip.lifecycleStatus || 'assigned').replace('_', ' ')}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    {formatINR(trip.driverCost || 2500)}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white font-heading group-hover:text-emerald-400 transition-colors">
                    {trip.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{trip.origin}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span>{trip.destination}</span>
                    <span className="text-slate-500 font-mono">({trip.distanceKm} km)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#090D14] border border-slate-800/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Cargo:</span>
                    <span className="text-slate-200 font-medium capitalize">
                      {trip.cargoType} ({trip.weightTons}T)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Assigned Vehicle:</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {veh.plateNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Pickup: {formatDateTime(trip.departureTime)}</span>
                </div>
                <span className="text-emerald-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5 text-xs">
                  Details <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* TRIP DETAIL DRAWER / MODAL */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0D131F] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#121A29] px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">{selectedTrip.id}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
                    {(selectedTrip.lifecycleStatus || 'assigned').replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-white text-base mt-0.5">
                  {selectedTrip.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              {/* Route & Earnings banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-800/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-emerald-300 font-mono uppercase">
                    Corridor Transit
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {selectedTrip.origin} → {selectedTrip.destination} ({selectedTrip.distanceKm} km)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Driver Compensation</div>
                  <div className="text-base font-bold font-mono text-emerald-400">
                    {formatINR(selectedTrip.driverCost || 2500)}
                  </div>
                </div>
              </div>

              {/* Load Requirements Breakdown */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 uppercase font-mono tracking-wider text-[11px]">
                  Load Requirement Profile
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-[#090D14] border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Cargo Type</span>
                    <span className="font-bold text-white capitalize">{selectedTrip.cargoType}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#090D14] border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Cargo Weight</span>
                    <span className="font-bold text-white font-mono">{selectedTrip.weightTons} Tons</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#090D14] border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Cargo Volume</span>
                    <span className="font-bold text-white font-mono">
                      {selectedTrip.requirements?.cargoVolumeM3 || 22} m³
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#090D14] border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Required Vehicle</span>
                    <span className="font-bold text-white">
                      {selectedTrip.requirements?.requiredVehicleType || 'Medium Truck'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#090D14] border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Required Body</span>
                    <span className="font-bold text-white">
                      {selectedTrip.requirements?.requiredBodyType || 'Closed Container'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#090D14] border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Temperature</span>
                    <span className="font-bold text-white capitalize">
                      {selectedTrip.requirements?.temperatureRequirement || 'Ambient'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned Vehicle Audit */}
              {(() => {
                const veh =
                  vehicles.find((v) => v.id === selectedTrip.assignedVehicleId) || vehicles[0];
                return (
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-200 uppercase font-mono tracking-wider text-[11px]">
                      Assigned Vehicle Assessment
                    </h4>
                    <div className="p-3.5 rounded-xl bg-[#090D14] border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Truck className="w-6 h-6 text-emerald-400 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white font-mono text-sm">
                              {veh.plateNumber}
                            </span>
                            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                              {veh.vehicleType}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Payload: {veh.capacityTons}T • Body: {veh.bodyType} • Health: {veh.health.overallScore}%
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-1 rounded-lg border border-emerald-800">
                        Compatible (96%)
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Proof of Delivery if captured */}
              {selectedTrip.proofOfDelivery && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-1.5">
                  <div className="text-[11px] font-bold font-mono text-emerald-400 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Digital Proof of Delivery (e-POD) Verified
                  </div>
                  <div className="text-xs text-slate-200">
                    Receiver: <span className="font-bold text-white">{selectedTrip.proofOfDelivery.receiverName}</span> • Code:{' '}
                    <span className="font-mono uppercase text-emerald-300">{selectedTrip.proofOfDelivery.receiverConfirmationCode}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{selectedTrip.proofOfDelivery.deliveryNotes}</div>
                </div>
              )}

              {/* Auditable Shipment Event Timeline */}
              {selectedTrip.timeline && selectedTrip.timeline.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-200 uppercase font-mono tracking-wider text-[11px]">
                    Auditable Trip Event Timeline ({selectedTrip.timeline.length})
                  </h4>
                  <div className="p-3 rounded-xl bg-[#090D14] border border-slate-800 space-y-2 max-h-40 overflow-y-auto">
                    {selectedTrip.timeline.map((evt) => (
                      <div key={evt.id} className="flex items-start justify-between gap-2 border-b border-slate-800/60 pb-1.5 last:border-0 last:pb-0">
                        <div>
                          <span className="text-[11px] font-bold text-emerald-400 uppercase font-mono">
                            {evt.title}
                          </span>
                          <p className="text-[11px] text-slate-300">{evt.description}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons: Open Trip Map, Advance lifecycle, or Report issue */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#1C1518] hover:bg-[#2A1E22] border border-red-900/60 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>Report Delay / Issue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/driver/trip-map/${selectedTrip.id}`)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/70 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open Trip Map & Live GPS</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdvanceStatus(selectedTrip)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <span>
                    Advance Status →{' '}
                    {(selectedTrip.lifecycleStatus || 'assigned').replace(/_/g, ' ').toUpperCase()}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT ISSUE MODAL */}
      {isReportOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0D131F] border border-red-900/80 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-heading font-bold text-white text-base">
                  Report Incident on Trip {selectedTrip.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIssue} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Issue Category</label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value as any)}
                  className="w-full bg-[#080C13] border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
                >
                  <option value="traffic_delay">Traffic / Highway Jam</option>
                  <option value="vehicle_issue">Vehicle Breakdown / Puncture</option>
                  <option value="loading_delay">Warehouse / Dock Loading Delay</option>
                  <option value="customer_delay">Consignee Unloading Delay</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Severity</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setIssueSeverity(sev)}
                      className={`py-1.5 rounded-lg font-bold uppercase font-mono text-[10px] border cursor-pointer ${
                        issueSeverity === sev
                          ? sev === 'high'
                            ? 'bg-red-950 text-red-400 border-red-700'
                            : 'bg-amber-950 text-amber-400 border-amber-700'
                          : 'bg-[#080C13] text-slate-400 border-slate-800'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description / Location</label>
                <textarea
                  rows={3}
                  required
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder="E.g., Highway toll delay on NH-48 near Kanchipuram. Expected delay: 45 mins."
                  className="w-full bg-[#080C13] border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              {issueReportedToast && (
                <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-center font-bold">
                  ✓ Incident transmitted to Fleet Manager console!
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Transmit Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
