/**
 * HaulSense - Driver Portal: Dedicated My Trip Map, Real Smartphone GPS & 9-Stage Delivery Workflow
 * Phase 5, Phase 6 & Phase 7 Implementation:
 * - Real Smartphone Geolocation API (navigator.geolocation.watchPosition) with explicit permission & stop controls
 * - 9-stage sequential trip workflow:
 *   ASSIGNED → ACCEPTED → HEADING TO PICKUP → ARRIVED AT PICKUP → GOODS COLLECTED → HEADING TO DELIVERY → ARRIVED AT DELIVERY → DELIVERED → COMPLETED
 * - Automatic Route Target Switching:
 *   Before GOODS COLLECTED -> navigates to Pickup Address & Marker
 *   After GOODS COLLECTED  -> automatically switches route to Delivery Destination & Marker
 *   After DELIVERED / COMPLETED -> stops location sharing automatically
 * - Digital Proof of Delivery (e-POD) modal with Receiver Name, Confirmation Code, and Delivery Notes
 * - Multi-Route Recommendation selector for drivers
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Navigation,
  MapPin,
  Truck,
  Radio,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  MessageSquare,
  FileCheck2,
  Route as RouteIcon,
  StopCircle,
  Play,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLogistics } from '../../context/LogisticsContext';
import { CITIES } from '../../data/mockData';
import { RouteAlternative, TripLifecycleStatus } from '../../types';
import { formatDateTime, formatINR } from '../../utils';
import { HistoricalEtaForecastChart } from '../../components/HistoricalEtaForecastChart';

const MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  (typeof process !== 'undefined' && (process.env as any)?.GOOGLE_MAPS_PLATFORM_API_KEY) ||
  '';

const DRIVER_WORKFLOW_STEPS: Array<{
  key: TripLifecycleStatus;
  label: string;
  actionButtonLabel: string;
}> = [
  { key: 'assigned', label: 'Assigned', actionButtonLabel: 'Accept Trip' },
  { key: 'accepted', label: 'Accepted', actionButtonLabel: 'Start Navigation to Pickup' },
  { key: 'heading_to_pickup', label: 'Heading to Pickup', actionButtonLabel: 'Arrived at Pickup' },
  { key: 'arrived_at_pickup', label: 'Arrived at Pickup', actionButtonLabel: 'Confirm Goods Collected' },
  { key: 'goods_collected', label: 'Goods Collected', actionButtonLabel: 'Start Delivery Route' },
  { key: 'heading_to_delivery', label: 'Heading to Delivery', actionButtonLabel: 'Arrived at Delivery' },
  { key: 'arrived_at_delivery', label: 'Arrived at Delivery', actionButtonLabel: 'Confirm Delivery (Record POD)' },
  { key: 'delivered', label: 'Delivered', actionButtonLabel: 'Complete Trip Settlement' },
  { key: 'completed', label: 'Completed', actionButtonLabel: 'Trip Completed ✓' },
];

// Normalize legacy 6-step aliases ('pickup', 'in_transit') into the 9-step sequence index
const resolveWorkflowIndex = (status?: TripLifecycleStatus): number => {
  if (!status) return 0;
  if (status === 'pickup') return 3; // arrived_at_pickup
  if (status === 'in_transit') return 5; // heading_to_delivery
  const idx = DRIVER_WORKFLOW_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
};

interface DriverRoutePolylineProps {
  activePath: Array<{ lat: number; lng: number }>;
  isHeadingToPickup: boolean;
}

const DriverRoutePolyline: React.FC<DriverRoutePolylineProps> = ({
  activePath,
  isHeadingToPickup,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map || activePath.length < 2) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps?.Polyline) return;

    const line = new gmaps.Polyline({
      path: activePath,
      geodesic: true,
      strokeColor: isHeadingToPickup ? '#f59e0b' : '#10b981',
      strokeOpacity: 0.95,
      strokeWeight: 5,
      map,
    });

    if (gmaps.LatLngBounds) {
      const bounds = new gmaps.LatLngBounds();
      activePath.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, 56);
    }

    return () => {
      line.setMap(null);
    };
  }, [map, activePath, isHeadingToPickup]);

  return null;
};

export const DriverTripMapPage: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    shipments,
    vehicles,
    drivers,
    fleetTelemetry,
    isGpsTrackingActive,
    gpsPermissionState,
    gpsError,
    lastGpsUpdateIso,
    startRealGpsTracking,
    stopRealGpsTracking,
    updateTripLifecycle,
    submitProofOfDelivery,
    selectShipmentRoute,
    reportIncident,
  } = useLogistics();

  const currentDriver =
    drivers.find((d) => d.id === user?.driverId) || drivers[0];

  const activeShipment =
    (shipmentId ? shipments.find((s) => s.id === shipmentId) : undefined) ||
    shipments.find((s) => s.assignedDriverId === currentDriver.id && s.status !== 'delivered') ||
    shipments.find((s) => s.id === 'S-GOLDEN') ||
    shipments[0];

  const assignedVehicle =
    vehicles.find((v) => v.id === activeShipment?.assignedVehicleId) ||
    vehicles.find((v) => v.id === currentDriver.assignedVehicleId) ||
    vehicles[0];

  const liveTelemetry = fleetTelemetry[assignedVehicle.id];

  const [routeAlternatives, setRouteAlternatives] = useState<RouteAlternative[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    activeShipment?.selectedRouteId || 'ROUTE-A-NH48'
  );
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [receiverName, setReceiverName] = useState('Suresh Babu (Peenya Warehouse Supervisor)');
  const [receiverCode, setReceiverCode] = useState('POD-BLR-8841');
  const [podNotes, setPodNotes] = useState('All 6.2T FMCG pallets offloaded intact. Container seal #CHN-9921 verified.');

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentType, setIncidentType] = useState<'traffic_delay' | 'vehicle_issue'>('traffic_delay');
  const [incidentText, setIncidentText] = useState('');

  const currentStepIdx = resolveWorkflowIndex(activeShipment?.lifecycleStatus);
  // Before Goods Collected (index < 4), navigation target is Pickup Point.
  // Once Goods Collected (index >= 4), navigation target automatically switches to Delivery Point!
  const isBeforeGoodsCollected = currentStepIdx < 4;

  const originCoord = CITIES[activeShipment.origin] || CITIES.Chennai;
  const destCoord = CITIES[activeShipment.destination] || CITIES.Bengaluru;

  const currentGpsCoord = liveTelemetry
    ? { lat: liveTelemetry.lat, lng: liveTelemetry.lng }
    : { lat: 12.9165, lng: 79.1325 };

  const fetchRoutes = useCallback(async () => {
    try {
      const res = await fetch('/api/routes/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: activeShipment.origin,
          destination: activeShipment.destination,
          vehicleId: assignedVehicle.id,
        }),
      });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.alternatives)) {
        setRouteAlternatives(data.alternatives);
      }
    } catch {
      // ignore
    }
  }, [activeShipment.origin, activeShipment.destination, assignedVehicle.id]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const activeRoute =
    routeAlternatives.find((r) => r.id === selectedRouteId) || routeAlternatives[0];

  // Compute active path based on automatic route switching rule (Phase 6)
  const activeNavigationPath = isBeforeGoodsCollected
    ? [currentGpsCoord, { lat: originCoord.lat, lng: originCoord.lng }]
    : activeRoute?.pathCoordinates || [
        { lat: originCoord.lat, lng: originCoord.lng },
        currentGpsCoord,
        { lat: destCoord.lat, lng: destCoord.lng },
      ];

  const handleNextWorkflowAction = () => {
    const currentStep = DRIVER_WORKFLOW_STEPS[currentStepIdx];
    if (!currentStep) return;

    // If at 'arrived_at_delivery', open Digital Proof of Delivery confirmation modal
    if (currentStep.key === 'arrived_at_delivery') {
      setIsPodModalOpen(true);
      return;
    }

    if (currentStepIdx < DRIVER_WORKFLOW_STEPS.length - 1) {
      const nextStep = DRIVER_WORKFLOW_STEPS[currentStepIdx + 1];
      updateTripLifecycle(
        activeShipment.id,
        nextStep.key,
        currentDriver.name,
        'driver'
      );
    }
  };

  const handleConfirmPod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName.trim()) return;
    submitProofOfDelivery(activeShipment.id, {
      receiverName,
      receiverConfirmationCode: receiverCode,
      deliveryNotes: podNotes,
      verifiedByDriverId: currentDriver.id,
    });
    setIsPodModalOpen(false);
  };

  const handleReportQuickIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentText.trim()) return;
    reportIncident({
      tripId: activeShipment.id,
      category: incidentType,
      severity: incidentType === 'vehicle_issue' ? 'high' : 'medium',
      description: incidentText,
    });
    setIncidentText('');
    setIsIncidentModalOpen(false);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Trip Navigation & Smartphone GPS Sharing Bar */}
      <div className="bg-[#0E1524] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-700 uppercase">
              My Trip Map & Live GPS
            </span>
            <span className="text-xs font-mono text-slate-400">
              Shipment: <strong className="text-white">{activeShipment.id}</strong>
            </span>
            <span className="text-xs font-mono text-cyan-400">
              • Truck: {assignedVehicle.plateNumber}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white font-heading">
            {activeShipment.title}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active Target:{' '}
            <strong className={isBeforeGoodsCollected ? 'text-amber-300' : 'text-emerald-400'}>
              {isBeforeGoodsCollected
                ? `PICKUP TERMINAL — ${activeShipment.pickupAddress || activeShipment.origin}`
                : `DELIVERY DESTINATION — ${activeShipment.deliveryAddress || activeShipment.destination}`}
            </strong>
          </p>
        </div>

        {/* Smartphone Live GPS Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isGpsTrackingActive ? (
            <button
              type="button"
              onClick={() => stopRealGpsTracking('Driver manually paused GPS sharing')}
              className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
            >
              <StopCircle className="w-4 h-4 text-red-400 animate-pulse" />
              <span>Stop Sharing Smartphone GPS</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                startRealGpsTracking(
                  activeShipment.id,
                  assignedVehicle.id,
                  currentDriver.id
                )
              }
              disabled={
                activeShipment.lifecycleStatus === 'delivered' ||
                activeShipment.lifecycleStatus === 'completed'
              }
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer transition-all"
            >
              <Radio className="w-4 h-4" />
              <span>Start Live Smartphone GPS Sharing</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate(`/driver/chat/${activeShipment.id}`)}
            className="px-3.5 py-2.5 rounded-xl bg-[#141F33] hover:bg-[#1B2942] border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Contact Dispatcher</span>
          </button>
        </div>
      </div>

      {/* GPS Status & Browser Background Limitation Notice */}
      <div className="bg-[#0B101B] border border-slate-800/90 rounded-xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isGpsTrackingActive
                  ? 'bg-emerald-400 animate-ping'
                  : 'bg-slate-500'
              }`}
            />
            <strong className="text-white">
              {isGpsTrackingActive
                ? 'LIVE SMARTPHONE GPS ACTIVE'
                : 'GPS SHARING STANDBY'}
            </strong>
          </span>
          {liveTelemetry && (
            <span className="text-slate-400 font-mono">
              Coords: {liveTelemetry.lat.toFixed(4)}°N, {liveTelemetry.lng.toFixed(4)}°E (±
              {liveTelemetry.accuracyMeters}m) • Speed: {liveTelemetry.speedKmh} km/h
            </span>
          )}
          {lastGpsUpdateIso && (
            <span className="text-emerald-400 font-mono text-[11px]">
              Last Sync: {new Date(lastGpsUpdateIso).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            Browser Geolocation streams while this tab is open. Continuous screen-locked tracking requires the native Android Foreground Service app.
          </span>
        </div>
      </div>

      {gpsError && (
        <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-700/80 text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* 9-Stage Sequential Trip Workflow Bar */}
      <div className="bg-[#0E1524] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
              Step {currentStepIdx + 1} of {DRIVER_WORKFLOW_STEPS.length} • Verified Sequential Workflow
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white font-heading">
              Current Stage: {DRIVER_WORKFLOW_STEPS[currentStepIdx]?.label}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIncidentType('traffic_delay');
                setIsIncidentModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/60 text-amber-300 text-xs font-bold cursor-pointer"
            >
              Report Delay
            </button>
            <button
              type="button"
              onClick={() => {
                setIncidentType('vehicle_issue');
                setIsIncidentModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-700/60 text-red-300 text-xs font-bold cursor-pointer"
            >
              Report Breakdown
            </button>

            <button
              type="button"
              onClick={handleNextWorkflowAction}
              disabled={currentStepIdx >= DRIVER_WORKFLOW_STEPS.length - 1}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <span>{DRIVER_WORKFLOW_STEPS[currentStepIdx]?.actionButtonLabel}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 9-step visual progress pills */}
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 pt-1">
          {DRIVER_WORKFLOW_STEPS.map((step, idx) => {
            const isDone = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div
                key={step.key}
                className={`p-2 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                    : isDone
                    ? 'bg-[#090E18] border-emerald-900/60 text-emerald-500'
                    : 'bg-[#080C14] border-slate-800/80 text-slate-500'
                }`}
              >
                <div className="text-[10px] font-mono mb-0.5">
                  {isDone ? '✓' : `0${idx + 1}`}
                </div>
                <div className="text-[10px] leading-tight truncate">{step.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Map + Pickup/Delivery Manifest Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Interactive Driver Navigation Map (2 cols) */}
        <div className="lg:col-span-2 h-[460px] rounded-2xl overflow-hidden border border-slate-800 bg-[#090D16] relative shadow-lg">
          {MAPS_API_KEY ? (
            <APIProvider apiKey={MAPS_API_KEY}>
              <GoogleMap
                defaultCenter={currentGpsCoord}
                defaultZoom={7}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                gestureHandling="greedy"
                className="w-full h-full"
              >
                <DriverRoutePolyline
                  activePath={activeNavigationPath}
                  isHeadingToPickup={isBeforeGoodsCollected}
                />

                {/* Pickup Marker */}
                <AdvancedMarker
                  position={{ lat: originCoord.lat, lng: originCoord.lng }}
                  title={`Pickup Point: ${activeShipment.pickupAddress || activeShipment.origin}`}
                >
                  <Pin
                    background="#10b981"
                    borderColor="#064e3b"
                    glyphColor="#ffffff"
                    scale={isBeforeGoodsCollected ? 1.25 : 1.0}
                  />
                </AdvancedMarker>

                {/* Delivery Marker */}
                <AdvancedMarker
                  position={{ lat: destCoord.lat, lng: destCoord.lng }}
                  title={`Delivery Point: ${activeShipment.deliveryAddress || activeShipment.destination}`}
                >
                  <Pin
                    background="#6366f1"
                    borderColor="#312e81"
                    glyphColor="#ffffff"
                    scale={!isBeforeGoodsCollected ? 1.25 : 1.0}
                  />
                </AdvancedMarker>

                {/* Driver Live Truck Position Marker */}
                <AdvancedMarker
                  position={currentGpsCoord}
                  title={`Your Truck: ${assignedVehicle.plateNumber}`}
                >
                  <div className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-mono text-xs font-extrabold shadow-xl border-2 border-white flex items-center gap-1.5 ring-4 ring-emerald-500/30">
                    <Truck className="w-3.5 h-3.5" />
                    <span>{assignedVehicle.plateNumber}</span>
                  </div>
                </AdvancedMarker>
              </GoogleMap>
            </APIProvider>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
              Map loading...
            </div>
          )}

          {/* Active Navigation Mode Overlay */}
          <div className="absolute top-3 left-3 bg-[#0B101B]/95 border border-slate-800 rounded-xl px-3.5 py-2 shadow-xl text-xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              Automatic Route Target
            </span>
            <span className="font-bold text-emerald-400">
              {isBeforeGoodsCollected
                ? `1. Navigating to Pickup (${activeShipment.origin})`
                : `2. Navigating to Delivery (${activeShipment.destination})`}
            </span>
          </div>
        </div>

        {/* Right Column: Pickup & Delivery Addresses, Route Selection & Audit Timeline */}
        <div className="space-y-4">
          {/* Pickup & Delivery Address Card */}
          <div className="bg-[#0E1524] border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
            <h3 className="font-bold text-white font-heading text-sm">
              Pickup & Delivery Coordinates
            </h3>

            <div
              className={`p-3 rounded-xl border ${
                isBeforeGoodsCollected
                  ? 'bg-emerald-950/30 border-emerald-600/60'
                  : 'bg-[#090D16] border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                  Pickup Terminal {isBeforeGoodsCollected && '• ACTIVE TARGET'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {formatDateTime(activeShipment.departureTime)}
                </span>
              </div>
              <p className="font-semibold text-white">
                {activeShipment.pickupAddress || `${activeShipment.origin} Central Freight Hub`}
              </p>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                !isBeforeGoodsCollected
                  ? 'bg-indigo-950/40 border-indigo-500/70'
                  : 'bg-[#090D16] border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">
                  Delivery Destination {!isBeforeGoodsCollected && '• ACTIVE TARGET'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {formatDateTime(activeShipment.deliveryDeadline)}
                </span>
              </div>
              <p className="font-semibold text-white">
                {activeShipment.deliveryAddress || `${activeShipment.destination} Industrial Dock`}
              </p>
            </div>

            {/* Dispatch Contact Info */}
            <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Dispatch Lead
                </span>
                <span className="font-bold text-white">Karthik Subramanian</span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  +91 44 2819 4400 • Control Desk
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/driver/chat/${activeShipment.id}`)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                Open Chat
              </button>
            </div>
          </div>

          {/* Driver Route Selector */}
          <div className="bg-[#0E1524] border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white font-heading text-sm">
                Recommended Highway Routes
              </h3>
              <RouteIcon className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="space-y-2">
              {routeAlternatives.map((rte) => {
                const isSelected = rte.id === selectedRouteId;
                return (
                  <div
                    key={rte.id}
                    onClick={() => {
                      setSelectedRouteId(rte.id);
                      selectShipmentRoute(activeShipment.id, rte.id, rte.label);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/70'
                        : 'bg-[#090D16] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{rte.label}</span>
                      {rte.isRecommended && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          BEST
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
                      <span>{rte.distanceKm} km</span>
                      <span>{Math.floor(rte.durationMinutes / 60)}h {rte.durationMinutes % 60}m</span>
                      <span>Toll: {formatINR(rte.estimatedTollINR)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Trip Performance vs. Current Journey ETA Forecasting */}
      <HistoricalEtaForecastChart
        role="driver"
        defaultShipmentId={activeShipment.id}
      />

      {/* Digital Proof of Delivery (e-POD) Modal */}
      {isPodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1524] border border-emerald-700/80 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-heading">
                  Confirm Delivery & Record e-POD
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPodModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPod} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Consignee Receiver Name *
                </label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full bg-[#080C14] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Dock Gate Pass / Confirmation Code
                </label>
                <input
                  type="text"
                  required
                  value={receiverCode}
                  onChange={(e) => setReceiverCode(e.target.value)}
                  className="w-full bg-[#080C14] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Unloading & Seal Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={podNotes}
                  onChange={(e) => setPodNotes(e.target.value)}
                  className="w-full bg-[#080C14] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPodModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Verify POD & Mark Delivered
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Delay / Breakdown Modal */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1524] border border-amber-700/80 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white font-heading">
                  {incidentType === 'vehicle_issue' ? 'Report Vehicle Breakdown' : 'Report Corridor Delay'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIncidentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportQuickIncident} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Operational Details & Location *
                </label>
                <textarea
                  rows={3}
                  required
                  value={incidentText}
                  onChange={(e) => setIncidentText(e.target.value)}
                  placeholder="Describe highway bottleneck, toll queue, or mechanical alert..."
                  className="w-full bg-[#080C14] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
                >
                  Transmit Alert to Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
