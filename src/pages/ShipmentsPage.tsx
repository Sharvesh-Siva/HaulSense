/**
 * HaulSense - Shipments Management Roster
 * Modern Dark Operations Theme.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { ALL_SHIPMENTS } from '../data/mockData';
import { formatDateTime, formatINR } from '../utils';

export const ShipmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered'>('all');
  const [search, setSearch] = useState('');

  const filtered = ALL_SHIPMENTS.filter((s) => {
    if (filter === 'pending' && s.status !== 'pending_decision') return false;
    if (filter === 'delivered' && s.status !== 'delivered') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.cargoType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white font-heading">
            Corridor Shipment Manifests
          </h1>
          <p className="text-xs text-slate-400">
            Carrier contract loads, active corridors, and completed trip settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-800 bg-[#121824] p-1 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({ALL_SHIPMENTS.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'pending' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending Decision
            </button>
            <button
              type="button"
              onClick={() => setFilter('delivered')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'delivered' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Delivered
            </button>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, route, or cargo..."
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-800 bg-[#121824] text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
        />
      </div>

      <div className="bg-[#121824] rounded-2xl border border-slate-800/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0E1420] border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Shipment ID / Corridor</th>
                <th className="py-3 px-4">Cargo & Weight</th>
                <th className="py-3 px-4">Offered Freight</th>
                <th className="py-3 px-4">Departure Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Autonomous Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white font-heading">{s.origin} → {s.destination}</div>
                    <span className="text-[11px] text-slate-500 font-mono">{s.id} • {s.distanceKm} km</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-300 capitalize">{s.weightTons}t {s.cargoType}</span>
                    {s.isHighValue && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-700/60 font-bold uppercase">
                        High Value
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                    {formatINR(s.offeredFreight)}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {formatDateTime(s.departureTime)}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold uppercase ${
                        s.status === 'pending_decision'
                          ? 'bg-amber-950/70 text-amber-400 border border-amber-800/70'
                          : 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/70'
                      }`}
                    >
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/manager/agent/${s.id}`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      <span>Analyze</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-200" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
