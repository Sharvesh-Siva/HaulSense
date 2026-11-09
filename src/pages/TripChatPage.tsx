/**
 * HaulSense - Full-Page Trip Dispatch Communications Console (/manager/chat & /driver/chat)
 * Embedded two-sided messaging console between Driver and Manager on the corridor trip.
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Truck,
  User,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLogistics } from '../context/LogisticsContext';
import { TripChatDrawer } from '../components/TripChatDrawer';

export const TripChatPage: React.FC = () => {
  const { user } = useAuth();
  const { tripId = 'S-GOLDEN' } = useParams<{ tripId?: string }>();
  const navigate = useNavigate();
  const { shipments, vehicles, drivers } = useLogistics();

  const [selectedTripId, setSelectedTripId] = useState(tripId);
  const activeShipment = shipments.find((s) => s.id === selectedTripId) || shipments[0];
  const assignedDriver =
    drivers.find((d) => d.id === activeShipment.assignedDriverId) || drivers[0];
  const assignedVehicle =
    vehicles.find((v) => v.id === activeShipment.assignedVehicleId) || vehicles[0];

  const isDriver = user?.role === 'driver';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(isDriver ? '/driver' : '/manager')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-white font-heading">
              Trip Dispatch Communications Link
            </h1>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase ${
                isDriver
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-indigo-950 text-indigo-400 border-indigo-800'
              }`}
            >
              {isDriver ? 'Driver Console' : 'Manager Console'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 ml-7">
            Direct operational corridor communications between Fleet Dispatch and Assigned Driver.
          </p>
        </div>

        {/* Trip Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Corridor Trip:</span>
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="bg-[#0E1522] border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
          >
            {shipments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}: {s.origin} → {s.destination} ({s.cargoType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main 2-Column Layout: Left Manifest Info, Right Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Manifest & Telemetry (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0E1522] border border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Trip Manifest
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 uppercase">
                {(activeShipment.lifecycleStatus || 'in_transit').replace('_', ' ')}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-white text-sm font-heading">{activeShipment.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeShipment.origin}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span>{activeShipment.destination}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
              <div className="flex justify-between text-slate-400">
                <span>Distance:</span>
                <span className="font-mono text-slate-200">{activeShipment.distanceKm} km</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cargo:</span>
                <span className="font-medium text-slate-200 capitalize">
                  {activeShipment.cargoType} ({activeShipment.weightTons}T)
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Assigned Truck:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {assignedVehicle.plateNumber}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Assigned Driver:</span>
                <span className="font-bold text-white">{assignedDriver.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Driver Trust:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {assignedDriver.reliabilityScore}/100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Inline Chat Drawer (8 cols) */}
        <div className="lg:col-span-8">
          <TripChatDrawer tripId={selectedTripId} isOpen={true} onClose={() => {}} inline={true} />
        </div>
      </div>
    </div>
  );
};
