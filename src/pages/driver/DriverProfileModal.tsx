/**
 * HaulSense - Driver Profile & Operational Preferences Modal
 */

import React, { useState } from 'react';
import {
  User,
  X,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Clock,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Driver } from '../../types';
import { useLogistics } from '../../context/LogisticsContext';

interface DriverProfileModalProps {
  driver: Driver;
  onClose: () => void;
}

export const DriverProfileModal: React.FC<DriverProfileModalProps> = ({ driver, onClose }) => {
  const { updateDriverAvailability } = useLogistics();
  const [preferredCorridors, setPreferredCorridors] = useState(
    driver.availability.preferredCorridors.join(', ')
  );
  const [maxDaysAway, setMaxDaysAway] = useState(driver.availability.maxDaysAway);
  const [notes, setNotes] = useState(driver.availability.notes || '');
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0D131F] border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#121A29] px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-sm">
                Driver Profile & Preferences
              </h3>
              <p className="text-[11px] text-slate-400">
                {driver.name} ({driver.id})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          {/* Top Driver Badge */}
          <div className="p-3.5 rounded-xl bg-[#141C2B] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold flex items-center justify-center text-lg shadow-md font-mono">
                {driver.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{driver.name}</h4>
                <p className="text-slate-400 text-[11px]">{driver.phone} • {driver.experienceYears} Years Exp</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                    Trust: {driver.reliabilityScore}/100
                  </span>
                  <span className="font-mono text-[10px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800">
                    Rating: {driver.rating} ★
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-[10px]">Total Trips</div>
              <div className="font-bold text-white text-base font-mono">{driver.totalTripsCompleted}</div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="space-y-3 pt-2">
            <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] font-mono">
              Operating Preferences
            </h5>

            <div>
              <label className="block text-slate-400 mb-1">Preferred Corridors (comma separated)</label>
              <input
                type="text"
                value={preferredCorridors}
                onChange={(e) => setPreferredCorridors(e.target.value)}
                className="w-full bg-[#080C13] border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Max Days Away From Home</label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={maxDaysAway}
                  onChange={(e) => setMaxDaysAway(Number(e.target.value))}
                  className="w-full bg-[#080C13] border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Emergency Phone</label>
                <input
                  type="text"
                  defaultValue="+91 94441 99881"
                  className="w-full bg-[#080C13] border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Dispatcher Operational Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special notes or route restrictions..."
                className="w-full bg-[#080C13] border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {savedToast && (
            <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-center font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Preferences saved to dispatch system!
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
