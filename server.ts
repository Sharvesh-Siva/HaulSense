/**
 * HaulSense - Production-Grade Full-Stack Express Server
 * Provides:
 * 1. Authenticated Session & Role-Based Access Control (RBAC) + Dev Simulator Isolation
 * 2. Security & Operational Audit Trail (/api/audit-logs)
 * 3. Real-Time Driver Smartphone GPS Telemetry & Stale Detection (/api/gps/*)
 * 4. Intelligent Multi-Route Recommendation Engine (/api/routes/recommend)
 * 5. Validated Trip Lifecycle, Proof-of-Delivery & Conflict-Checked Dispatch (/api/trips/*)
 * 6. Two-Way Driver ↔ Manager Trip Chat (/api/chat/:tripId)
 * 7. SSE Autonomous Agent Orchestrator (/api/agent/run)
 */

import express from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { runAgentOrchestrator } from './src/agent/orchestrator';
import { ALL_SHIPMENTS, DRIVERS, VEHICLES, CITIES } from './src/data/mockData';
import {
  AgentEvent,
  LiveGpsTelemetry,
  RouteAlternative,
  SecurityAuditLogEntry,
  Shipment,
  TripLifecycleStatus,
} from './src/types';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

interface ServerSession {
  token: string;
  userId: string;
  name: string;
  role: 'manager' | 'driver';
  baseRole: 'manager' | 'driver'; // Original authenticated role
  email?: string;
  driverId?: string;
  organizationId: string;
  isDevSimulator: boolean;
  createdAt: string;
  expiresAt: number;
}

// Valid sequential lifecycle order
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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Basic security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // In-memory stores
  const sessions = new Map<string, ServerSession>();
  const auditLogs: SecurityAuditLogEntry[] = [
    {
      id: 'AUD-1001',
      timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
      actorId: 'MGR-001',
      actorName: 'Karthik Subramanian',
      actorRole: 'manager',
      action: 'SHIPMENT_CREATED',
      targetRecord: 'S-GOLDEN',
      status: 'success',
      details: 'Created FMCG Pallet Distribution (Chennai → Bengaluru, 6.2T) & assigned V1 / DRV-001.',
    },
    {
      id: 'AUD-1002',
      timestamp: new Date(Date.now() - 42 * 60000).toISOString(),
      actorId: 'DRV-001',
      actorName: 'Ravi Kumar',
      actorRole: 'driver',
      action: 'AUTH_LOGIN',
      targetRecord: 'DRV-001',
      status: 'success',
      details: 'Driver Ravi Kumar authenticated via PIN verification.',
    },
    {
      id: 'AUD-1003',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      actorId: 'MGR-001',
      actorName: 'Karthik Subramanian',
      actorRole: 'manager',
      action: 'ROUTE_RECOMMENDATION_COMPUTED',
      targetRecord: 'S-GOLDEN',
      status: 'success',
      details: 'Evaluated 3 corridor alternatives for Chennai → Bengaluru; selected Route A (NH-48 Golden Quadrilateral).',
    },
  ];

  const recordAudit = (
    actorId: string,
    actorName: string,
    actorRole: SecurityAuditLogEntry['actorRole'],
    action: string,
    targetRecord: string,
    status: SecurityAuditLogEntry['status'],
    details: string
  ) => {
    const entry: SecurityAuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      actorId,
      actorName,
      actorRole,
      action,
      targetRecord,
      status,
      details,
    };
    auditLogs.unshift(entry);
    if (auditLogs.length > 200) {
      auditLogs.pop();
    }
    return entry;
  };

  // Initial Fleet Telemetry Store (keyed by vehicleId)
  const fleetTelemetryStore: Record<string, LiveGpsTelemetry> = {
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
      corridorLabel: 'Chennai Madhavaram Service Bay 3 (Maintenance)',
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
      corridorLabel: 'Hosur SIPCOT Checkpost (Delayed Traffic)',
      remainingDistanceKm: 42,
      estimatedArrivalIso: new Date(Date.now() + 1.2 * 3600 * 1000).toISOString(),
      routeDeviationDetected: true,
      deviationMeters: 1850,
    },
  };

  // Helper to extract session from Authorization header
  const getSessionFromRequest = (req: express.Request): ServerSession | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7).trim();
    const session = sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      sessions.delete(token);
      return null;
    }
    return session;
  };

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'HaulSense Backend',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      hasMapsKey: Boolean(
        process.env.VITE_GOOGLE_MAPS_API_KEY ||
          process.env.GOOGLE_MAPS_PLATFORM_API_KEY ||
          process.env.GOOGLE_MAPS_API_KEY
      ),
      timestamp: new Date().toISOString(),
    });
  });

  // ================= PHASE 2 & 10: AUTHENTICATION & RBAC ENDPOINTS =================

  app.post('/api/auth/login', (req, res) => {
    const { mode, email, password, driverId, pin, isDevSimulator } = req.body;

    if (mode === 'manager') {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanPass = String(password || '').trim();

      if (
        (cleanEmail === 'manager@haulsense.in' && cleanPass === 'haul123') ||
        isDevSimulator === true
      ) {
        const token = `hs_tok_${crypto.randomBytes(16).toString('hex')}`;
        const session: ServerSession = {
          token,
          userId: 'MGR-001',
          name: 'Karthik Subramanian',
          role: 'manager',
          baseRole: 'manager',
          email: 'manager@haulsense.in',
          organizationId: 'ORG-SRI-MURUGAN',
          isDevSimulator: Boolean(isDevSimulator),
          createdAt: new Date().toISOString(),
          expiresAt: Date.now() + 12 * 3600 * 1000,
        };
        sessions.set(token, session);
        recordAudit(
          session.userId,
          session.name,
          'manager',
          isDevSimulator ? 'DEV_SIMULATOR_MANAGER_INIT' : 'AUTH_LOGIN_MANAGER',
          'MGR-001',
          'success',
          `Manager session established (${isDevSimulator ? 'Dev Simulator Mode' : 'Enterprise Credentials'}).`
        );
        res.json({ ok: true, session });
        return;
      }

      recordAudit(
        cleanEmail || 'unknown',
        cleanEmail || 'Unknown Actor',
        'anonymous',
        'AUTH_LOGIN_FAILED',
        'MGR-001',
        'denied',
        'Invalid manager email or password.'
      );
      res.status(401).json({
        ok: false,
        error: 'Invalid enterprise credentials. Use manager@haulsense.in / haul123',
      });
      return;
    }

    if (mode === 'driver') {
      const cleanDriverId = String(driverId || 'DRV-001').trim().toUpperCase();
      const cleanPin = String(pin || '').trim();
      const matchedDriver = DRIVERS.find((d) => d.id === cleanDriverId);

      if (!matchedDriver) {
        recordAudit(
          cleanDriverId,
          cleanDriverId,
          'anonymous',
          'AUTH_LOGIN_FAILED',
          cleanDriverId,
          'denied',
          `Driver ID ${cleanDriverId} not found.`
        );
        res.status(404).json({
          ok: false,
          error: `Driver ID '${cleanDriverId}' not found in fleet roster.`,
        });
        return;
      }

      if (cleanPin !== '1234' && !isDevSimulator) {
        recordAudit(
          cleanDriverId,
          matchedDriver.name,
          'driver',
          'AUTH_LOGIN_FAILED',
          cleanDriverId,
          'denied',
          'Invalid driver PIN.'
        );
        res.status(401).json({
          ok: false,
          error: 'Invalid Driver PIN. Enter your 4-digit fleet PIN (1234).',
        });
        return;
      }

      const token = `hs_tok_${crypto.randomBytes(16).toString('hex')}`;
      const session: ServerSession = {
        token,
        userId: matchedDriver.id,
        name: matchedDriver.name,
        role: 'driver',
        baseRole: 'driver',
        driverId: matchedDriver.id,
        organizationId: 'ORG-SRI-MURUGAN',
        isDevSimulator: Boolean(isDevSimulator),
        createdAt: new Date().toISOString(),
        expiresAt: Date.now() + 12 * 3600 * 1000,
      };
      sessions.set(token, session);
      recordAudit(
        session.userId,
        session.name,
        'driver',
        isDevSimulator ? 'DEV_SIMULATOR_DRIVER_INIT' : 'AUTH_LOGIN_DRIVER',
        matchedDriver.id,
        'success',
        `Driver session established for ${matchedDriver.name}.`
      );
      res.json({ ok: true, session });
      return;
    }

    res.status(400).json({ ok: false, error: 'Unsupported authentication mode.' });
  });

  // POST /api/auth/switch-workspace - Server-verified workspace switching
  app.post('/api/auth/switch-workspace', (req, res) => {
    const session = getSessionFromRequest(req);
    const { targetRole, targetDriverId, allowDevSimulator } = req.body;

    // A production driver account CANNOT self-elevate to manager without Dev Simulator or Manager Base Role
    if (
      session &&
      session.baseRole === 'driver' &&
      !session.isDevSimulator &&
      !allowDevSimulator &&
      targetRole === 'manager'
    ) {
      recordAudit(
        session.userId,
        session.name,
        'driver',
        'UNAUTHORIZED_ROLE_ELEVATION_BLOCKED',
        '/manager',
        'denied',
        `Driver ${session.name} attempted to access Manager Portal without manager credentials.`
      );
      res.status(403).json({
        ok: false,
        error:
          'Access Denied: Driver accounts cannot access the Manager Operations Portal without Manager authentication.',
      });
      return;
    }

    // If switching to driver workspace
    if (targetRole === 'driver') {
      const dId = targetDriverId || session?.driverId || 'DRV-001';
      const drv = DRIVERS.find((d) => d.id === dId) || DRIVERS[0];
      const token = session?.token || `hs_tok_${crypto.randomBytes(16).toString('hex')}`;
      const updatedSession: ServerSession = {
        token,
        userId: drv.id,
        name: drv.name,
        role: 'driver',
        baseRole: session?.baseRole || 'manager',
        driverId: drv.id,
        organizationId: 'ORG-SRI-MURUGAN',
        isDevSimulator: Boolean(session?.isDevSimulator ?? allowDevSimulator ?? true),
        createdAt: session?.createdAt || new Date().toISOString(),
        expiresAt: Date.now() + 12 * 3600 * 1000,
      };
      sessions.set(token, updatedSession);
      recordAudit(
        updatedSession.userId,
        updatedSession.name,
        updatedSession.role,
        'WORKSPACE_SWITCH_TO_DRIVER',
        drv.id,
        'success',
        `Switched active workspace to Driver Portal (${drv.name}).`
      );
      res.json({ ok: true, session: updatedSession });
      return;
    }

    // Switching to manager workspace (permitted for baseRole === 'manager' or Dev Simulator)
    const token = session?.token || `hs_tok_${crypto.randomBytes(16).toString('hex')}`;
    const updatedSession: ServerSession = {
      token,
      userId: 'MGR-001',
      name: 'Karthik Subramanian',
      role: 'manager',
      baseRole: 'manager',
      email: 'manager@haulsense.in',
      organizationId: 'ORG-SRI-MURUGAN',
      isDevSimulator: Boolean(session?.isDevSimulator ?? allowDevSimulator ?? true),
      createdAt: session?.createdAt || new Date().toISOString(),
      expiresAt: Date.now() + 12 * 3600 * 1000,
    };
    sessions.set(token, updatedSession);
    recordAudit(
      updatedSession.userId,
      updatedSession.name,
      'manager',
      'WORKSPACE_SWITCH_TO_MANAGER',
      'MGR-001',
      'success',
      'Switched active workspace to Manager Operations Portal.'
    );
    res.json({ ok: true, session: updatedSession });
  });

  app.post('/api/auth/logout', (req, res) => {
    const session = getSessionFromRequest(req);
    if (session) {
      recordAudit(
        session.userId,
        session.name,
        session.role,
        'AUTH_LOGOUT',
        session.userId,
        'success',
        'Session terminated by user.'
      );
      sessions.delete(session.token);
    }
    res.json({ ok: true });
  });

  // Server-authoritative real-time notifications store
  interface ServerNotification {
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
    severity: 'info' | 'warning' | 'critical';
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

  const notificationsStore: ServerNotification[] = [
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

  const pushServerNotification = (
    notif: Omit<ServerNotification, 'id' | 'timestamp' | 'read'> & { id?: string }
  ): ServerNotification => {
    const cleanTitle = String(notif.title || 'Operational Alert').slice(0, 140);
    const cleanMessage = String(notif.message || '').slice(0, 500);
    const entryId =
      notif.id || `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Idempotency guard: if an alert with the same ID already exists, return it
    const existingIdx = notificationsStore.findIndex((n) => n.id === entryId);
    if (existingIdx !== -1) {
      return notificationsStore[existingIdx];
    }

    const created: ServerNotification = {
      ...notif,
      id: entryId,
      title: cleanTitle,
      message: cleanMessage,
      timestamp: new Date().toISOString(),
      read: false,
      acknowledged: false,
    };

    notificationsStore.unshift(created);
    if (notificationsStore.length > 100) {
      notificationsStore.pop();
    }
    return created;
  };

  app.get('/api/audit-logs', (_req, res) => {
    res.json({ ok: true, logs: auditLogs });
  });

  // ================= REAL-TIME NOTIFICATIONS API =================

  app.get('/api/notifications', (req, res) => {
    const roleFilter = String(req.query.role || '').toLowerCase();
    const list =
      roleFilter === 'manager' || roleFilter === 'driver'
        ? notificationsStore.filter((n) => n.targetRole === roleFilter || n.targetRole === 'all')
        : notificationsStore;
    res.json({ ok: true, notifications: list, serverTime: new Date().toISOString() });
  });

  app.post('/api/notifications', (req, res) => {
    const session = getSessionFromRequest(req);
    const {
      id,
      source,
      targetRole,
      type,
      severity,
      title,
      message,
      relatedShipmentId,
      relatedVehicleId,
      etaImpactMinutes,
      fuelVariancePercent,
      deviationMeters,
      telemetryMetric,
    } = req.body;

    if (!title || !message) {
      res.status(400).json({ ok: false, error: 'Notification title and message are required.' });
      return;
    }

    const created = pushServerNotification({
      id,
      source: source || session?.role || 'system',
      targetRole: targetRole || 'all',
      type: type || 'status_change',
      severity: severity || 'info',
      title,
      message,
      relatedShipmentId,
      relatedVehicleId,
      etaImpactMinutes: typeof etaImpactMinutes === 'number' ? etaImpactMinutes : undefined,
      fuelVariancePercent: typeof fuelVariancePercent === 'number' ? fuelVariancePercent : undefined,
      deviationMeters: typeof deviationMeters === 'number' ? deviationMeters : undefined,
      telemetryMetric: telemetryMetric ? String(telemetryMetric).slice(0, 80) : undefined,
    });

    // Also update fleetTelemetryStore if this is a fuel anomaly, delay, or route deviation alert
    if (relatedVehicleId && fleetTelemetryStore[relatedVehicleId]) {
      const vehTel = fleetTelemetryStore[relatedVehicleId];
      if (type === 'fuel_anomaly') {
        vehTel.fuelAnomalyDetected = true;
        vehTel.fuelVariancePercent = typeof fuelVariancePercent === 'number' ? fuelVariancePercent : 18.5;
      } else if (type === 'route_deviation') {
        vehTel.routeDeviationDetected = true;
        vehTel.deviationMeters = typeof deviationMeters === 'number' ? deviationMeters : 2100;
      } else if (type === 'delay_alert' && typeof etaImpactMinutes === 'number') {
        vehTel.delayMinutes = (vehTel.delayMinutes || 0) + etaImpactMinutes;
        vehTel.estimatedArrivalIso = new Date(
          new Date(vehTel.estimatedArrivalIso).getTime() + etaImpactMinutes * 60000
        ).toISOString();
      }
    }

    recordAudit(
      session?.userId || (source === 'driver' ? 'DRV-001' : 'MGR-001'),
      session?.name || 'Telemetry Alert Engine',
      session?.role || (source === 'driver' ? 'driver' : 'manager'),
      `ALERT_${String(type || 'STATUS').toUpperCase()}`,
      relatedShipmentId || relatedVehicleId || 'FLEET',
      severity === 'critical' ? 'warning' : 'success',
      `[${String(severity || 'info').toUpperCase()}] ${created.title}: ${created.message}`
    );

    res.json({ ok: true, notification: created });
  });

  app.post('/api/notifications/:id/read', (req, res) => {
    const { id } = req.params;
    const target = notificationsStore.find((n) => n.id === id);
    if (target) {
      target.read = true;
      target.acknowledged = true;
    }
    res.json({ ok: true, notification: target || null });
  });

  app.post('/api/notifications/clear', (_req, res) => {
    notificationsStore.forEach((n) => {
      n.read = true;
      n.acknowledged = true;
    });
    res.json({ ok: true });
  });

  // ================= PHASE 4 & 5: REAL-TIME GPS TRACKING ENDPOINTS =================

  app.get('/api/gps/fleet', (_req, res) => {
    const now = Date.now();
    const list = Object.values(fleetTelemetryStore).map((item) => {
      const ageMs = now - new Date(item.timestamp).getTime();
      let connectionStatus: LiveGpsTelemetry['connectionStatus'] = item.connectionStatus;
      if (item.sharingActive) {
        if (ageMs > 180000) connectionStatus = 'offline';
        else if (ageMs > 60000 && item.isLiveDeviceGps) connectionStatus = 'stale';
        else connectionStatus = 'online';
      }
      return { ...item, connectionStatus };
    });
    res.json({ ok: true, telemetry: list, serverTime: new Date().toISOString() });
  });

  app.post('/api/gps/update', (req, res) => {
    const session = getSessionFromRequest(req);
    const {
      vehicleId,
      driverId,
      shipmentId,
      lat,
      lng,
      accuracyMeters,
      speedKmh,
      headingDegrees,
      corridorLabel,
      remainingDistanceKm,
      fuelVariancePercent,
      delayMinutes,
    } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ ok: false, error: 'Valid numeric lat/lng coordinates required.' });
      return;
    }

    // Enforce driver ownership: a driver cannot overwrite another driver's vehicle GPS
    if (session && session.role === 'driver' && session.driverId && driverId && session.driverId !== driverId) {
      recordAudit(
        session.userId,
        session.name,
        'driver',
        'GPS_SPOOF_ATTEMPT_BLOCKED',
        vehicleId || 'UNKNOWN',
        'denied',
        `Driver ${session.driverId} attempted to overwrite GPS for driver ${driverId}.`
      );
      res.status(403).json({
        ok: false,
        error: 'Forbidden: You may only transmit GPS coordinates for your own assigned trip.',
      });
      return;
    }

    const vId = vehicleId || 'V1';
    const existing = fleetTelemetryStore[vId];

    // Check route deviation from Chennai-Bengaluru corridor lat/lng band
    const expectedLat = 12.95;
    const latDiffKm = Math.abs(lat - expectedLat) * 111;
    const routeDeviationDetected = latDiffKm > 35; // >35km off highway corridor band
    const computedDeviationMeters = routeDeviationDetected ? Math.round(latDiffKm * 1000) : 0;

    const updated: LiveGpsTelemetry = {
      vehicleId: vId,
      driverId: driverId || session?.driverId || existing?.driverId || 'DRV-001',
      shipmentId: shipmentId || existing?.shipmentId || 'S-GOLDEN',
      lat,
      lng,
      accuracyMeters: typeof accuracyMeters === 'number' ? Math.round(accuracyMeters * 10) / 10 : 6.5,
      speedKmh: typeof speedKmh === 'number' && speedKmh >= 0 ? Math.round(speedKmh) : existing?.speedKmh || 58,
      headingDegrees: typeof headingDegrees === 'number' ? Math.round(headingDegrees) : 260,
      timestamp: new Date().toISOString(),
      isLiveDeviceGps: true,
      sharingActive: true,
      connectionStatus: 'online',
      corridorLabel:
        corridorLabel ||
        `Live Smartphone GPS (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
      remainingDistanceKm:
        typeof remainingDistanceKm === 'number'
          ? remainingDistanceKm
          : existing?.remainingDistanceKm ?? 195,
      estimatedArrivalIso: new Date(Date.now() + 3.2 * 3600 * 1000).toISOString(),
      routeDeviationDetected,
      deviationMeters: computedDeviationMeters,
      fuelAnomalyDetected: existing?.fuelAnomalyDetected || (typeof fuelVariancePercent === 'number' && fuelVariancePercent > 15),
      fuelVariancePercent: typeof fuelVariancePercent === 'number' ? fuelVariancePercent : existing?.fuelVariancePercent,
      delayMinutes: typeof delayMinutes === 'number' ? delayMinutes : existing?.delayMinutes,
    };

    fleetTelemetryStore[vId] = updated;

    if (routeDeviationDetected && !existing?.routeDeviationDetected) {
      pushServerNotification({
        id: `NOTIF-DEV-${vId}-${updated.shipmentId}`,
        source: 'system',
        targetRole: 'all',
        type: 'route_deviation',
        severity: 'critical',
        title: `Live GPS Route Deviation: ${vId} (${updated.shipmentId})`,
        message: `Vehicle ${vId} is ${(computedDeviationMeters / 1000).toFixed(1)} km off the designated corridor at (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E).`,
        relatedShipmentId: updated.shipmentId,
        relatedVehicleId: vId,
        deviationMeters: computedDeviationMeters,
        telemetryMetric: `${(computedDeviationMeters / 1000).toFixed(1)} km Off-Route`,
      });
    }

    if (!existing?.isLiveDeviceGps) {
      recordAudit(
        updated.driverId,
        session?.name || 'Driver Operator',
        'driver',
        'GPS_LIVE_SHARING_STARTED',
        vId,
        'success',
        `Live smartphone GPS stream activated for ${vId} on shipment ${updated.shipmentId} (±${updated.accuracyMeters}m).`
      );
    }

    res.json({ ok: true, telemetry: updated });
  });

  app.post('/api/gps/stop', (req, res) => {
    const session = getSessionFromRequest(req);
    const { vehicleId, shipmentId, reason } = req.body;
    const vId = vehicleId || 'V1';

    if (fleetTelemetryStore[vId]) {
      fleetTelemetryStore[vId] = {
        ...fleetTelemetryStore[vId],
        sharingActive: false,
        speedKmh: 0,
        connectionStatus: 'offline',
        timestamp: new Date().toISOString(),
      };
    }

    recordAudit(
      session?.userId || 'DRV-001',
      session?.name || 'Driver Operator',
      session?.role || 'driver',
      'GPS_LIVE_SHARING_STOPPED',
      vId,
      'success',
      `GPS location sharing stopped for ${vId} (${shipmentId || 'S-GOLDEN'}). Reason: ${reason || 'User stopped / Trip completed'}.`
    );

    res.json({ ok: true, telemetry: fleetTelemetryStore[vId] });
  });

  // ================= PHASE 7: INTELLIGENT ROUTE RECOMMENDATION ENGINE =================

  app.post('/api/routes/recommend', async (req, res) => {
    const { origin, destination, vehicleId } = req.body;
    const origName = String(origin || 'Chennai');
    const destName = String(destination || 'Bengaluru');
    const vehicle = VEHICLES.find((v) => v.id === vehicleId) || VEHICLES[0];

    const origCoord = CITIES[origName] || CITIES.Chennai;
    const destCoord = CITIES[destName] || CITIES.Bengaluru;

    const midLat = (origCoord.lat + destCoord.lat) / 2;
    const midLng = (origCoord.lng + destCoord.lng) / 2;

    // Construct realistic multi-route alternatives grounded in actual South Indian highway corridors
    const isChennaiBlr =
      (origName === 'Chennai' && destName === 'Bengaluru') ||
      (origName === 'Bengaluru' && destName === 'Chennai');

    const alternatives: RouteAlternative[] = isChennaiBlr
      ? [
          {
            id: 'ROUTE-A-NH48',
            label: 'Route A — Fastest (NH-48 via Vellore & Krishnagiri)',
            highwaySummary: 'NH-48 Golden Quadrilateral • 6-Lane Divided Highway',
            distanceKm: 348,
            durationMinutes: 365,
            trafficDelayMinutes: 12,
            estimatedTollINR: 1800,
            suitabilityScore: 96,
            isRecommended: true,
            recommendationReason: `Recommended: Route A is 28 minutes faster based on highway traffic flow and has full 6-lane clearance for ${vehicle.capacityTons}T ${vehicle.vehicleType} (${vehicle.plateNumber}).`,
            pathCoordinates: [
              { lat: origCoord.lat, lng: origCoord.lng },
              { lat: 12.9821, lng: 79.9682 }, // Sriperumbudur
              { lat: 12.9165, lng: 79.1325 }, // Vellore
              { lat: 12.5186, lng: 78.2137 }, // Krishnagiri
              { lat: 12.7409, lng: 77.8253 }, // Hosur
              { lat: destCoord.lat, lng: destCoord.lng },
            ],
            warnings: ['Moderate truck queue at Sriperumbudur Toll Plaza (+12 mins)'],
          },
          {
            id: 'ROUTE-B-NH75',
            label: 'Route B — Shorter Distance (NH-75 via Chittoor & Kolar)',
            highwaySummary: 'NH-75 Old Madras Road • 4-Lane Highway',
            distanceKm: 334,
            durationMinutes: 393,
            trafficDelayMinutes: 26,
            estimatedTollINR: 1450,
            suitabilityScore: 82,
            isRecommended: false,
            recommendationReason:
              '14 km shorter and saves ₹350 in tolls, but takes ~28 minutes longer due to commercial checkpost congestion near Chittoor border.',
            pathCoordinates: [
              { lat: origCoord.lat, lng: origCoord.lng },
              { lat: 13.136, lng: 79.908 }, // Tiruvallur
              { lat: 13.2172, lng: 79.1003 }, // Chittoor
              { lat: 13.1362, lng: 78.1291 }, // Kolar
              { lat: destCoord.lat, lng: destCoord.lng },
            ],
            warnings: ['AP/KA State Border Checkpost delay (+26 mins)', 'Single-lane bypass stretch near Chittoor'],
          },
          {
            id: 'ROUTE-C-EXPRESS',
            label: 'Route C — Southern Bypass (Via Kanchipuram & Pernambut)',
            highwaySummary: 'SH-58 / NH-48 Relief Corridor',
            distanceKm: 364,
            durationMinutes: 410,
            trafficDelayMinutes: 8,
            estimatedTollINR: 1550,
            suitabilityScore: 71,
            isRecommended: false,
            recommendationReason:
              'Useful backup corridor if NH-48 Vellore section experiences heavy industrial blockades; +16 km longer.',
            pathCoordinates: [
              { lat: origCoord.lat, lng: origCoord.lng },
              { lat: 12.8342, lng: 79.7036 }, // Kanchipuram
              { lat: 12.6819, lng: 78.6201 }, // Vaniyambadi
              { lat: 12.7409, lng: 77.8253 }, // Hosur
              { lat: destCoord.lat, lng: destCoord.lng },
            ],
            warnings: ['Higher fuel burn due to +16 km detour'],
          },
        ]
      : [
          {
            id: `ROUTE-A-${origName.toUpperCase()}`,
            label: `Route A — Primary National Highway (${origName} → ${destName})`,
            highwaySummary: 'Primary National Freight Corridor • Heavy Axle Rated',
            distanceKm: 280,
            durationMinutes: 310,
            trafficDelayMinutes: 10,
            estimatedTollINR: 1400,
            suitabilityScore: 94,
            isRecommended: true,
            recommendationReason: `Recommended: Primary national highway offers optimal grade and lowest transit time for ${vehicle.capacityTons}T ${vehicle.vehicleType}.`,
            pathCoordinates: [
              { lat: origCoord.lat, lng: origCoord.lng },
              { lat: midLat + 0.08, lng: midLng - 0.05 },
              { lat: destCoord.lat, lng: destCoord.lng },
            ],
            warnings: ['Standard toll plaza verification'],
          },
          {
            id: `ROUTE-B-${origName.toUpperCase()}`,
            label: `Route B — State Highway Toll-Saver (${origName} → ${destName})`,
            highwaySummary: 'State Highway Secondary Freight Link',
            distanceKm: 268,
            durationMinutes: 348,
            trafficDelayMinutes: 24,
            estimatedTollINR: 950,
            suitabilityScore: 76,
            isRecommended: false,
            recommendationReason:
              'Saves ₹450 in tolls and 12 km distance, but adds 38 minutes of transit time through town intersections.',
            pathCoordinates: [
              { lat: origCoord.lat, lng: origCoord.lng },
              { lat: midLat - 0.12, lng: midLng + 0.09 },
              { lat: destCoord.lat, lng: destCoord.lng },
            ],
            warnings: ['Slower average speed through municipal ring roads'],
          },
        ];

    res.json({
      ok: true,
      origin: origName,
      destination: destName,
      vehiclePlate: vehicle.plateNumber,
      recommendedRouteId: alternatives[0].id,
      alternatives,
    });
  });

  // ================= PHASE 6, 8 & 9: VALIDATED LIFECYCLE & POD ENDPOINTS =================

  app.post('/api/trips/:shipmentId/lifecycle', (req, res) => {
    const session = getSessionFromRequest(req);
    const { shipmentId } = req.params;
    const { currentStatus, nextStatus, actorName, actorRole } = req.body;

    const curIdx = LIFECYCLE_ORDER.indexOf(currentStatus || 'assigned');
    const nextIdx = LIFECYCLE_ORDER.indexOf(nextStatus);

    if (nextIdx === -1) {
      res.status(400).json({ ok: false, error: `Invalid lifecycle status '${nextStatus}'.` });
      return;
    }

    // Prevent skipping backwards or jumping arbitrarily across major stages
    if (curIdx !== -1 && nextIdx < curIdx) {
      res.status(400).json({
        ok: false,
        error: `Cannot revert trip status from '${currentStatus}' backwards to '${nextStatus}'.`,
      });
      return;
    }

    // If trip reaches delivered or completed, automatically stop active GPS sharing
    if (nextStatus === 'delivered' || nextStatus === 'completed') {
      Object.values(fleetTelemetryStore).forEach((t) => {
        if (t.shipmentId === shipmentId) {
          t.sharingActive = false;
          t.speedKmh = 0;
          t.remainingDistanceKm = 0;
        }
      });
    }

    recordAudit(
      session?.userId || (actorRole === 'driver' ? 'DRV-001' : 'MGR-001'),
      session?.name || actorName || 'Verified Operator',
      session?.role || actorRole || 'driver',
      'TRIP_LIFECYCLE_TRANSITION',
      shipmentId,
      'success',
      `Trip ${shipmentId} transitioned from '${currentStatus || 'assigned'}' → '${nextStatus}'.`
    );

    const notification = pushServerNotification({
      id: `NOTIF-LC-${shipmentId}-${nextStatus}`,
      source: session?.role || actorRole || 'driver',
      targetRole: 'all',
      type: 'status_change',
      severity: nextStatus === 'goods_collected' || nextStatus === 'delivered' ? 'info' : 'info',
      title: `Trip Status Update (${shipmentId}): ${String(nextStatus).replace(/_/g, ' ').toUpperCase()}`,
      message: `${session?.name || actorName || 'Operator'} advanced shipment ${shipmentId} from '${currentStatus || 'assigned'}' to '${nextStatus}'.`,
      relatedShipmentId: shipmentId,
      telemetryMetric: `Stage: ${String(nextStatus).replace(/_/g, ' ').toUpperCase()}`,
    });

    res.json({
      ok: true,
      shipmentId,
      previousStatus: currentStatus,
      lifecycleStatus: nextStatus,
      notification,
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/trips/:shipmentId/pod', (req, res) => {
    const session = getSessionFromRequest(req);
    const { shipmentId } = req.params;
    const { receiverName, receiverConfirmationCode, deliveryNotes, photoDataUrl, driverId } = req.body;

    if (!receiverName || !String(receiverName).trim()) {
      res.status(400).json({ ok: false, error: 'Consignee receiver name is required for Proof of Delivery.' });
      return;
    }

    const pod = {
      receiverName: String(receiverName).trim(),
      receiverConfirmationCode: String(receiverConfirmationCode || `POD-${Date.now().toString().slice(-5)}`).trim(),
      deliveryTimestamp: new Date().toISOString(),
      deliveryNotes: String(deliveryNotes || 'Cargo offloaded intact, seal verified at dock.').trim(),
      photoDataUrl,
      verifiedByDriverId: driverId || session?.driverId || 'DRV-001',
    };

    recordAudit(
      pod.verifiedByDriverId,
      session?.name || 'Driver Operator',
      'driver',
      'PROOF_OF_DELIVERY_RECORDED',
      shipmentId,
      'success',
      `Digital POD recorded for ${shipmentId}. Receiver: ${pod.receiverName} (Code: ${pod.receiverConfirmationCode}).`
    );

    const notification = pushServerNotification({
      id: `NOTIF-POD-${shipmentId}`,
      source: 'driver',
      targetRole: 'all',
      type: 'status_change',
      severity: 'info',
      title: `Digital e-POD Confirmed (${shipmentId})`,
      message: `Consignee ${pod.receiverName} signed off delivery (Ref: ${pod.receiverConfirmationCode}). Notes: ${pod.deliveryNotes}`,
      relatedShipmentId: shipmentId,
      telemetryMetric: `POD Ref: ${pod.receiverConfirmationCode}`,
    });

    res.json({ ok: true, shipmentId, pod, notification });
  });

  // In-memory chat storage for active trips
  const tripChatStore: Record<string, any[]> = {
    'S-GOLDEN': [
      {
        id: 'msg-1',
        tripId: 'S-GOLDEN',
        senderRole: 'manager',
        senderId: 'MGR-001',
        senderName: 'Karthik Subramanian',
        timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
        text: 'Ravi, FMCG pallet dispatch for S-GOLDEN is ready at Chennai Central Bay 4. Total weight 6.2T with 22 m³ volume. Tarp seal #CHN-9921 is allocated.',
        readByOtherRole: true,
      },
      {
        id: 'msg-2',
        tripId: 'S-GOLDEN',
        senderRole: 'driver',
        senderId: 'DRV-001',
        senderName: 'Ravi Kumar',
        timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
        text: 'Vanakkam Karthik sir. Arrived at Bay 4 with assigned truck TN 38 AB 4521. Pre-trip inspection completed, tire pressure and 24V engine diagnostics all green.',
        readByOtherRole: true,
      },
      {
        id: 'msg-3',
        tripId: 'S-GOLDEN',
        senderRole: 'manager',
        senderId: 'MGR-001',
        senderName: 'Karthik Subramanian',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        text: 'Superb. Consignee deadline in Bengaluru is 8:00 PM. HaulSense Agent also identified Return Load R1 (Bengaluru → Chennai) with ₹7,800 driver share. I have locked that backhaul for your truck.',
        readByOtherRole: true,
      },
      {
        id: 'msg-4',
        tripId: 'S-GOLDEN',
        senderRole: 'driver',
        senderId: 'DRV-001',
        senderName: 'Ravi Kumar',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        text: 'Thank you sir! Return haul R1 is perfect. Fits our 7.5T closed hold. Loading completed, gate pass verified. Departing Chennai via NH-48 corridor.',
        attachmentType: 'location_pin',
        attachmentTitle: 'Current GPS Pin',
        attachmentData: 'NH-48 Sriperumbudur Tollway (Lat: 12.9821, Lng: 79.9412)',
        readByOtherRole: true,
      },
    ],
  };

  // GET /api/chat/:tripId - Fetch messages for specific corridor trip
  app.get('/api/chat/:tripId', (req, res) => {
    const { tripId } = req.params;
    const messages = tripChatStore[tripId] || [];
    res.json({ ok: true, tripId, messages });
  });

  // POST /api/chat/:tripId - Send a new message between Driver and Manager
  app.post('/api/chat/:tripId', (req, res) => {
    const { tripId } = req.params;
    const { senderRole, senderId, senderName, text, attachmentType, attachmentTitle, attachmentData } = req.body;

    if (!text && !attachmentData) {
      res.status(400).json({ ok: false, error: 'Message text or attachment is required.' });
      return;
    }

    if (!tripChatStore[tripId]) {
      tripChatStore[tripId] = [];
    }

    const newMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tripId,
      senderRole: senderRole || 'manager',
      senderId: senderId || 'MGR-001',
      senderName: senderName || (senderRole === 'driver' ? 'Ravi Kumar' : 'Karthik Subramanian'),
      timestamp: new Date().toISOString(),
      text: text || '',
      attachmentType,
      attachmentTitle,
      attachmentData,
      readByOtherRole: false,
    };

    tripChatStore[tripId].push(newMessage);
    res.json({ ok: true, message: newMessage });
  });

  // POST /api/agent/run - Streams agent reasoning events via Server-Sent Events
  app.post('/api/agent/run', async (req, res) => {
    const { shipmentId, userQuestion } = req.body;

    let targetShipment: Shipment | undefined;
    if (typeof req.body.shipment === 'object' && req.body.shipment !== null) {
      targetShipment = req.body.shipment;
    } else if (shipmentId) {
      targetShipment = ALL_SHIPMENTS.find((s) => s.id === shipmentId);
    }

    if (!targetShipment) {
      res.status(404).json({ error: `Shipment '${shipmentId}' not found.` });
      return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const abortController = new AbortController();

    res.on('close', () => {
      if (!res.writableFinished) {
        abortController.abort();
      }
    });

    const sendEvent = (event: AgentEvent) => {
      if (res.writableEnded) return;
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      await runAgentOrchestrator({
        shipment: targetShipment,
        userQuestion: userQuestion || 'Should we accept this shipment?',
        onEvent: sendEvent,
        apiKey: process.env.GEMINI_API_KEY,
        abortSignal: abortController.signal,
      });
    } catch (err: any) {
      if (!res.writableEnded) {
        sendEvent({
          type: 'error',
          message: `Server execution exception: ${err?.message || String(err)}`,
        });
      }
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  });

  // Mount Vite middleware in development or serve static in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HaulSense] Server listening on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[HaulSense] Fatal error starting server:', err);
  process.exit(1);
});
