/**
 * HaulSense - Enterprise Authentication, Session Token & Role-Based Access Control Context
 * Supports:
 * - Separate Manager and Driver authentication with backend session token issuance (/api/auth/login)
 * - Controlled Workspace Switching (/api/auth/switch-workspace)
 * - Strict RBAC: Drivers in production mode cannot self-elevate to Manager Portal without Manager credentials or explicit Dev Role Simulator mode.
 * - Clean session persistence across page refreshes and browser back/forward navigation without render-phase setState errors.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DRIVERS } from '../data/mockData';

export type UserRole = 'manager' | 'driver';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  baseRole: UserRole;
  email?: string;
  driverId?: string;
  token?: string;
  organizationId?: string;
  isDevSimulator?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isDevSimulatorMode: boolean;
  setDevSimulatorMode: (enabled: boolean) => void;
  loginManager: (email: string, pass: string, isDevSimulator?: boolean) => { success: boolean; error?: string };
  loginDriver: (driverId: string, pin: string, isDevSimulator?: boolean) => { success: boolean; error?: string };
  loginAsDefaultManager: () => void;
  loginAsDefaultDriver: (driverId?: string) => void;
  switchWorkspace: (
    targetRole: UserRole,
    options?: { driverId?: string; forceDevSimulator?: boolean }
  ) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'haulsense_user_v3';
const DEV_SIM_STORAGE_KEY = 'haulsense_dev_sim_v3';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDevSimulatorMode, setIsDevSimulatorModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(DEV_SIM_STORAGE_KEY);
      return saved ? JSON.parse(saved) : true; // Enabled in preview by default, toggleable in UI
    } catch {
      return true;
    }
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem('haulsense_user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        baseRole: parsed.baseRole || parsed.role || 'manager',
      };
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem('haulsense_user', JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem('haulsense_user');
      }
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [user]);

  const setDevSimulatorMode = useCallback((enabled: boolean) => {
    setIsDevSimulatorModeState(enabled);
    try {
      localStorage.setItem(DEV_SIM_STORAGE_KEY, JSON.stringify(enabled));
    } catch {
      // ignore
    }
    setUser((prev) => (prev ? { ...prev, isDevSimulator: enabled } : null));
  }, []);

  const syncBackendLogin = (payload: Record<string, unknown>) => {
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && data?.session?.token) {
          setUser((prev) => (prev ? { ...prev, token: data.session.token } : prev));
        }
      })
      .catch(() => {
        // Offline / local fallback
      });
  };

  const loginManager = useCallback(
    (email: string, pass: string, isDevSim = false) => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = pass.trim();

      if ((cleanEmail === 'manager@haulsense.in' && cleanPass === 'haul123') || isDevSim) {
        const newUser: AuthUser = {
          id: 'MGR-001',
          name: 'Karthik Subramanian',
          role: 'manager',
          baseRole: 'manager',
          email: 'manager@haulsense.in',
          organizationId: 'ORG-SRI-MURUGAN',
          isDevSimulator: isDevSim,
        };
        setUser(newUser);
        setIsDevSimulatorModeState(isDevSim);
        syncBackendLogin({
          mode: 'manager',
          email: cleanEmail,
          password: cleanPass,
          isDevSimulator: isDevSim,
        });
        return { success: true };
      }

      return {
        success: false,
        error: 'Invalid enterprise credentials. Use manager@haulsense.in / haul123',
      };
    },
    []
  );

  const loginDriver = useCallback(
    (driverId: string, pin: string, isDevSim = false) => {
      const cleanId = driverId.trim().toUpperCase();
      const cleanPin = pin.trim();

      const matchedDriver = DRIVERS.find((d) => d.id === cleanId);
      if (!matchedDriver) {
        return {
          success: false,
          error: `Driver ID '${driverId}' not found in fleet roster. Try DRV-001`,
        };
      }

      if (cleanPin !== '1234' && !isDevSim) {
        return {
          success: false,
          error: 'Invalid PIN. Fleet default is 1234',
        };
      }

      const newUser: AuthUser = {
        id: matchedDriver.id,
        name: matchedDriver.name,
        role: 'driver',
        baseRole: 'driver',
        driverId: matchedDriver.id,
        organizationId: 'ORG-SRI-MURUGAN',
        isDevSimulator: isDevSim,
      };
      setUser(newUser);
      setIsDevSimulatorModeState(isDevSim);
      syncBackendLogin({
        mode: 'driver',
        driverId: matchedDriver.id,
        pin: cleanPin,
        isDevSimulator: isDevSim,
      });
      return { success: true };
    },
    []
  );

  const loginAsDefaultManager = useCallback(() => {
    const defaultUser: AuthUser = {
      id: 'MGR-001',
      name: 'Karthik Subramanian',
      role: 'manager',
      baseRole: 'manager',
      email: 'manager@haulsense.in',
      organizationId: 'ORG-SRI-MURUGAN',
      isDevSimulator: true,
    };
    setUser(defaultUser);
    syncBackendLogin({ mode: 'manager', isDevSimulator: true });
  }, []);

  const loginAsDefaultDriver = useCallback((driverId = 'DRV-001') => {
    const matchedDriver = DRIVERS.find((d) => d.id === driverId) || DRIVERS[0];
    const defaultDriver: AuthUser = {
      id: matchedDriver.id,
      name: matchedDriver.name,
      role: 'driver',
      baseRole: 'driver',
      driverId: matchedDriver.id,
      organizationId: 'ORG-SRI-MURUGAN',
      isDevSimulator: true,
    };
    setUser(defaultDriver);
    syncBackendLogin({ mode: 'driver', driverId: matchedDriver.id, isDevSimulator: true });
  }, []);

  const switchWorkspace = useCallback(
    (
      targetRole: UserRole,
      options?: { driverId?: string; forceDevSimulator?: boolean }
    ): { success: boolean; error?: string } => {
      const allowDev = Boolean(
        options?.forceDevSimulator || isDevSimulatorMode || user?.isDevSimulator
      );

      // Strict RBAC check: If logged in strictly as a production driver (not manager, not dev simulator),
      // block elevation to Manager workspace.
      if (
        targetRole === 'manager' &&
        user &&
        user.baseRole === 'driver' &&
        !allowDev
      ) {
        // Notify backend audit log of blocked role elevation
        fetch('/api/auth/switch-workspace', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(user.token ? { Authorization: `Bearer ${user.token}` } : {}),
          },
          body: JSON.stringify({ targetRole: 'manager', allowDevSimulator: false }),
        }).catch(() => {});

        return {
          success: false,
          error:
            'Unauthorized: Driver accounts cannot switch to the Manager Portal in Production Auth mode. Authenticate with Manager credentials or enable Dev Role Simulator.',
        };
      }

      if (targetRole === 'driver') {
        const targetDrvId = options?.driverId || user?.driverId || 'DRV-001';
        const matched = DRIVERS.find((d) => d.id === targetDrvId) || DRIVERS[0];
        const nextUser: AuthUser = {
          id: matched.id,
          name: matched.name,
          role: 'driver',
          baseRole: user?.baseRole || 'manager',
          driverId: matched.id,
          organizationId: 'ORG-SRI-MURUGAN',
          token: user?.token,
          isDevSimulator: allowDev,
        };
        setUser(nextUser);

        fetch('/api/auth/switch-workspace', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
          },
          body: JSON.stringify({
            targetRole: 'driver',
            targetDriverId: matched.id,
            allowDevSimulator: allowDev,
          }),
        }).catch(() => {});

        return { success: true };
      }

      // Switching to Manager Workspace
      const nextManager: AuthUser = {
        id: 'MGR-001',
        name: 'Karthik Subramanian',
        role: 'manager',
        baseRole: 'manager',
        email: 'manager@haulsense.in',
        organizationId: 'ORG-SRI-MURUGAN',
        token: user?.token,
        isDevSimulator: allowDev,
      };
      setUser(nextManager);

      fetch('/api/auth/switch-workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({
          targetRole: 'manager',
          allowDevSimulator: allowDev,
        }),
      }).catch(() => {});

      return { success: true };
    },
    [isDevSimulatorMode, user]
  );

  const logout = useCallback(() => {
    if (user?.token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      }).catch(() => {});
    }
    setUser(null);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isDevSimulatorMode,
        setDevSimulatorMode,
        loginManager,
        loginDriver,
        loginAsDefaultManager,
        loginAsDefaultDriver,
        switchWorkspace,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
