/**
 * HaulSense - Unified Logistics State, Real-Time Smartphone GPS Watcher,
 * Auditable Shipment Timelines & Two-Sided Operational Context
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  Driver,
  DriverTripIssue,
  LiveGpsTelemetry,
  ProofOfDelivery,
  ReturnLoad,
  SecurityAuditLogEntry,
  Shipment,
  ShipmentTimelineEvent,
  TripChatMessage,
  TripLifecycleStatus,
  Vehicle,
} from '../types';
import {
  ALL_SHIPMENTS,
  DRIVERS,
  RETURN_LOADS,
  VEHICLES,
} from '../data/mockData';

export interface AppNotification {
  id: string;
  timestamp: string;
  source: 'driver' | 'manager' | 'agent' | 'system';
  targetRole: 'manager' | 'driver' | 'all';
  type:
    | 'mismatch_alert'
    | 'status_change'
    | 'incident'
    | 'return_load_match'
    | 'assignment'
    | 'route_deviation'
    | 'gps_alert'
    | 'delay_alert'
    | 'fuel_anomaly';
  severity?: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  read: boolean;
  acknowledged?: boolean;
  relatedShipmentId?: string;
  relatedVehicleId?: string;
  etaImpactMinutes?: number;
  fuelVariancePercent?: number;
  deviationMeters?: number;
  telemetryMetric?: string;
}

interface LogisticsContextType {
  shipments: Shipment[];
  vehicles: Vehicle[];
  drivers: Driver[];
  returnLoads: ReturnLoad[];
  notifications: AppNotification[];
  chatMessages: Record<string, TripChatMessage[]>;
  fleetTelemetry: Record<string, LiveGpsTelemetry>;
  auditLogs: SecurityAuditLogEntry[];
  // Real Smartphone GPS Watcher State
  isGpsTrackingActive: boolean;
  activeTrackedShipmentId: string | null;
  gpsPermissionState: 'prompt' | 'granted' | 'denied' | 'unavailable';
  gpsError: string | null;
  lastGpsUpdateIso: string | null;
  // Actions
  updateTripLifecycle: (
    shipmentId: string,
    status: TripLifecycleStatus,
    actorName?: string,
    actorRole?: 'manager' | 'driver'
  ) => { ok: boolean; error?: string };
  submitProofOfDelivery: (
    shipmentId: string,
    pod: Omit<ProofOfDelivery, 'deliveryTimestamp'>
  ) => void;
  selectShipmentRoute: (shipmentId: string, routeId: string, routeLabel: string) => void;
  createShipment: (
    payload: {
      title: string;
      origin: string;
      destination: string;
      pickupAddress: string;
      deliveryAddress: string;
      distanceKm: number;
      weightTons: number;
      cargoType: Shipment['cargoType'];
      offeredFreight: number;
      assignedVehicleId: string;
      assignedDriverId: string;
      selectedRouteId?: string;
    }
  ) => { ok: boolean; error?: string; shipment?: Shipment };
  startRealGpsTracking: (shipmentId: string, vehicleId: string, driverId: string) => void;
  stopRealGpsTracking: (reason?: string) => void;
  reportIncident: (issue: Omit<DriverTripIssue, 'id' | 'timestamp' | 'resolved'>) => void;
  requestVehicleAlternative: (shipmentId: string, currentVehicleId: string, reason: string) => void;
  claimReturnLoad: (returnLoadId: string, driverId: string) => void;
  updateDriverAvailability: (driverId: string, status: Driver['status']) => void;
  triggerRealtimeAlert: (
    payload: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { id?: string }
  ) => void;
  reportFuelAnomaly: (
    shipmentId: string,
    vehicleId: string,
    fuelVariancePercent: number,
    details?: string
  ) => void;
  reportRouteDeviation: (
    shipmentId: string,
    vehicleId: string,
    deviationMeters: number,
    locationLabel?: string
  ) => void;
  reportTripDelay: (
    shipmentId: string,
    vehicleId: string,
    delayMinutes: number,
    reason: string
  ) => void;
  acknowledgeNotification: (notificationId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
  sendChatMessage: (
    tripId: string,
    msg: Omit<TripChatMessage, 'id' | 'timestamp' | 'readByOtherRole'>
  ) => Promise<TripChatMessage>;
  markTripChatAsRead: (tripId: string, forRole: 'manager' | 'driver') => void;
  refreshAuditLogs: () => void;
  resetToDefaults: () => void;
}

const STORAGE_KEYS = {
  SHIPMENTS: 'haulsense_shipments_v3',
  VEHICLES: 'haulsense_vehicles_v3',
  DRIVERS: 'haulsense_drivers_v3',
  RETURN_LOADS: 'haulsense_return_loads_v3',
  NOTIFICATIONS: 'haulsense_notifications_v4',
  CHAT: 'haulsense_trip_chat_v3',
};

const DEFAULT_SHIPMENT_ADDRESSES: Record<string, { pickup: string; delivery: string }> = {
  'S-GOLDEN': {
    pickup: 'Bay 4, Madhavaram Central Freight Terminal, NH-48, Chennai, TN 600060',
    delivery: 'Plot 18, Peenya Industrial Area Phase II, Tumkur Road, Bengaluru, KA 560058',
  },
  'S-CASE-A': {
    pickup: 'Ambattur Industrial Estate Gate 2, Chennai, TN 600058',
    delivery: 'SIPCOT Industrial Complex, Ranipet / Vellore NH-48, TN 632403',
  },
  'S-CASE-B': {
    pickup: 'Sriperumbudur Textile Consolidation Hub, Chennai, TN 602105',
    delivery: 'Kappalur SIDCO Industrial Estate, Madurai Ring Road, TN 625008',
  },
  'S-CASE-D': {
    pickup: 'Oragadam Hi-Tech SEZ Warehouse 9, Chennai, TN 602105',
    delivery: 'Electronic City Phase 1 Cargo Dock, Hosur Road, Bengaluru, KA 560100',
  },
  'S-CASE-E': {
    pickup: 'Ennore Port Container Freight Station, Chennai, TN 600057',
    delivery: 'Kalamassery Logistics Park, NH-544, Kochi, KL 683104',
  },
};

const enrichInitialShipments = (list: Shipment[]): Shipment[] =>
  list.map((s) => {
    const addr = DEFAULT_SHIPMENT_ADDRESSES[s.id] || {
      pickup: `${s.origin} Central Logistics Hub, Gate 1`,
      delivery: `${s.destination} Regional Distribution Terminal`,
    };
    const defaultTimeline: ShipmentTimelineEvent[] = s.timeline || [
      {
        id: `EVT-${s.id}-1`,
        timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
        stage: 'created',
        title: 'Shipment Manifest Created',
        description: `${s.title} (${s.weightTons}T ${s.cargoType.toUpperCase()}) registered on ${s.origin} → ${s.destination} corridor.`,
        actorName: 'Karthik Subramanian',
        actorRole: 'manager',
      },
      {
        id: `EVT-${s.id}-2`,
        timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
        stage: 'driver_assigned',
        title: 'Vehicle & Driver Assigned',
        description: `Assigned Vehicle ${s.assignedVehicleId || 'V1'} and Driver ${s.assignedDriverId || 'DRV-001'} after 96% deterministic capability match.`,
        actorName: 'Karthik Subramanian',
        actorRole: 'manager',
      },
    ];
    return {
      ...s,
      pickupAddress: s.pickupAddress || addr.pickup,
      deliveryAddress: s.deliveryAddress || addr.delivery,
      selectedRouteId: s.selectedRouteId || 'ROUTE-A-NH48',
      timeline: defaultTimeline,
    };
  });

const INITIAL_FLEET_TELEMETRY: Record<string, LiveGpsTelemetry> = {
  V1: {
    vehicleId: 'V1',
    driverId: 'DRV-001',
    shipmentId: 'S-GOLDEN',
    lat: 12.9165,
    lng: 79.1325,
    accuracyMeters: 8.4,
    speedKmh: 62,
    headingDegrees: 258,
    timestamp: new Date().toISOString(),
    isLiveDeviceGps: false,
    sharingActive: true,
    connectionStatus: 'online',
    corridorLabel: 'NH-48 Vellore Toll Checkpoint (Chennai → Bengaluru)',
    remainingDistanceKm: 210,
    estimatedArrivalIso: new Date(Date.now() + 3.4 * 3600 * 1000).toISOString(),
    routeDeviationDetected: false,
    deviationMeters: 0,
  },
  V2: {
    vehicleId: 'V2',
    driverId: 'DRV-004',
    shipmentId: 'S-CASE-A',
    lat: 12.9815,
    lng: 79.9682,
    accuracyMeters: 11.2,
    speedKmh: 48,
    headingDegrees: 265,
    timestamp: new Date().toISOString(),
    isLiveDeviceGps: false,
    sharingActive: true,
    connectionStatus: 'online',
    corridorLabel: 'Sriperumbudur Industrial Hub (NH-48)',
    remainingDistanceKm: 98,
    estimatedArrivalIso: new Date(Date.now() + 1.9 * 3600 * 1000).toISOString(),
    routeDeviationDetected: false,
    deviationMeters: 0,
  },
  V3: {
    vehicleId: 'V3',
    driverId: 'DRV-003',
    shipmentId: 'NONE',
    lat: 13.124,
    lng: 80.212,
    accuracyMeters: 5.0,
    speedKmh: 0,
    headingDegrees: 0,
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    isLiveDeviceGps: false,
    sharingActive: false,
    connectionStatus: 'offline',
    corridorLabel: 'Chennai Madhavaram Service Bay 3 (In Maintenance)',
    remainingDistanceKm: 0,
    estimatedArrivalIso: new Date().toISOString(),
    routeDeviationDetected: false,
  },
  V4: {
    vehicleId: 'V4',
    driverId: 'DRV-001',
    shipmentId: 'S-CASE-B',
    lat: 12.382,
    lng: 79.691,
    accuracyMeters: 9.8,
    speedKmh: 56,
    headingDegrees: 210,
    timestamp: new Date().toISOString(),
    isLiveDeviceGps: false,
    sharingActive: true,
    connectionStatus: 'online',
    corridorLabel: 'Tindivanam NH-38 Corridor (Chennai → Madurai)',
    remainingDistanceKm: 335,
    estimatedArrivalIso: new Date(Date.now() + 5.8 * 3600 * 1000).toISOString(),
    routeDeviationDetected: false,
  },
  V5: {
    vehicleId: 'V5',
    driverId: 'DRV-002',
    shipmentId: 'S-CASE-D',
    lat: 12.7409,
    lng: 77.8253,
    accuracyMeters: 14.5,
    speedKmh: 22,
    headingDegrees: 290,
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    isLiveDeviceGps: false,
    sharingActive: true,
    connectionStatus: 'stale',
    corridorLabel: 'Hosur SIPCOT Checkpost (Delayed Traffic / Route Deviation)',
    remainingDistanceKm: 42,
    estimatedArrivalIso: new Date(Date.now() + 1.2 * 3600 * 1000).toISOString(),
    routeDeviationDetected: true,
    deviationMeters: 1850,
  },
};

const INITIAL_TRIP_CHATS: Record<string, TripChatMessage[]> = {
  'S-GOLDEN': [
    {
      id: 'msg-1',
      tripId: 'S-GOLDEN',
      senderRole: 'manager',
      senderId: 'MGR-001',
      senderName: 'Karthik Subramanian (Dispatch Lead)',
      timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
      text: 'Ravi, FMCG pallet dispatch for S-GOLDEN is ready at Chennai Central Bay 4. Total weight 6.2T with 22 m³ volume. Tarp seal #CHN-9921 is allocated.',
      readByOtherRole: true,
    },
    {
      id: 'msg-2',
      tripId: 'S-GOLDEN',
      senderRole: 'driver',
      senderId: 'DRV-001',
      senderName: 'Ravi Kumar (Driver)',
      timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
      text: 'Vanakkam Karthik sir. Arrived at Bay 4 with assigned truck TN 38 AB 4521. Pre-trip inspection completed, tire pressure and 24V engine diagnostics all green.',
      readByOtherRole: true,
    },
    {
      id: 'msg-3',
      tripId: 'S-GOLDEN',
      senderRole: 'manager',
      senderId: 'MGR-001',
      senderName: 'Karthik Subramanian (Dispatch Lead)',
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      text: 'Superb. Consignee deadline in Bengaluru is 8:00 PM. HaulSense Agent also identified Return Load R1 (Bengaluru → Chennai) with ₹7,800 driver share. I have locked that backhaul for your truck.',
      readByOtherRole: true,
    },
    {
      id: 'msg-4',
      tripId: 'S-GOLDEN',
      senderRole: 'driver',
      senderId: 'DRV-001',
      senderName: 'Ravi Kumar (Driver)',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      text: 'Thank you sir! Return haul R1 is perfect. Fits our 7.5T closed hold. Loading completed, gate pass verified. Departing Chennai via NH-48 corridor.',
      attachmentType: 'location_pin',
      attachmentTitle: 'Current GPS Pin',
      attachmentData: 'NH-48 Sriperumbudur Tollway (Lat: 12.9821, Lng: 79.9412)',
      readByOtherRole: true,
    },
  ],
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'NOTIF-DEV-V5',
    timestamp: new Date(Date.now() - 6 * 60000).toISOString(),
    source: 'system',
    targetRole: 'all',
    type: 'route_deviation',
    severity: 'critical',
    title: 'Corridor Route Deviation: TN 09 AB 1234 (V5)',
    message:
      'Vehicle V5 on high-value electronics load S-CASE-D deviated 1,850m off assigned NH-48 corridor near Hosur SIPCOT checkpost. Forecasted ETA delayed by +24 mins.',
    read: false,
    acknowledged: false,
    relatedShipmentId: 'S-CASE-D',
    relatedVehicleId: 'V5',
    etaImpactMinutes: 24,
    deviationMeters: 1850,
    telemetryMetric: '1.85 km Off-Corridor • 22 km/h',
  },
  {
    id: 'NOTIF-FUEL-V4',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    source: 'system',
    targetRole: 'all',
    type: 'fuel_anomaly',
    severity: 'warning',
    title: 'Fuel Burn Anomaly Detected: TN 45 BD 8821 (V4)',
    message:
      'Live CAN-bus fuel telemetry on S-CASE-B (Chennai → Madurai) indicates +16.8% fuel consumption spike (3.1 km/L vs 3.8 km/L baseline) near Tindivanam grade.',
    read: false,
    acknowledged: false,
    relatedShipmentId: 'S-CASE-B',
    relatedVehicleId: 'V4',
    fuelVariancePercent: 16.8,
    telemetryMetric: '3.1 km/L (+16.8% Burn Rate)',
  },
  {
    id: 'NOTIF-DELAY-GOLDEN',
    timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
    source: 'system',
    targetRole: 'all',
    type: 'delay_alert',
    severity: 'warning',
    title: 'Toll Bottleneck Delay Forecast: S-GOLDEN (V1)',
    message:
      'Sriperumbudur Toll Plaza truck queue added +12 mins vs historical 30-day average. Current 62 km/h cruise pace on NH-48 Vellore stretch is recovering 8 mins of buffer.',
    read: false,
    acknowledged: false,
    relatedShipmentId: 'S-GOLDEN',
    relatedVehicleId: 'V1',
    etaImpactMinutes: 12,
    telemetryMetric: '+12m Toll Queue • 94% On-Time Confidence',
  },
  {
    id: 'NOTIF-1',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    source: 'agent',
    targetRole: 'all',
    type: 'return_load_match',
    severity: 'info',
    title: 'High-Profit Return Haul Identified (R1)',
    message:
      'Return load R1 (Bengaluru → Chennai) offers ₹7,800 driver earnings and +₹14,350 net fleet profit. Cycle profit optimal.',
    read: false,
    acknowledged: false,
    relatedShipmentId: 'S-GOLDEN',
    relatedVehicleId: 'V1',
  },
];

const LIFECYCLE_ORDER: TripLifecycleStatus[] = [
  'assigned',
  'accepted',
  'heading_to_pickup',
  'arrived_at_pickup',
  'pickup',
  'goods_collected',
  'heading_to_delivery',
  'in_transit',
  'arrived_at_delivery',
  'delivered',
  'completed',
];

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

export const LogisticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shipments, setShipments] = useState<Shipment[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SHIPMENTS);
      return stored ? enrichInitialShipments(JSON.parse(stored)) : enrichInitialShipments(ALL_SHIPMENTS);
    } catch {
      return enrichInitialShipments(ALL_SHIPMENTS);
    }
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VEHICLES);
      return stored ? JSON.parse(stored) : VEHICLES;
    } catch {
      return VEHICLES;
    }
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DRIVERS);
      return stored ? JSON.parse(stored) : DRIVERS;
    } catch {
      return DRIVERS;
    }
  });

  const [returnLoads, setReturnLoads] = useState<ReturnLoad[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RETURN_LOADS);
      return stored ? JSON.parse(stored) : RETURN_LOADS;
    } catch {
      return RETURN_LOADS;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [chatMessages, setChatMessages] = useState<Record<string, TripChatMessage[]>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHAT);
      return stored ? JSON.parse(stored) : INITIAL_TRIP_CHATS;
    } catch {
      return INITIAL_TRIP_CHATS;
    }
  });

  const [fleetTelemetry, setFleetTelemetry] =
    useState<Record<string, LiveGpsTelemetry>>(INITIAL_FLEET_TELEMETRY);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLogEntry[]>([]);

  // Real Smartphone Geolocation Watcher State
  const [isGpsTrackingActive, setIsGpsTrackingActive] = useState(false);
  const [activeTrackedShipmentId, setActiveTrackedShipmentId] = useState<string | null>(null);
  const [gpsPermissionState, setGpsPermissionState] = useState<
    'prompt' | 'granted' | 'denied' | 'unavailable'
  >('prompt');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastGpsUpdateIso, setLastGpsUpdateIso] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastSentTimestampRef = useRef<number>(0);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
      localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
      localStorage.setItem(STORAGE_KEYS.RETURN_LOADS, JSON.stringify(returnLoads));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(chatMessages));
    } catch (e) {
      console.warn('Failed to persist logistics data', e);
    }
  }, [shipments, vehicles, drivers, returnLoads, notifications, chatMessages]);

  // Poll backend fleet telemetry, notifications & audit logs periodically so Manager & Driver receive real-time updates
  const fetchBackendTelemetry = useCallback(() => {
    fetch('/api/gps/fleet')
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.telemetry)) {
          const mapObj: Record<string, LiveGpsTelemetry> = {};
          for (const item of data.telemetry) {
            mapObj[item.vehicleId] = item;
          }
          setFleetTelemetry((prev) => ({ ...prev, ...mapObj }));
        }
      })
      .catch(() => {});
  }, []);

  const fetchBackendNotifications = useCallback(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.notifications)) {
          setNotifications((prev) => {
            const byId = new Map<string, AppNotification>();
            prev.forEach((n) => byId.set(n.id, n));
            data.notifications.forEach((srvNotif: AppNotification) => {
              const existing = byId.get(srvNotif.id);
              if (existing) {
                byId.set(srvNotif.id, {
                  ...srvNotif,
                  read: existing.read || srvNotif.read,
                  acknowledged: existing.acknowledged || srvNotif.acknowledged,
                });
              } else {
                byId.set(srvNotif.id, srvNotif);
              }
            });
            return Array.from(byId.values()).sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          });
        }
      })
      .catch(() => {});
  }, []);

  const refreshAuditLogs = useCallback(() => {
    fetch('/api/audit-logs')
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.logs)) {
          setAuditLogs(data.logs);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBackendTelemetry();
    fetchBackendNotifications();
    refreshAuditLogs();
    const interval = setInterval(() => {
      fetchBackendTelemetry();
      fetchBackendNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchBackendTelemetry, fetchBackendNotifications, refreshAuditLogs]);

  // Cleanup GPS watchPosition on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const stopRealGpsTracking = useCallback(
    (reason = 'Stopped by driver or trip completed') => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsGpsTrackingActive(false);

      const trackedShipId = activeTrackedShipmentId || 'S-GOLDEN';
      const trackedShip = shipments.find((s) => s.id === trackedShipId);
      const vId = trackedShip?.assignedVehicleId || 'V1';

      setActiveTrackedShipmentId(null);

      setFleetTelemetry((prev) => {
        if (!prev[vId]) return prev;
        return {
          ...prev,
          [vId]: {
            ...prev[vId],
            sharingActive: false,
            speedKmh: 0,
            connectionStatus: 'offline',
            timestamp: new Date().toISOString(),
          },
        };
      });

      fetch('/api/gps/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: vId, shipmentId: trackedShipId, reason }),
      })
        .then(() => refreshAuditLogs())
        .catch(() => {});
    },
    [activeTrackedShipmentId, shipments, refreshAuditLogs]
  );

  const startRealGpsTracking = useCallback(
    (shipmentId: string, vehicleId: string, driverId: string) => {
      if (!('geolocation' in navigator)) {
        setGpsPermissionState('unavailable');
        setGpsError('Browser Geolocation API is not supported on this device.');
        return;
      }

      // Prevent duplicate watchers
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      setGpsError(null);
      setActiveTrackedShipmentId(shipmentId);
      setIsGpsTrackingActive(true);

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const now = Date.now();
          // Throttle backend writes to at most once every 3.5 seconds
          if (now - lastSentTimestampRef.current < 3500) {
            return;
          }
          lastSentTimestampRef.current = now;

          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracyMeters = pos.coords.accuracy || 8.0;
          const speedKmh =
            typeof pos.coords.speed === 'number' && pos.coords.speed >= 0
              ? Math.round(pos.coords.speed * 3.6)
              : 54;
          const headingDegrees =
            typeof pos.coords.heading === 'number' && !isNaN(pos.coords.heading)
              ? Math.round(pos.coords.heading)
              : 255;

          const isoNow = new Date().toISOString();
          setGpsPermissionState('granted');
          setGpsError(null);
          setLastGpsUpdateIso(isoNow);

          const liveEntry: LiveGpsTelemetry = {
            vehicleId,
            driverId,
            shipmentId,
            lat,
            lng,
            accuracyMeters: Math.round(accuracyMeters * 10) / 10,
            speedKmh,
            headingDegrees,
            timestamp: isoNow,
            isLiveDeviceGps: true,
            sharingActive: true,
            connectionStatus: 'online',
            corridorLabel: `Live Device GPS (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
            remainingDistanceKm: 192,
            estimatedArrivalIso: new Date(Date.now() + 3.1 * 3600 * 1000).toISOString(),
            routeDeviationDetected: false,
            deviationMeters: 0,
          };

          setFleetTelemetry((prev) => ({
            ...prev,
            [vehicleId]: liveEntry,
          }));

          fetch('/api/gps/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(liveEntry),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data?.ok && data.telemetry) {
                setFleetTelemetry((prev) => ({
                  ...prev,
                  [vehicleId]: data.telemetry,
                }));
              }
              refreshAuditLogs();
            })
            .catch(() => {});
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setGpsPermissionState('denied');
            setGpsError(
              'Location permission denied. Please grant browser location access to stream live smartphone GPS.'
            );
            setIsGpsTrackingActive(false);
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setGpsPermissionState('unavailable');
            setGpsError('Device GPS signal unavailable. Ensure high-accuracy location is enabled.');
          } else {
            setGpsError(`GPS timeout or signal delay: ${err.message}`);
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        }
      );

      watchIdRef.current = id;
    },
    [refreshAuditLogs]
  );

  // Validated lifecycle progression
  const updateTripLifecycle = useCallback(
    (
      shipmentId: string,
      status: TripLifecycleStatus,
      actorName = 'Ravi Kumar',
      actorRole: 'manager' | 'driver' = 'driver'
    ): { ok: boolean; error?: string } => {
      const targetShipment = shipments.find((s) => s.id === shipmentId);
      if (!targetShipment) {
        return { ok: false, error: `Shipment ${shipmentId} not found.` };
      }

      const currentStatus = targetShipment.lifecycleStatus || 'assigned';
      const curIdx = LIFECYCLE_ORDER.indexOf(currentStatus);
      const nextIdx = LIFECYCLE_ORDER.indexOf(status);

      if (curIdx !== -1 && nextIdx !== -1 && nextIdx < curIdx) {
        return {
          ok: false,
          error: `Cannot move backwards from '${currentStatus}' to '${status}'.`,
        };
      }

      const stageLabels: Record<TripLifecycleStatus, string> = {
        assigned: 'Trip Assigned',
        accepted: 'Trip Accepted by Driver',
        heading_to_pickup: 'En Route to Pickup Terminal',
        arrived_at_pickup: 'Arrived at Pickup Dock',
        pickup: 'At Pickup Terminal',
        goods_collected: 'Cargo Collected & Seal Verified (Switched Route to Delivery)',
        heading_to_delivery: 'Departed on Delivery Route',
        in_transit: 'In Corridor Transit',
        arrived_at_delivery: 'Arrived at Consignee Delivery Dock',
        delivered: 'Delivery Confirmed by Consignee',
        completed: 'Trip Cycle Completed & Settled',
      };

      const newTimelineEvent: ShipmentTimelineEvent = {
        id: `EVT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stage: status,
        title: stageLabels[status] || `Status: ${status}`,
        description: `${actorName} updated shipment ${shipmentId} to '${stageLabels[status] || status}'.`,
        actorName,
        actorRole,
      };

      setShipments((prev) =>
        prev.map((s) => {
          if (s.id === shipmentId) {
            return {
              ...s,
              lifecycleStatus: status,
              status:
                status === 'delivered' || status === 'completed'
                  ? 'delivered'
                  : status === 'assigned'
                  ? s.status
                  : 'in_transit',
              timeline: [...(s.timeline || []), newTimelineEvent],
            };
          }
          return s;
        })
      );

      // Automatically stop GPS tracking when trip is delivered or completed
      if (status === 'delivered' || status === 'completed') {
        stopRealGpsTracking(`Trip ${shipmentId} reached ${status}`);
      }

      const newNotif: AppNotification = {
        id: `NOTIF-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: actorRole,
        targetRole: actorRole === 'driver' ? 'manager' : 'driver',
        type: 'status_change',
        severity: 'info',
        title: `Trip ${shipmentId}: ${stageLabels[status] || status}`,
        message: `${actorName} advanced ${shipmentId} (${targetShipment.origin} → ${targetShipment.destination}) to '${stageLabels[status] || status}'.`,
        read: false,
        relatedShipmentId: shipmentId,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      fetch(`/api/trips/${shipmentId}/lifecycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStatus,
          nextStatus: status,
          actorName,
          actorRole,
        }),
      })
        .then(() => refreshAuditLogs())
        .catch(() => {});

      return { ok: true };
    },
    [shipments, stopRealGpsTracking, refreshAuditLogs]
  );

  const submitProofOfDelivery = useCallback(
    (shipmentId: string, podInput: Omit<ProofOfDelivery, 'deliveryTimestamp'>) => {
      const pod: ProofOfDelivery = {
        ...podInput,
        deliveryTimestamp: new Date().toISOString(),
      };

      const podEvent: ShipmentTimelineEvent = {
        id: `EVT-POD-${Date.now()}`,
        timestamp: pod.deliveryTimestamp,
        stage: 'pod_submitted',
        title: 'Digital Proof of Delivery (e-POD) Verified',
        description: `Receiver: ${pod.receiverName} (Code: ${pod.receiverConfirmationCode}). Notes: ${pod.deliveryNotes}`,
        actorName: 'Ravi Kumar',
        actorRole: 'driver',
      };

      setShipments((prev) =>
        prev.map((s) =>
          s.id === shipmentId
            ? {
                ...s,
                lifecycleStatus: 'delivered',
                status: 'delivered',
                proofOfDelivery: pod,
                timeline: [...(s.timeline || []), podEvent],
              }
            : s
        )
      );

      stopRealGpsTracking(`Proof of Delivery confirmed for ${shipmentId}`);

      const newNotif: AppNotification = {
        id: `NOTIF-POD-${Date.now()}`,
        timestamp: pod.deliveryTimestamp,
        source: 'driver',
        targetRole: 'manager',
        type: 'status_change',
        severity: 'info',
        title: `✓ Proof of Delivery Recorded (${shipmentId})`,
        message: `Consignee ${pod.receiverName} confirmed delivery (Ref: ${pod.receiverConfirmationCode}). GPS tracking automatically terminated.`,
        read: false,
        relatedShipmentId: shipmentId,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      fetch(`/api/trips/${shipmentId}/pod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(podInput),
      })
        .then(() => refreshAuditLogs())
        .catch(() => {});
    },
    [stopRealGpsTracking, refreshAuditLogs]
  );

  const selectShipmentRoute = useCallback(
    (shipmentId: string, routeId: string, routeLabel: string) => {
      const routeEvent: ShipmentTimelineEvent = {
        id: `EVT-RTE-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stage: 'route_selected',
        title: 'Active Corridor Route Selected',
        description: `Selected ${routeLabel} (${routeId}).`,
        actorName: 'Dispatch / Driver',
        actorRole: 'manager',
      };

      setShipments((prev) =>
        prev.map((s) =>
          s.id === shipmentId
            ? {
                ...s,
                selectedRouteId: routeId,
                timeline: [...(s.timeline || []), routeEvent],
              }
            : s
        )
      );
    },
    []
  );

  const createShipment = useCallback(
    (payload: {
      title: string;
      origin: string;
      destination: string;
      pickupAddress: string;
      deliveryAddress: string;
      distanceKm: number;
      weightTons: number;
      cargoType: Shipment['cargoType'];
      offeredFreight: number;
      assignedVehicleId: string;
      assignedDriverId: string;
      selectedRouteId?: string;
    }): { ok: boolean; error?: string; shipment?: Shipment } => {
      // Conflict Check: Prevent assigning a vehicle in maintenance
      const targetVeh = vehicles.find((v) => v.id === payload.assignedVehicleId);
      if (targetVeh && targetVeh.status === 'in_maintenance') {
        return {
          ok: false,
          error: `Assignment Conflict: Vehicle ${targetVeh.plateNumber} is currently in maintenance bay.`,
        };
      }

      if (targetVeh && payload.weightTons > targetVeh.capacityTons) {
        return {
          ok: false,
          error: `Capacity Conflict: Cargo weight (${payload.weightTons}T) exceeds ${targetVeh.plateNumber} maximum payload (${targetVeh.capacityTons}T).`,
        };
      }

      const newId = `S-CORR-${Math.floor(100 + Math.random() * 899)}`;
      const nowIso = new Date().toISOString();

      const newShipment: Shipment = {
        id: newId,
        title: payload.title,
        origin: payload.origin,
        destination: payload.destination,
        pickupAddress: payload.pickupAddress,
        deliveryAddress: payload.deliveryAddress,
        distanceKm: payload.distanceKm,
        weightTons: payload.weightTons,
        cargoType: payload.cargoType,
        offeredFreight: payload.offeredFreight,
        tollCost: Math.round(payload.distanceKm * 5.2),
        driverCost: Math.round(payload.distanceKm * 7.5),
        otherCost: 1100,
        departureTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        deliveryDeadline: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
        status: 'accepted',
        lifecycleStatus: 'assigned',
        assignedVehicleId: payload.assignedVehicleId,
        assignedDriverId: payload.assignedDriverId,
        selectedRouteId: payload.selectedRouteId || 'ROUTE-A-NH48',
        requirements: {
          cargoType: payload.cargoType,
          cargoWeightTons: payload.weightTons,
          cargoVolumeM3: Math.round(payload.weightTons * 3.4),
          requiredVehicleType: targetVeh?.vehicleType || 'Medium Truck',
          requiredBodyType: targetVeh?.bodyType || 'Closed Container',
          temperatureRequirement: 'ambient',
          specialHandling: 'none',
        },
        timeline: [
          {
            id: `EVT-${newId}-1`,
            timestamp: nowIso,
            stage: 'created',
            title: 'Shipment Dispatched by Manager',
            description: `${payload.title} (${payload.weightTons}T) created from ${payload.origin} to ${payload.destination}.`,
            actorName: 'Karthik Subramanian',
            actorRole: 'manager',
          },
          {
            id: `EVT-${newId}-2`,
            timestamp: nowIso,
            stage: 'driver_assigned',
            title: 'Vehicle & Driver Assigned',
            description: `Assigned ${targetVeh?.plateNumber || payload.assignedVehicleId} and driver ${payload.assignedDriverId}.`,
            actorName: 'Karthik Subramanian',
            actorRole: 'manager',
          },
        ],
      };

      setShipments((prev) => [newShipment, ...prev]);

      const notif: AppNotification = {
        id: `NOTIF-${Date.now()}`,
        timestamp: nowIso,
        source: 'manager',
        targetRole: 'all',
        type: 'assignment',
        severity: 'info',
        title: `New Shipment Dispatched: ${newId}`,
        message: `${newShipment.title} (${newShipment.origin} → ${newShipment.destination}) assigned to ${targetVeh?.plateNumber || payload.assignedVehicleId}.`,
        read: false,
        relatedShipmentId: newId,
        relatedVehicleId: payload.assignedVehicleId,
      };
      setNotifications((prev) => [notif, ...prev]);

      return { ok: true, shipment: newShipment };
    },
    [vehicles]
  );

  const reportIncident = (issue: Omit<DriverTripIssue, 'id' | 'timestamp' | 'resolved'>) => {
    const nowIso = new Date().toISOString();
    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now()}`,
      timestamp: nowIso,
      source: 'driver',
      targetRole: 'manager',
      type: 'incident',
      severity: issue.severity === 'high' ? 'critical' : 'warning',
      title: `⚠ Incident Reported: ${issue.category.toUpperCase().replace('_', ' ')}`,
      message: `Severity [${issue.severity.toUpperCase()}] on ${issue.tripId}: ${issue.description}`,
      read: false,
      relatedShipmentId: issue.tripId,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    const incEvent: ShipmentTimelineEvent = {
      id: `EVT-INC-${Date.now()}`,
      timestamp: nowIso,
      stage: 'incident_reported',
      title: `Incident / Delay Reported (${issue.category.replace('_', ' ')})`,
      description: issue.description,
      actorName: 'Ravi Kumar',
      actorRole: 'driver',
    };

    setShipments((prev) =>
      prev.map((s) =>
        s.id === issue.tripId
          ? { ...s, timeline: [...(s.timeline || []), incEvent] }
          : s
      )
    );
  };

  const requestVehicleAlternative = (
    shipmentId: string,
    currentVehicleId: string,
    reason: string
  ) => {
    const curVeh = vehicles.find((v) => v.id === currentVehicleId);
    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'driver',
      targetRole: 'manager',
      type: 'mismatch_alert',
      severity: 'warning',
      title: `⚠ Vehicle Mismatch Alert: ${curVeh?.plateNumber || currentVehicleId}`,
      message: `Driver flagged vehicle mismatch for shipment ${shipmentId}. Reason: ${reason}. Alternative vehicle requested.`,
      read: false,
      relatedShipmentId: shipmentId,
      relatedVehicleId: currentVehicleId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const claimReturnLoad = (returnLoadId: string, driverId: string) => {
    setReturnLoads((prev) =>
      prev.map((r) => (r.id === returnLoadId ? { ...r, status: 'reserved' } : r))
    );

    const ret = returnLoads.find((r) => r.id === returnLoadId);
    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'driver',
      targetRole: 'all',
      type: 'return_load_match',
      severity: 'info',
      title: `Return Load Claimed: ${ret?.origin} → ${ret?.destination}`,
      message: `Driver ${driverId} claimed return load ${returnLoadId} (Driver Earnings: ₹${ret?.driverShare.toLocaleString('en-IN')}).`,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const updateDriverAvailability = (driverId: string, status: Driver['status']) => {
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId
          ? {
              ...d,
              status,
              availability: { ...d.availability, status },
            }
          : d
      )
    );
  };

  const triggerRealtimeAlert = useCallback(
    (payload: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { id?: string }) => {
      const alertId =
        payload.id || `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const nowIso = new Date().toISOString();

      const localNotif: AppNotification = {
        ...payload,
        id: alertId,
        timestamp: nowIso,
        read: false,
        acknowledged: false,
      };

      setNotifications((prev) => {
        if (prev.some((n) => n.id === alertId)) return prev;
        return [localNotif, ...prev];
      });

      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localNotif),
      })
        .then(() => {
          fetchBackendTelemetry();
          refreshAuditLogs();
        })
        .catch(() => {});
    },
    [fetchBackendTelemetry, refreshAuditLogs]
  );

  const reportFuelAnomaly = useCallback(
    (shipmentId: string, vehicleId: string, fuelVariancePercent: number, details?: string) => {
      const veh = vehicles.find((v) => v.id === vehicleId);
      const ship = shipments.find((s) => s.id === shipmentId);
      const plate = veh?.plateNumber || vehicleId;
      const baseMileage = veh?.mileageKmPerLitre || 4.0;
      const degradedMileage = Math.max(
        1.8,
        Math.round(baseMileage * (1 - fuelVariancePercent / 100) * 10) / 10
      );

      const desc =
        details ||
        `CAN-bus fuel telemetry on ${plate} (${shipmentId}: ${ship?.origin || 'Chennai'} → ${
          ship?.destination || 'Bengaluru'
        }) detected a +${fuelVariancePercent.toFixed(
          1
        )}% fuel burn anomaly (${degradedMileage} km/L vs ${baseMileage} km/L historical baseline). Check injector pressure / tyre drag.`;

      triggerRealtimeAlert({
        source: 'system',
        targetRole: 'all',
        type: 'fuel_anomaly',
        severity: fuelVariancePercent >= 20 ? 'critical' : 'warning',
        title: `Fuel Burn Anomaly (+${fuelVariancePercent.toFixed(1)}%): ${plate}`,
        message: desc,
        relatedShipmentId: shipmentId,
        relatedVehicleId: vehicleId,
        fuelVariancePercent,
        telemetryMetric: `${degradedMileage} km/L (+${fuelVariancePercent.toFixed(1)}% Burn)`,
      });

      setFleetTelemetry((prev) => {
        if (!prev[vehicleId]) return prev;
        return {
          ...prev,
          [vehicleId]: {
            ...prev[vehicleId],
            fuelAnomalyDetected: true,
            fuelVariancePercent,
          },
        };
      });

      const evt: ShipmentTimelineEvent = {
        id: `EVT-FUEL-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stage: 'fuel_anomaly',
        title: `Fuel Burn Anomaly Flagged (+${fuelVariancePercent.toFixed(1)}%)`,
        description: desc,
        actorName: 'HaulSense Telemetry Monitor',
        actorRole: 'system',
      };

      setShipments((prev) =>
        prev.map((s) => (s.id === shipmentId ? { ...s, timeline: [...(s.timeline || []), evt] } : s))
      );
    },
    [vehicles, shipments, triggerRealtimeAlert]
  );

  const reportRouteDeviation = useCallback(
    (shipmentId: string, vehicleId: string, deviationMeters: number, locationLabel?: string) => {
      const veh = vehicles.find((v) => v.id === vehicleId);
      const plate = veh?.plateNumber || vehicleId;
      const kmOff = (deviationMeters / 1000).toFixed(2);
      const etaPenalty = Math.max(10, Math.round(deviationMeters / 90));
      const loc = locationLabel || 'NH-48 Corridor Checkpoint';

      const desc = `Vehicle ${plate} (${shipmentId}) deviated ${kmOff} km (${deviationMeters}m) from the approved corridor near ${loc}. Projected ETA impacted by +${etaPenalty} mins.`;

      triggerRealtimeAlert({
        source: 'system',
        targetRole: 'all',
        type: 'route_deviation',
        severity: 'critical',
        title: `Corridor Route Deviation (${kmOff} km): ${plate}`,
        message: desc,
        relatedShipmentId: shipmentId,
        relatedVehicleId: vehicleId,
        deviationMeters,
        etaImpactMinutes: etaPenalty,
        telemetryMetric: `${kmOff} km Off-Route • +${etaPenalty}m ETA`,
      });

      setFleetTelemetry((prev) => {
        if (!prev[vehicleId]) return prev;
        return {
          ...prev,
          [vehicleId]: {
            ...prev[vehicleId],
            routeDeviationDetected: true,
            deviationMeters,
            delayMinutes: (prev[vehicleId].delayMinutes || 0) + etaPenalty,
            estimatedArrivalIso: new Date(
              new Date(prev[vehicleId].estimatedArrivalIso).getTime() + etaPenalty * 60000
            ).toISOString(),
          },
        };
      });

      const evt: ShipmentTimelineEvent = {
        id: `EVT-DEV-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stage: 'route_deviation',
        title: `Corridor Route Deviation (${kmOff} km)`,
        description: desc,
        actorName: 'HaulSense GPS Geofence',
        actorRole: 'system',
      };

      setShipments((prev) =>
        prev.map((s) => (s.id === shipmentId ? { ...s, timeline: [...(s.timeline || []), evt] } : s))
      );
    },
    [vehicles, triggerRealtimeAlert]
  );

  const reportTripDelay = useCallback(
    (shipmentId: string, vehicleId: string, delayMinutes: number, reason: string) => {
      const veh = vehicles.find((v) => v.id === vehicleId);
      const plate = veh?.plateNumber || vehicleId;
      const desc = `Delay of +${delayMinutes} mins detected on ${shipmentId} (${plate}): ${reason}. Arrival time forecast automatically adjusted.`;

      triggerRealtimeAlert({
        source: 'driver',
        targetRole: 'all',
        type: 'delay_alert',
        severity: delayMinutes >= 30 ? 'critical' : 'warning',
        title: `Critical Transit Delay (+${delayMinutes}m): ${shipmentId}`,
        message: desc,
        relatedShipmentId: shipmentId,
        relatedVehicleId: vehicleId,
        etaImpactMinutes: delayMinutes,
        telemetryMetric: `+${delayMinutes}m Delay • ETA Adjusted`,
      });

      setFleetTelemetry((prev) => {
        if (!prev[vehicleId]) return prev;
        return {
          ...prev,
          [vehicleId]: {
            ...prev[vehicleId],
            delayMinutes: (prev[vehicleId].delayMinutes || 0) + delayMinutes,
            estimatedArrivalIso: new Date(
              new Date(prev[vehicleId].estimatedArrivalIso).getTime() + delayMinutes * 60000
            ).toISOString(),
          },
        };
      });

      const evt: ShipmentTimelineEvent = {
        id: `EVT-DLY-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stage: 'delay_alert',
        title: `Transit Delay Alert (+${delayMinutes} mins)`,
        description: desc,
        actorName: 'Corridor ETA Forecaster',
        actorRole: 'system',
      };

      setShipments((prev) =>
        prev.map((s) => (s.id === shipmentId ? { ...s, timeline: [...(s.timeline || []), evt] } : s))
      );
    },
    [vehicles, triggerRealtimeAlert]
  );

  const acknowledgeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, acknowledged: true } : n))
    );
    fetch(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
  }, []);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, acknowledged: true } : n))
    );
    fetch(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
  };

  const clearNotifications = () => {
    setNotifications([]);
    fetch('/api/notifications/clear', { method: 'POST' }).catch(() => {});
  };

  const sendChatMessage = async (
    tripId: string,
    msg: Omit<TripChatMessage, 'id' | 'timestamp' | 'readByOtherRole'>
  ): Promise<TripChatMessage> => {
    const localNewMessage: TripChatMessage = {
      ...msg,
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tripId,
      timestamp: new Date().toISOString(),
      readByOtherRole: false,
    };

    setChatMessages((prev) => {
      const existing = prev[tripId] || [];
      return {
        ...prev,
        [tripId]: [...existing, localNewMessage],
      };
    });

    const otherRole: 'manager' | 'driver' = msg.senderRole === 'manager' ? 'driver' : 'manager';
    triggerRealtimeAlert({
      source: msg.senderRole,
      targetRole: otherRole,
      type: 'status_change',
      severity: 'info',
      title: `New Trip Message (${tripId})`,
      message: `${msg.senderName}: "${msg.text.slice(0, 75)}${msg.text.length > 75 ? '...' : ''}"`,
      relatedShipmentId: tripId,
    });

    try {
      const res = await fetch(`/api/chat/${tripId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          return data.message;
        }
      }
    } catch {
      // Fallback to local state if offline
    }

    return localNewMessage;
  };

  const markTripChatAsRead = (tripId: string, forRole: 'manager' | 'driver') => {
    setChatMessages((prev) => {
      const list = prev[tripId];
      if (!list) return prev;
      const updated = list.map((m) =>
        m.senderRole !== forRole ? { ...m, readByOtherRole: true } : m
      );
      return { ...prev, [tripId]: updated };
    });
  };

  const resetToDefaults = () => {
    setShipments(enrichInitialShipments(ALL_SHIPMENTS));
    setVehicles(VEHICLES);
    setDrivers(DRIVERS);
    setReturnLoads(RETURN_LOADS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setChatMessages(INITIAL_TRIP_CHATS);
    setFleetTelemetry(INITIAL_FLEET_TELEMETRY);
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  };

  return (
    <LogisticsContext.Provider
      value={{
        shipments,
        vehicles,
        drivers,
        returnLoads,
        notifications,
        chatMessages,
        fleetTelemetry,
        auditLogs,
        isGpsTrackingActive,
        activeTrackedShipmentId,
        gpsPermissionState,
        gpsError,
        lastGpsUpdateIso,
        updateTripLifecycle,
        submitProofOfDelivery,
        selectShipmentRoute,
        createShipment,
        startRealGpsTracking,
        stopRealGpsTracking,
        reportIncident,
        requestVehicleAlternative,
        claimReturnLoad,
        updateDriverAvailability,
        triggerRealtimeAlert,
        reportFuelAnomaly,
        reportRouteDeviation,
        reportTripDelay,
        acknowledgeNotification,
        markNotificationAsRead,
        clearNotifications,
        sendChatMessage,
        markTripChatAsRead,
        refreshAuditLogs,
        resetToDefaults,
      }}
    >
      {children}
    </LogisticsContext.Provider>
  );
};

export const useLogistics = () => {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
};
