/**
 * HaulSense - Main Application Router & Shell
 * Fixed:
 * - Eliminated render-phase setState calls in ManagerRoute and DriverRoute
 * - Added /manager/tracking (LiveFleetTrackingPage) and /driver/trip-map (DriverTripMapPage)
 * - Clean RBAC session handling across refreshes and back/forward navigation
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogisticsProvider } from './context/LogisticsContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './pages/LandingPage';
import { ManagerLayout } from './components/ManagerLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LiveFleetTrackingPage } from './pages/LiveFleetTrackingPage';
import { ShipmentsPage } from './pages/ShipmentsPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { DriversPage } from './pages/DriversPage';
import { ReturnLoadsPage } from './pages/ReturnLoadsPage';
import { AgentPage } from './pages/AgentPage';
import { DriverLayout } from './pages/driver/DriverLayout';
import { DriverOverviewPage } from './pages/driver/DriverOverviewPage';
import { DriverTripMapPage } from './pages/driver/DriverTripMapPage';
import { DriverTripsPage } from './pages/driver/DriverTripsPage';
import { DriverVehiclesPage } from './pages/driver/DriverVehiclesPage';
import { DriverMatchingPage } from './pages/driver/DriverMatchingPage';
import { DriverLoadsPage } from './pages/driver/DriverLoadsPage';
import { DriverEarningsPage } from './pages/driver/DriverEarningsPage';
import { DriverTrustPage } from './pages/driver/DriverTrustPage';
import { DriverHealthPage } from './pages/driver/DriverHealthPage';
import { DriverDocumentsPage } from './pages/driver/DriverDocumentsPage';
import { TripChatPage } from './pages/TripChatPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Protected Route wrapper for Manager portal (no setState during render!)
const ManagerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDevSimulatorMode, loginAsDefaultManager, switchWorkspace } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      loginAsDefaultManager();
    } else if (user.role !== 'manager' && (user.baseRole === 'manager' || isDevSimulatorMode || user.isDevSimulator)) {
      switchWorkspace('manager', { forceDevSimulator: true });
    }
  }, [user, isDevSimulatorMode, loginAsDefaultManager, switchWorkspace]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-xs text-slate-400 font-mono">
        Restoring Manager Operations Session...
      </div>
    );
  }

  // If strictly logged in as a Production Driver (not Dev Simulator), block access to /manager
  if (user.role !== 'manager' && user.baseRole === 'driver' && !isDevSimulatorMode && !user.isDevSimulator) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="bg-[#121824] border border-red-800/80 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
          <h2 className="text-base font-bold text-white font-heading">
            Access Restricted — Manager Authorization Required
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your active session is authenticated as Driver <strong>{user.name}</strong> ({user.driverId}). Driver accounts cannot access Manager routes without Manager credentials.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/driver', { replace: true })}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
            >
              Return to Driver Portal
            </button>
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Protected Route wrapper for Driver portal (no setState during render!)
const DriverRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loginAsDefaultDriver, switchWorkspace } = useAuth();

  useEffect(() => {
    if (!user) {
      loginAsDefaultDriver('DRV-001');
    } else if (user.role !== 'driver') {
      switchWorkspace('driver', { forceDevSimulator: true });
    }
  }, [user, loginAsDefaultDriver, switchWorkspace]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-xs text-slate-400 font-mono">
        Restoring Driver Portal Session...
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  return (
    <ErrorBoundary>
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900 flex items-center justify-between shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">Demo key quota exceeded.</span>
            <span>To continue using Google Maps features, please switch to your own API key.</span>
          </div>
          <a
            href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold bg-amber-900 text-white px-3 py-1.5 rounded hover:bg-amber-800 transition-colors shrink-0 ml-4"
          >
            Learn How to Upgrade
          </a>
        </div>
      )}
      <AuthProvider>
        <LogisticsProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Landing */}
              <Route path="/" element={<LandingPage />} />

              {/* Manager Operations Portal */}
              <Route
                path="/manager"
                element={
                  <ManagerRoute>
                    <ManagerLayout />
                  </ManagerRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="tracking" element={<LiveFleetTrackingPage />} />
                <Route path="shipments" element={<ShipmentsPage />} />
                <Route path="vehicles" element={<VehiclesPage />} />
                <Route path="drivers" element={<DriversPage />} />
                <Route path="returns" element={<ReturnLoadsPage />} />
                <Route path="agent/:shipmentId" element={<AgentPage />} />
                <Route path="agent" element={<Navigate to="/manager/agent/S-GOLDEN" replace />} />
                <Route path="chat" element={<TripChatPage />} />
                <Route path="chat/:tripId" element={<TripChatPage />} />
              </Route>

              {/* Driver Workspace (Full Suite) */}
              <Route
                path="/driver"
                element={
                  <DriverRoute>
                    <DriverLayout />
                  </DriverRoute>
                }
              >
                <Route index element={<DriverOverviewPage />} />
                <Route path="trip-map" element={<DriverTripMapPage />} />
                <Route path="trip-map/:shipmentId" element={<DriverTripMapPage />} />
                <Route path="trips" element={<DriverTripsPage />} />
                <Route path="vehicles" element={<DriverVehiclesPage />} />
                <Route path="matching" element={<DriverMatchingPage />} />
                <Route path="loads" element={<DriverLoadsPage />} />
                <Route path="earnings" element={<DriverEarningsPage />} />
                <Route path="trust" element={<DriverTrustPage />} />
                <Route path="health" element={<DriverHealthPage />} />
                <Route path="documents" element={<DriverDocumentsPage />} />
                <Route path="chat" element={<TripChatPage />} />
                <Route path="chat/:tripId" element={<TripChatPage />} />
              </Route>

              {/* Diagnostics Suite */}
              <Route path="/diagnostics" element={<DiagnosticsPage />} />

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </LogisticsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
