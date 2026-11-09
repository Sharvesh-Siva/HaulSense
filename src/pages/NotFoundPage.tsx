/**
 * HaulSense - Not Found Page
 * Modern Dark Operations Theme.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070A0F] text-[#F3F4F6] flex items-center justify-center p-6">
      <div className="bg-[#121824] rounded-2xl border border-slate-800 p-8 max-w-sm w-full shadow-2xl text-center">
        <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <Truck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white font-heading mb-1">
          404 - Corridor Not Found
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          The requested dispatch corridor or resource does not exist in the active fleet registry.
        </p>
        <button
          type="button"
          onClick={() => navigate('/manager')}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-200" />
          <span>Return to Operations Control</span>
        </button>
      </div>
    </div>
  );
};
