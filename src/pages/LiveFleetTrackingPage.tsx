/**
 * HaulSense - Dedicated Live Fleet Tracking Workspace (/manager/tracking)
 * Phase 4 & Phase 7 Implementation:
 * - Spacious interactive Google Map occupying ~75% of the workspace
 * - Collapsible Fleet Information Panel with search & status filters (All, Active, In Transit, At Pickup, Delayed, Offline, Completed)
 * - Top Control Bar: Roadmap/Satellite toggle, Full-Screen mode, Zoom-to-Fit All Vehicles, Locate Selected Vehicle, Layer filters
 * - Distinct Markers & Legend: Pickup, Delivery, Current Vehicle (Live Device GPS vs Corridor Telemetry), Return-Load Hub, Selected Vehicle
 * - Intelligent Multi-Route Recommendation & Comparison Panel (/api/routes/recommend) with deviation alerts
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Truck,
  MapPin,
  Layers,
  Maximize2,
  Minimize2,
  Search,
  LocateFixed,
  Compass,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Route as RouteIcon,
  Radio,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Satellite,
  Map as MapIcon,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { CITIES } from '../data/mockData';
import { RouteAlternative } from '../types';
import { formatINR } from '../utils';
import { HistoricalEtaForecastChart } from '../components/HistoricalEtaForecastChart';

const MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  (typeof process !== 'undefined' && (process.env as any)?.GOOGLE_MAPS_PLATFORM_API_KEY) ||
  '';

type FleetFilterType =
  | 'all'
  | 'active'
  | 'in_transit'
  | 'at_pickup'
  | 'delayed'
  | 'offline'
  | 'completed';

interface MapPolylinesControllerProps {
  routes: RouteAlternative[];
  selectedRouteId: string;
  showRoutes: boolean;
  showReturnArc: boolean;
  originCity: string;
  destinationCity: string;
  fitAllTrigger: number;
  focusCoords: { lat: number; lng: number } | null;
  focusTrigger: number;
  allVehiclePositions: Array<{ lat: number; lng: number }>;
}

const MapPolylinesController: React.FC<MapPolylinesControllerProps> = ({
  routes,
  selectedRouteId,
  showRoutes,
  showReturnArc,
  originCity,
  destinationCity,
  fitAllTrigger,
  focusCoords,
  focusTrigger,
  allVehiclePositions,
}) => {
  const map = useMap();

  // Handle Zoom-to-Fit All Active Vehicles
  useEffect(() => {
    if (!map || fitAllTrigger === 0) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps?.LatLngBounds || allVehiclePositions.length === 0) return;
    const bounds = new gmaps.LatLngBounds();
    allVehiclePositions.forEach((pt) => bounds.extend(pt));
    map.fitBounds(bounds, 64);
  }, [map, fitAllTrigger, allVehiclePositions]);

  // Handle Locate Selected Vehicle
  useEffect(() => {
    if (!map || !focusCoords || focusTrigger === 0) return;
    map.panTo(focusCoords);
    map.setZoom(10);
  }, [map, focusCoords, focusTrigger]);

  // Render Selected & Alternative Route Polylines
  useEffect(() => {
    if (!map) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps?.Polyline) return;

    const drawnPolylines: any[] = [];

    if (showRoutes && routes.length > 0) {
      // Draw non-selected alternatives first so selected route sits on top
      routes.forEach((rte) => {
        const isSelected = rte.id === selectedRouteId;
        const line = new gmaps.Polyline({
          path: rte.pathCoordinates,
          geodesic: true,
          strokeColor: isSelected ? '#06b6d4' : '#64748b',
          strokeOpacity: isSelected ? 0.95 : 0.45,
          strokeWeight: isSelected ? 5 : 3,
          zIndex: isSelected ? 10 : 2,
          map,
        });
        drawnPolylines.push(line);
      });
    }

    if (showReturnArc) {
      const orig = CITIES[originCity] || CITIES.Chennai;
      const dest = CITIES[destinationCity] || CITIES.Bengaluru;
      const hosur = CITIES.Hosur;
      const returnLine = new gmaps.Polyline({
        path: [
          { lat: dest.lat, lng: dest.lng },
          { lat: hosur.lat, lng: hosur.lng },
          { lat: orig.lat, lng: orig.lng },
        ],
        geodesic: true,
        strokeColor: '#10b981',
        strokeOpacity: 0,
        icons: [
          {
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 0.85,
              scale: 3.5,
            },
            offset: '0',
            repeat: '16px',
          },
        ],
        map,
      });
      drawnPolylines.push(returnLine);
    }

    return () => {
      drawnPolylines.forEach((p) => p.setMap(null));
    };
  }, [map, routes, selectedRouteId, showRoutes, showReturnArc, originCity, destinationCity]);

  return null;
};

export const LiveFleetTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    vehicles,
    drivers,
    shipments,
    returnLoads,
    fleetTelemetry,
    selectShipmentRoute,
  } = useLogistics();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('V1');
  const [fleetFilter, setFleetFilter] = useState<FleetFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite'>('roadmap');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSidePanelCollapsed, setIsSidePanelCollapsed] = useState(false);

  // Layer visibility controls
  const [showRoutes, setShowRoutes] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showHubs, setShowHubs] = useState(true);
  const [showReturnArc, setShowReturnArc] = useState(true);

  // Route recommendation state
  const [routeAlternatives, setRouteAlternatives] = useState<RouteAlternative[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ROUTE-A-NH48');
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Map camera triggers
  const [fitAllTrigger, setFitAllTrigger] = useState(0);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [activeInfoWindowId, setActiveInfoWindowId] = useState<string | null>('V1');

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const selectedTelemetry = fleetTelemetry[selectedVehicle.id];
  const selectedShipment =
    shipments.find(
      (s) =>
        s.id === selectedTelemetry?.shipmentId ||
        s.assignedVehicleId === selectedVehicle.id
    ) || shipments[0];
  const selectedDriver =
    drivers.find(
      (d) =>
        d.id === selectedTelemetry?.driverId ||
        d.id === selectedShipment?.assignedDriverId
    ) || drivers[0];

  const originCity = selectedShipment?.origin || 'Chennai';
  const destinationCity = selectedShipment?.destination || 'Bengaluru';
  const originCoord = CITIES[originCity] || CITIES.Chennai;
  const destCoord = CITIES[destinationCity] || CITIES.Bengaluru;

  // Fetch route alternatives when selected shipment or vehicle changes
  const fetchRouteRecommendations = useCallback(async () => {
    setLoadingRoutes(true);
    try {
      const res = await fetch('/api/routes/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: originCity,
          destination: destinationCity,
          vehicleId: selectedVehicle.id,
        }),
      });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.alternatives)) {
        setRouteAlternatives(data.alternatives);
        const preferred =
          selectedShipment?.selectedRouteId &&
          data.alternatives.some((a: RouteAlternative) => a.id === selectedShipment.selectedRouteId)
            ? selectedShipment.selectedRouteId
            : data.recommendedRouteId || data.alternatives[0]?.id;
        setSelectedRouteId(preferred);
      }
    } catch {
      // Fallback handled silently
    } finally {
      setLoadingRoutes(false);
    }
  }, [originCity, destinationCity, selectedVehicle.id, selectedShipment?.selectedRouteId]);

  useEffect(() => {
    fetchRouteRecommendations();
  }, [fetchRouteRecommendations]);

  // Filter fleet vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const tel = fleetTelemetry[v.id];
    const ship = shipments.find(
      (s) => s.id === tel?.shipmentId || s.assignedVehicleId === v.id
    );
    const drv = drivers.find((d) => d.id === tel?.driverId || d.id === v.driverId);

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const matchPlate = v.plateNumber.toLowerCase().includes(q);
      const matchDrv = drv?.name.toLowerCase().includes(q);
      const matchShip = ship?.id.toLowerCase().includes(q);
      const matchLoc = tel?.corridorLabel.toLowerCase().includes(q);
      if (!matchPlate && !matchDrv && !matchShip && !matchLoc) return false;
    }

    if (fleetFilter === 'all') return true;
    if (fleetFilter === 'active') return tel?.connectionStatus === 'online';
    if (fleetFilter === 'in_transit') {
      return (
        tel?.connectionStatus === 'online' &&
        (tel?.speedKmh > 0 || ship?.lifecycleStatus === 'in_transit' || ship?.lifecycleStatus === 'heading_to_delivery')
      );
    }
    if (fleetFilter === 'at_pickup') {
      return (
        ship?.lifecycleStatus === 'pickup' ||
        ship?.lifecycleStatus === 'arrived_at_pickup' ||
        ship?.lifecycleStatus === 'assigned'
      );
    }
    if (fleetFilter === 'delayed') {
      return Boolean(tel?.routeDeviationDetected || tel?.connectionStatus === 'stale');
    }
    if (fleetFilter === 'offline') {
      return tel?.connectionStatus === 'offline' || v.status === 'in_maintenance';
    }
    if (fleetFilter === 'completed') {
      return ship?.lifecycleStatus === 'delivered' || ship?.lifecycleStatus === 'completed';
    }
    return true;
  });

  const allVehiclePositions = vehicles
    .map((v) => fleetTelemetry[v.id])
    .filter(Boolean)
    .map((t) => ({ lat: t.lat, lng: t.lng }));

  const handleSelectVehicle = (vId: string) => {
    setSelectedVehicleId(vId);
    setActiveInfoWindowId(vId);
    setFocusTrigger((prev) => prev + 1);
  };

  const handleSelectRoute = (rte: RouteAlternative) => {
    setSelectedRouteId(rte.id);
    if (selectedShipment) {
      selectShipmentRoute(selectedShipment.id, rte.id, rte.label);
    }
  };

  const activeRouteObj =
    routeAlternatives.find((r) => r.id === selectedRouteId) || routeAlternatives[0];

  const formatTimeAgo = (iso: string) => {
    const diffSec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (diffSec < 15) return 'Just now (Live)';
    if (diffSec < 60) return `${diffSec}s ago`;
    const mins = Math.round(diffSec / 60);
    return `${mins}m ago`;
  };

  return (
    <div
      ref={containerRef}
      className={`${
        isFullScreen
          ? 'fixed inset-0 z-50 bg-[#070B12] p-3 flex flex-col'
          : 'space-y-4 max-w-[1600px] mx-auto'
      }`}
    >
      {/* Top Control Bar */}
      <div className="bg-[#0E1524] border border-slate-800/90 rounded-2xl p-3.5 shadow-lg flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-inner">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base md:text-lg font-extrabold text-white font-heading tracking-tight">
                LIVE FLEET TRACKING & ROUTE INTELLIGENCE
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-700/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                REAL-TIME TELEMETRY SYNC
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live GPS fleet positions, multi-route highway comparisons, and corridor deviation monitoring
            </p>
          </div>
        </div>

        {/* Map Controls & Visibility Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Map Type Toggle: Roadmap vs Satellite */}
          <div className="bg-[#080C14] p-0.5 rounded-xl border border-slate-800 flex items-center text-xs">
            <button
              type="button"
              onClick={() => setMapTypeId('roadmap')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                mapTypeId === 'roadmap'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Roadmap</span>
            </button>
            <button
              type="button"
              onClick={() => setMapTypeId('satellite')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                mapTypeId === 'satellite'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>Satellite</span>
            </button>
          </div>

          {/* Camera Controls */}
          <button
            type="button"
            onClick={() => setFitAllTrigger((p) => p + 1)}
            className="px-3 py-1.5 rounded-xl bg-[#131C2E] hover:bg-[#1A263E] border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Zoom to fit all active fleet vehicles"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fit All Trucks</span>
          </button>

          <button
            type="button"
            onClick={() => setFocusTrigger((p) => p + 1)}
            className="px-3 py-1.5 rounded-xl bg-[#131C2E] hover:bg-[#1A263E] border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Center map on selected vehicle"
          >
            <LocateFixed className="w-3.5 h-3.5 text-emerald-400" />
            <span>Locate Selected</span>
          </button>

          {/* Visibility Layer Pills */}
          <button
            type="button"
            onClick={() => setShowRoutes((p) => !p)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showRoutes
                ? 'bg-cyan-950/80 border-cyan-600/60 text-cyan-300'
                : 'bg-[#080C14] border-slate-800 text-slate-500'
            }`}
          >
            Routes
          </button>

          <button
            type="button"
            onClick={() => setShowReturnArc((p) => !p)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showReturnArc
                ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-300'
                : 'bg-[#080C14] border-slate-800 text-slate-500'
            }`}
          >
            Backhaul Arc
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullScreen((p) => !p)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Full Screen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full Screen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split Workspace: 75% Interactive Map + 25% Collapsible Fleet Panel */}
      <div
        className={`flex flex-col lg:flex-row gap-4 ${
          isFullScreen ? 'flex-1 min-h-0' : 'h-[650px]'
        }`}
      >
        {/* Interactive Google Map Canvas (75% to 100% width depending on panel state) */}
        <div className="flex-1 h-full rounded-2xl overflow-hidden border border-slate-800/90 bg-[#090D16] relative shadow-xl flex flex-col">
          <div className="flex-1 relative">
            {MAPS_API_KEY ? (
              <APIProvider apiKey={MAPS_API_KEY}>
                <GoogleMap
                  defaultCenter={{ lat: 12.9165, lng: 79.1325 }}
                  defaultZoom={7}
                  mapId="DEMO_MAP_ID"
                  mapTypeId={mapTypeId}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  className="w-full h-full"
                >
                  <MapPolylinesController
                    routes={routeAlternatives}
                    selectedRouteId={selectedRouteId}
                    showRoutes={showRoutes}
                    showReturnArc={showReturnArc}
                    originCity={originCity}
                    destinationCity={destinationCity}
                    fitAllTrigger={fitAllTrigger}
                    focusCoords={
                      selectedTelemetry
                        ? { lat: selectedTelemetry.lat, lng: selectedTelemetry.lng }
                        : null
                    }
                    focusTrigger={focusTrigger}
                    allVehiclePositions={allVehiclePositions}
                  />

                  {/* Pickup Origin Marker */}
                  {showHubs && (
                    <AdvancedMarker
                      position={{ lat: originCoord.lat, lng: originCoord.lng }}
                      title={`Pickup Terminal: ${originCity}`}
                    >
                      <Pin
                        background="#10b981"
                        borderColor="#064e3b"
                        glyphColor="#ffffff"
                        scale={1.15}
                      />
                    </AdvancedMarker>
                  )}

                  {/* Delivery Destination Marker */}
                  {showHubs && (
                    <AdvancedMarker
                      position={{ lat: destCoord.lat, lng: destCoord.lng }}
                      title={`Delivery Destination: ${destinationCity}`}
                    >
                      <Pin
                        background="#6366f1"
                        borderColor="#312e81"
                        glyphColor="#ffffff"
                        scale={1.15}
                      />
                    </AdvancedMarker>
                  )}

                  {/* Return Load Hub Marker */}
                  {showReturnArc && (
                    <AdvancedMarker
                      position={{ lat: CITIES.Hosur.lat, lng: CITIES.Hosur.lng }}
                      title="Return Load Hub: Hosur SIPCOT"
                    >
                      <Pin
                        background="#f59e0b"
                        borderColor="#78350f"
                        glyphColor="#ffffff"
                        scale={1.0}
                      />
                    </AdvancedMarker>
                  )}

                  {/* Live Fleet Vehicle Markers */}
                  {showVehicles &&
                    filteredVehicles.map((v) => {
                      const tel = fleetTelemetry[v.id];
                      if (!tel) return null;
                      const isSelected = v.id === selectedVehicleId;
                      const isDeviated = Boolean(tel.routeDeviationDetected);
                      const isOffline =
                        tel.connectionStatus === 'offline' || v.status === 'in_maintenance';

                      return (
                        <AdvancedMarker
                          key={v.id}
                          position={{ lat: tel.lat, lng: tel.lng }}
                          onClick={() => handleSelectVehicle(v.id)}
                          title={`${v.plateNumber} • ${tel.corridorLabel}`}
                        >
                          <div
                            className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold shadow-xl flex items-center gap-1.5 border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950 border-white ring-4 ring-cyan-400/40 scale-110 z-30'
                                : isDeviated
                                ? 'bg-amber-600 text-white border-amber-200 ring-2 ring-amber-500/40'
                                : isOffline
                                ? 'bg-slate-800 text-slate-400 border-slate-600'
                                : 'bg-[#0E1729]/95 text-emerald-300 border-emerald-500/70 hover:scale-105'
                            }`}
                          >
                            {tel.isLiveDeviceGps && (
                              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                            )}
                            <Truck className="w-3.5 h-3.5 shrink-0" />
                            <span>{v.plateNumber}</span>
                            {tel.speedKmh > 0 && (
                              <span className="text-[9px] opacity-90">
                                {tel.speedKmh}km/h
                              </span>
                            )}
                          </div>
                        </AdvancedMarker>
                      );
                    })}

                  {/* InfoWindow Popup for Active Vehicle */}
                  {activeInfoWindowId && fleetTelemetry[activeInfoWindowId] && (
                    <InfoWindow
                      position={{
                        lat: fleetTelemetry[activeInfoWindowId].lat,
                        lng: fleetTelemetry[activeInfoWindowId].lng,
                      }}
                      onCloseClick={() => setActiveInfoWindowId(null)}
                    >
                      {(() => {
                        const v =
                          vehicles.find((item) => item.id === activeInfoWindowId) ||
                          selectedVehicle;
                        const t = fleetTelemetry[activeInfoWindowId];
                        const d =
                          drivers.find((drv) => drv.id === t.driverId) || selectedDriver;
                        const s =
                          shipments.find((sh) => sh.id === t.shipmentId) ||
                          selectedShipment;

                        return (
                          <div className="p-1.5 min-w-[240px] text-slate-900 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                              <span className="font-mono font-bold text-slate-950">
                                {v.plateNumber}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                  t.isLiveDeviceGps
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : t.connectionStatus === 'online'
                                    ? 'bg-cyan-100 text-cyan-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {t.isLiveDeviceGps
                                  ? 'LIVE DEVICE GPS'
                                  : t.connectionStatus.toUpperCase()}
                              </span>
                            </div>

                            <div className="font-semibold text-slate-800">
                              Driver: {d.name} • Shipment: {s?.id || 'Unassigned'}
                            </div>
                            <div className="text-[11px] text-slate-600">
                              {t.corridorLabel}
                            </div>

                            <div className="grid grid-cols-2 gap-1 text-[11px] bg-slate-100 p-1.5 rounded">
                              <span>
                                Speed: <strong>{t.speedKmh} km/h</strong>
                              </span>
                              <span>
                                Accuracy: <strong>±{t.accuracyMeters}m</strong>
                              </span>
                              <span>
                                Rem. Dist: <strong>{t.remainingDistanceKm} km</strong>
                              </span>
                              <span>
                                Updated: <strong>{formatTimeAgo(t.timestamp)}</strong>
                              </span>
                            </div>

                            {t.routeDeviationDetected && (
                              <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-300 rounded px-2 py-1 font-semibold">
                                ⚠ Corridor Deviation: {(t.deviationMeters || 1850) / 1000} km off NH-48
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </InfoWindow>
                  )}
                </GoogleMap>
              </APIProvider>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <MapPin className="w-10 h-10 text-cyan-400 mb-2" />
                <p className="text-sm font-bold text-white">Google Maps Key Required</p>
              </div>
            )}

            {/* Floating Map Legend (Bottom Left of Map) */}
            <div className="absolute bottom-3 left-3 z-10 bg-[#0B101B]/95 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-2.5 shadow-xl text-[11px] flex flex-wrap items-center gap-3">
              <span className="font-mono font-bold text-slate-400 uppercase text-[10px]">
                Legend:
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Pickup Hub
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Delivery Hub
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-400/30 inline-block" /> Selected Truck
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Delayed / Return Hub
              </span>
            </div>

            {/* Collapse/Expand Side Panel Button */}
            <button
              type="button"
              onClick={() => setIsSidePanelCollapsed((p) => !p)}
              className="hidden lg:flex absolute top-3 right-3 z-10 px-2.5 py-1.5 rounded-xl bg-[#0B101B]/90 hover:bg-[#131C2E] border border-slate-700 text-xs font-semibold text-slate-200 items-center gap-1 shadow-lg cursor-pointer"
            >
              {isSidePanelCollapsed ? (
                <>
                  <ChevronLeft className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Expand Fleet List</span>
                </>
              ) : (
                <>
                  <span>Collapse Panel</span>
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                </>
              )}
            </button>
          </div>

          {/* Bottom Compact Selected Vehicle & Trip Telemetry Strip */}
          {selectedTelemetry && (
            <div className="bg-[#0E1524] border-t border-slate-800 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono font-bold">
                    {selectedVehicle.plateNumber}
                  </span>
                  <span className="font-bold text-white">
                    {selectedDriver.name}
                  </span>
                  <span className="text-slate-400 font-mono">
                    ({selectedShipment?.id}: {originCity} → {destinationCity})
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
                  <span>
                    Stage:{' '}
                    <strong className="text-emerald-400 uppercase">
                      {(selectedShipment?.lifecycleStatus || 'assigned').replace(/_/g, ' ')}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    GPS Accuracy: <strong className="text-cyan-300">±{selectedTelemetry.accuracyMeters}m</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Rem. Distance: <strong className="text-white">{selectedTelemetry.remainingDistanceKm} km</strong>
                  </span>
                  <span>•</span>
                  <span>
                    ETA:{' '}
                    <strong className="text-amber-300">
                      {new Date(selectedTelemetry.estimatedArrivalIso).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/manager/chat/${selectedShipment?.id || 'S-GOLDEN'}`)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message Driver</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/manager/agent/${selectedShipment?.id || 'S-GOLDEN'}`)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Evaluate in Agent</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Fleet Side Panel */}
        {!isSidePanelCollapsed && (
          <div className="w-full lg:w-[370px] xl:w-[400px] h-full bg-[#0E1524] border border-slate-800/90 rounded-2xl p-4 flex flex-col shadow-xl shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-white font-heading">
                  Fleet Units ({filteredVehicles.length}/{vehicles.length})
                </h2>
                <p className="text-[11px] text-slate-400">
                  Click a vehicle to focus map & inspect route
                </p>
              </div>
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>

            {/* Search Input */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reg no, driver, shipment..."
                className="w-full bg-[#080C14] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'in_transit', label: 'In Transit' },
                  { id: 'at_pickup', label: 'At Pickup' },
                  { id: 'delayed', label: 'Delayed' },
                  { id: 'offline', label: 'Offline' },
                  { id: 'completed', label: 'Completed' },
                ] as { id: FleetFilterType; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFleetFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase whitespace-nowrap cursor-pointer transition-all ${
                    fleetFilter === tab.id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-[#080C14] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Vehicle Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredVehicles.map((v) => {
                const tel = fleetTelemetry[v.id];
                const ship =
                  shipments.find(
                    (s) => s.id === tel?.shipmentId || s.assignedVehicleId === v.id
                  ) || shipments[0];
                const drv =
                  drivers.find(
                    (d) => d.id === tel?.driverId || d.id === v.driverId
                  ) || drivers[0];
                const isSelected = v.id === selectedVehicleId;

                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVehicle(v.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-500/80 shadow-md'
                        : 'bg-[#090D16] border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white">
                          {v.plateNumber}
                        </span>
                        {tel?.isLiveDeviceGps && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                            SMARTPHONE GPS
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                          tel?.routeDeviationDetected
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : tel?.connectionStatus === 'online'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {tel?.routeDeviationDetected
                          ? 'DEVIATED'
                          : tel?.connectionStatus || v.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span>Driver: <strong>{drv.name}</strong></span>
                      <span className="font-mono text-indigo-400">{ship.id}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      {tel?.corridorLabel || v.currentLocation}
                    </p>

                    <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                      <div>
                        Speed: <strong className="text-white">{tel?.speedKmh ?? 0} km/h</strong>
                      </div>
                      <div>
                        Rem: <strong className="text-cyan-300">{tel?.remainingDistanceKm ?? 0} km</strong>
                      </div>
                      <div className="text-right">
                        {tel ? formatTimeAgo(tel.timestamp) : 'Offline'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Phase 7: Intelligent Route Recommendation & Multi-Route Comparison Panel */}
      {!isFullScreen && (
        <div className="bg-[#0E1524] border border-slate-800/90 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-700/60 text-indigo-400 flex items-center justify-center">
                <RouteIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm md:text-base font-bold text-white font-heading">
                    Intelligent Highway Route Recommendation ({originCity} → {destinationCity})
                  </h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {routeAlternatives.length} Viable Alternatives Evaluated
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Evaluated for {selectedVehicle.plateNumber} ({selectedVehicle.capacityTons}T {selectedVehicle.vehicleType}) using travel time, traffic delay, toll cost, and axle suitability
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchRouteRecommendations}
              disabled={loadingRoutes}
              className="px-3 py-1.5 rounded-xl bg-[#141E30] hover:bg-[#1B2942] border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loadingRoutes ? 'animate-spin' : ''}`} />
              <span>Refresh Corridor Traffic</span>
            </button>
          </div>

          {/* Explainable Recommendation Banner */}
          {activeRouteObj && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/50 via-cyan-950/30 to-indigo-950/30 border border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-emerald-300 block">
                    {activeRouteObj.label}
                  </span>
                  <p className="text-xs text-slate-200 mt-0.5">
                    {activeRouteObj.recommendationReason}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700 shrink-0">
                Suitability Score: {activeRouteObj.suitabilityScore}/100
              </span>
            </div>
          )}

          {/* 3 Route Alternatives Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {routeAlternatives.map((rte) => {
              const isSelected = rte.id === selectedRouteId;
              const hrs = Math.floor(rte.durationMinutes / 60);
              const mins = rte.durationMinutes % 60;

              return (
                <div
                  key={rte.id}
                  onClick={() => handleSelectRoute(rte)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#131F33] border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-[#090D16] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          rte.isRecommended
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {rte.isRecommended ? '★ Recommended Corridor' : 'Alternative Route'}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        Score {rte.suitabilityScore}/100
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-white font-heading">
                      {rte.label}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {rte.highwaySummary}
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Distance</span>
                        <span className="font-mono font-bold text-white">{rte.distanceKm} km</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Est. Time</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {hrs}h {mins}m
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Est. Toll</span>
                        <span className="font-mono font-bold text-amber-300">
                          {formatINR(rte.estimatedTollINR)}
                        </span>
                      </div>
                    </div>

                    {rte.warnings && rte.warnings.length > 0 && (
                      <div className="text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-900/50 rounded-lg p-2">
                        • {rte.warnings[0]}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRoute(rte);
                    }}
                    className={`mt-3 w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isSelected ? '✓ Active Assigned Route' : 'Assign This Corridor Route'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Trip Performance vs. Current Journey ETA Forecasting */}
      {!isFullScreen && (
        <HistoricalEtaForecastChart
          role="manager"
          defaultShipmentId={selectedShipment?.id || 'S-GOLDEN'}
        />
      )}
    </div>
  );
};
