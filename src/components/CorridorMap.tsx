/**
 * HaulSense - Live Google Maps Corridor & Fleet Intelligence Map
 * Built with @vis.gl/react-google-maps, AdvancedMarker, InfoWindow, and the modern Routes library (Route.computeRoutes).
 */

import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Navigation,
  Truck,
  MapPin,
  Layers,
  Activity,
  ShieldCheck,
  Route as RouteIcon,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useLogistics } from '../context/LogisticsContext';
import { formatINR } from '../utils';

const MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  (typeof process !== 'undefined' && (process.env as any)?.GOOGLE_MAPS_PLATFORM_API_KEY) ||
  '';

// Hub coordinates across South Indian freight corridors
const HUB_COORDINATES: Record<string, { lat: number; lng: number; label: string }> = {
  Chennai: { lat: 13.0827, lng: 80.2707, label: 'Chennai Central Freight Terminal (Madhavaram)' },
  Bengaluru: { lat: 12.9716, lng: 77.5946, label: 'Bengaluru Peenya Logistics Park' },
  Hosur: { lat: 12.7409, lng: 77.8253, label: 'Hosur SIPCOT Industrial Hub' },
  Vellore: { lat: 12.9165, lng: 79.1325, label: 'Vellore NH-48 Toll Checkpoint' },
  Coimbatore: { lat: 11.0168, lng: 76.9558, label: 'Coimbatore Neelambur Logistics Hub' },
  Madurai: { lat: 9.9252, lng: 78.1198, label: 'Madurai Kappalur Freight Yard' },
  Hyderabad: { lat: 17.385, lng: 78.4867, label: 'Hyderabad Shamshabad Cargo Hub' },
};

// Live simulated GPS positions for the 5 fleet vehicles along their corridors
const VEHICLE_GPS_COORDINATES: Record<string, { lat: number; lng: number; corridorTag: string; speedKmh: number }> = {
  'V-101': { lat: 12.9165, lng: 79.1325, corridorTag: 'En Route NH-48 (Near Vellore Checkpoint)', speedKmh: 62 },
  'V-102': { lat: 12.8342, lng: 78.125, corridorTag: 'Krishnagiri Highway Ghat Section', speedKmh: 54 },
  'V-103': { lat: 13.124, lng: 80.212, corridorTag: 'Chennai Madhavaram Service Bay', speedKmh: 0 },
  'V-104': { lat: 12.998, lng: 77.541, corridorTag: 'Bengaluru Peenya Industrial Dock 4', speedKmh: 18 },
  'V-105': { lat: 11.028, lng: 76.971, corridorTag: 'Coimbatore L&T Bypass Yard', speedKmh: 0 },
};

interface RouteMetrics {
  distanceMeters: number;
  durationSeconds: number;
}

interface ActiveCorridorPolylinesProps {
  originHub: string;
  destinationHub: string;
  showReturnLeg: boolean;
  onRouteMetricsComputed: (metrics: RouteMetrics | null) => void;
}

const ActiveCorridorPolylines: React.FC<ActiveCorridorPolylinesProps> = ({
  originHub,
  destinationHub,
  showReturnLeg,
  onRouteMetricsComputed,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');

  useEffect(() => {
    if (!map || !routesLib) return;

    const originCoords = HUB_COORDINATES[originHub] || HUB_COORDINATES.Chennai;
    const destCoords = HUB_COORDINATES[destinationHub] || HUB_COORDINATES.Bengaluru;

    let activePolylines: Array<{ setMap: (m: any) => void }> = [];
    let isCancelled = false;

    const computeCorridor = async () => {
      try {
        const RouteClass = (routesLib as any).Route;
        if (!RouteClass || typeof RouteClass.computeRoutes !== 'function') {
          return;
        }

        const request = {
          origin: { lat: originCoords.lat, lng: originCoords.lng },
          destination: { lat: destCoords.lat, lng: destCoords.lng },
          travelMode: 'DRIVING',
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
        };

        const { routes } = await RouteClass.computeRoutes(request);
        if (isCancelled || !routes || routes.length === 0) return;

        const primaryRoute = routes[0];
        const gmaps = (window as any).google?.maps;

        if (typeof primaryRoute.createPolylines === 'function') {
          const polylines: any[] = primaryRoute.createPolylines();
          polylines.forEach((polyline: any) => {
            polyline.setOptions({
              strokeColor: '#10b981',
              strokeOpacity: 0.9,
              strokeWeight: 5,
              map,
            });
          });
          activePolylines.push(...polylines);
        } else if (primaryRoute.path && gmaps?.Polyline) {
          const fallbackLine = new gmaps.Polyline({
            path: primaryRoute.path,
            strokeColor: '#10b981',
            strokeOpacity: 0.9,
            strokeWeight: 5,
            map,
          });
          activePolylines.push(fallbackLine);
        }

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 48);
        }

        const durationSec = primaryRoute.durationMillis
          ? Math.round(Number(primaryRoute.durationMillis) / 1000)
          : 21600;

        onRouteMetricsComputed({
          distanceMeters: primaryRoute.distanceMeters || 347000,
          durationSeconds: durationSec,
        });

        // Optional dashed return haul indicator line when toggled
        if (showReturnLeg && gmaps?.Polyline) {
          const returnLine = new gmaps.Polyline({
            path: [
              { lat: destCoords.lat, lng: destCoords.lng },
              { lat: HUB_COORDINATES.Hosur.lat, lng: HUB_COORDINATES.Hosur.lng },
              { lat: originCoords.lat, lng: originCoords.lng },
            ],
            geodesic: true,
            strokeColor: '#6366f1',
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
          activePolylines.push(returnLine);
        }
      } catch (err: any) {
        const msg = String(err?.message || err || '');
        if (
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('QuotaExceeded') ||
          err?.code === 429
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      }
    };

    computeCorridor();

    return () => {
      isCancelled = true;
      activePolylines.forEach((p) => p.setMap(null));
    };
  }, [map, routesLib, originHub, destinationHub, showReturnLeg]);

  return null;
};

interface CorridorMapProps {
  role: 'manager' | 'driver';
  defaultShipmentId?: string;
}

export const CorridorMap: React.FC<CorridorMapProps> = ({
  role,
  defaultShipmentId = 'S-GOLDEN',
}) => {
  const { shipments, vehicles, drivers, returnLoads } = useLogistics();
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(defaultShipmentId);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>('V-101');
  const [selectedHubKey, setSelectedHubKey] = useState<string | null>(null);
  const [showAllFleet, setShowAllFleet] = useState<boolean>(role === 'manager');
  const [showReturnLeg, setShowReturnLeg] = useState<boolean>(true);
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null);

  const activeShipment =
    shipments.find((s) => s.id === selectedShipmentId) || shipments[0];

  const originHub = activeShipment?.origin || 'Chennai';
  const destinationHub = activeShipment?.destination || 'Bengaluru';

  const originCoords = HUB_COORDINATES[originHub] || HUB_COORDINATES.Chennai;
  const destCoords = HUB_COORDINATES[destinationHub] || HUB_COORDINATES.Bengaluru;

  const matchingReturnLoad =
    returnLoads.find((r) => r.origin === destinationHub) || returnLoads[0];

  const displayedVehicles = showAllFleet
    ? vehicles
    : vehicles.filter(
        (v) =>
          v.id === (activeShipment?.assignedVehicleId || 'V-101') ||
          v.id === 'V-102'
      );

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;
  const selectedVehicleDriver = selectedVehicle
    ? drivers.find((d) => d.assignedVehicleId === selectedVehicle.id) || drivers[0]
    : null;

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="bg-[#121824] border border-slate-800/90 rounded-2xl overflow-hidden shadow-lg">
      {/* Top Control Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/90 border border-emerald-700/60 text-emerald-400 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white font-heading">
                {role === 'manager'
                  ? 'Live Google Maps Corridor & Fleet Telemetry'
                  : 'Live Highway Corridor Navigation & Backhaul Radar'}
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
                Google Maps Platform • Live Routes API
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time road routing ({originHub} → {destinationHub}), active truck GPS pins, and return load hubs
            </p>
          </div>
        </div>

        {/* Corridor Selector & Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedShipmentId}
            onChange={(e) => {
              setSelectedShipmentId(e.target.value);
              setSelectedHubKey(null);
            }}
            className="bg-[#0B0F17] border border-slate-700 text-slate-200 text-xs font-mono rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            {shipments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}: {s.origin} → {s.destination} ({s.weightTons}T)
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowAllFleet((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showAllFleet
                ? 'bg-indigo-950/80 border-indigo-600/60 text-indigo-300'
                : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{showAllFleet ? 'All 5 Fleet Trucks' : 'Assigned Truck Only'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReturnLeg((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showReturnLeg
                ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-300'
                : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Return Backhaul Arc</span>
          </button>
        </div>
      </div>

      {/* Live Route Telemetry Bar */}
      <div className="bg-[#0B0F17] border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span className="text-slate-400">Active Corridor:</span>
            <span className="font-bold text-white font-mono">
              {originHub} → {destinationHub}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <RouteIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Computed Road Distance:</span>
            <span className="font-mono font-bold text-emerald-400">
              {routeMetrics
                ? `${(routeMetrics.distanceMeters / 1000).toFixed(1)} km`
                : `${activeShipment?.distanceKm || 347} km`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Est. Drive Duration:</span>
            <span className="font-mono font-bold text-amber-300">
              {routeMetrics
                ? formatDuration(routeMetrics.durationSeconds)
                : `${Math.round(((activeShipment?.distanceKm || 347) / 55) * 10) / 10} hrs`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Origin / Active Truck
          </span>
          <span className="flex items-center gap-1 text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Destination / Backhaul Hub
          </span>
        </div>
      </div>

      {/* Main Map Container with Explicit Height */}
      <div className="grid grid-cols-1 lg:grid-cols-4">
        <div className="lg:col-span-3 h-[430px] w-full relative bg-[#090D14]">
          {MAPS_API_KEY ? (
            <APIProvider apiKey={MAPS_API_KEY}>
              <GoogleMap
                defaultCenter={{ lat: 12.95, lng: 78.95 }}
                defaultZoom={7}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                gestureHandling="greedy"
                disableDefaultUI={false}
                className="w-full h-full"
              >
                <ActiveCorridorPolylines
                  originHub={originHub}
                  destinationHub={destinationHub}
                  showReturnLeg={showReturnLeg}
                  onRouteMetricsComputed={setRouteMetrics}
                />

                {/* Origin Hub Marker */}
                <AdvancedMarker
                  position={{ lat: originCoords.lat, lng: originCoords.lng }}
                  onClick={() => {
                    setSelectedHubKey(originHub);
                    setSelectedVehicleId(null);
                  }}
                  title={`Origin Hub: ${originHub}`}
                >
                  <Pin
                    background="#10b981"
                    borderColor="#064e3b"
                    glyphColor="#ffffff"
                    scale={1.15}
                  />
                </AdvancedMarker>

                {/* Destination Hub Marker */}
                <AdvancedMarker
                  position={{ lat: destCoords.lat, lng: destCoords.lng }}
                  onClick={() => {
                    setSelectedHubKey(destinationHub);
                    setSelectedVehicleId(null);
                  }}
                  title={`Destination Hub: ${destinationHub}`}
                >
                  <Pin
                    background="#6366f1"
                    borderColor="#312e81"
                    glyphColor="#ffffff"
                    scale={1.15}
                  />
                </AdvancedMarker>

                {/* Fleet Vehicle AdvancedMarkers */}
                {displayedVehicles.map((vehicle) => {
                  const gps =
                    VEHICLE_GPS_COORDINATES[vehicle.id] || VEHICLE_GPS_COORDINATES['V-101'];
                  const isAssignedToCurrent =
                    vehicle.id === (activeShipment?.assignedVehicleId || 'V-101');

                  return (
                    <AdvancedMarker
                      key={vehicle.id}
                      position={{ lat: gps.lat, lng: gps.lng }}
                      onClick={() => {
                        setSelectedVehicleId(vehicle.id);
                        setSelectedHubKey(null);
                      }}
                      title={`${vehicle.plateNumber} (${vehicle.vehicleType})`}
                    >
                      <div
                        className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold shadow-lg flex items-center gap-1.5 border transition-transform hover:scale-105 cursor-pointer ${
                          isAssignedToCurrent
                            ? 'bg-emerald-600 text-white border-white ring-4 ring-emerald-500/30'
                            : vehicle.status === 'in_maintenance'
                            ? 'bg-rose-700 text-white border-rose-300'
                            : 'bg-slate-900/95 text-cyan-300 border-cyan-500/60'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5 shrink-0" />
                        <span>{vehicle.plateNumber}</span>
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* InfoWindow for Selected Fleet Vehicle */}
                {selectedVehicle && VEHICLE_GPS_COORDINATES[selectedVehicle.id] && (
                  <InfoWindow
                    position={{
                      lat: VEHICLE_GPS_COORDINATES[selectedVehicle.id].lat,
                      lng: VEHICLE_GPS_COORDINATES[selectedVehicle.id].lng,
                    }}
                    onCloseClick={() => setSelectedVehicleId(null)}
                  >
                    <div className="p-1 min-w-[220px] text-slate-900 space-y-1.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {selectedVehicle.plateNumber}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                          {selectedVehicle.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                        {selectedVehicle.vehicleType} • {selectedVehicle.capacityTons}T ({selectedVehicle.bodyType})
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Location: <strong>{VEHICLE_GPS_COORDINATES[selectedVehicle.id].corridorTag}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-700 pt-1 border-t border-slate-200">
                        <span>Health: <strong>{selectedVehicle.health.overallScore}%</strong></span>
                        <span>Speed: <strong>{VEHICLE_GPS_COORDINATES[selectedVehicle.id].speedKmh} km/h</strong></span>
                      </div>
                      {selectedVehicleDriver && (
                        <div className="text-[11px] text-indigo-700 font-medium">
                          Operator: {selectedVehicleDriver.name} (Trust {selectedVehicleDriver.reliabilityScore}/100)
                        </div>
                      )}
                    </div>
                  </InfoWindow>
                )}

                {/* InfoWindow for Selected Corridor Hub */}
                {selectedHubKey && HUB_COORDINATES[selectedHubKey] && (
                  <InfoWindow
                    position={{
                      lat: HUB_COORDINATES[selectedHubKey].lat,
                      lng: HUB_COORDINATES[selectedHubKey].lng,
                    }}
                    onCloseClick={() => setSelectedHubKey(null)}
                  >
                    <div className="p-1 min-w-[200px] text-slate-900 space-y-1">
                      <div className="font-bold text-xs text-slate-900">
                        {HUB_COORDINATES[selectedHubKey].label}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Corridor Role:{' '}
                        <strong>
                          {selectedHubKey === originHub ? 'Origin Dispatch Terminal' : 'Destination & Backhaul Hub'}
                        </strong>
                      </div>
                      {selectedHubKey === destinationHub && matchingReturnLoad && (
                        <div className="text-[11px] text-emerald-700 font-semibold pt-1 border-t border-slate-200">
                          Return Load Ready: {matchingReturnLoad.origin} → {matchingReturnLoad.destination} (+{formatINR(matchingReturnLoad.offeredFreight)})
                        </div>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </APIProvider>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <MapPin className="w-10 h-10 text-emerald-400 mb-2" />
              <p className="text-sm font-bold text-white">Google Maps Key Initializing</p>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Ensure VITE_GOOGLE_MAPS_API_KEY is configured in the environment to render live corridor tiles.
              </p>
            </div>
          )}
        </div>

        {/* Right Side Fleet & Corridor Pin Inspector */}
        <div className="bg-[#0E1522] border-t lg:border-t-0 lg:border-l border-slate-800 p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Active Fleet GPS Pins ({displayedVehicles.length})
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Click to Focus</span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {displayedVehicles.map((v) => {
                const gps = VEHICLE_GPS_COORDINATES[v.id] || VEHICLE_GPS_COORDINATES['V-101'];
                const isSelected = selectedVehicleId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedVehicleId(v.id);
                      setSelectedHubKey(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/50 border-emerald-500/60'
                        : 'bg-[#090D14] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-white">{v.plateNumber}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          v.status === 'available'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : v.status === 'in_transit'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {gps.speedKmh > 0 ? `${gps.speedKmh} km/h` : v.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{gps.corridorTag}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>{v.vehicleType} • {v.capacityTons}T</span>
                      <span className="text-cyan-400">Health {v.health.overallScore}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backhaul Opportunity Summary inside Map Sidebar */}
          {matchingReturnLoad && (
            <div className="p-3 rounded-xl bg-[#090D14] border border-indigo-900/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Matched Backhaul Pin
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  +{formatINR(matchingReturnLoad.offeredFreight)}
                </span>
              </div>
              <div className="text-xs font-bold text-white">
                {matchingReturnLoad.origin} → {matchingReturnLoad.destination}
              </div>
              <p className="text-[11px] text-slate-400">
                {matchingReturnLoad.weightTons}T {matchingReturnLoad.cargoType} • Eliminates {matchingReturnLoad.distanceKm} km deadhead
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
