/**
 * HaulSense - Driver & Vehicle Compliance Documents Registry (/driver/documents)
 * Implements Section 21 of Master Implementation Prompt:
 * - Driver Documents (HMV Commercial Licence, Aadhaar KYC, Hazardous Goods cert)
 * - Vehicle Compliance (RC, National Permit, Comprehensive Insurance, Fitness, PUC)
 * - Proactive expiry warnings and document viewer.
 */

import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Upload,
  Download,
  Eye,
  Truck,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLogistics } from '../../context/LogisticsContext';

export const DriverDocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const { drivers, vehicles } = useLogistics();

  const currentDriver = drivers.find((d) => d.id === user?.driverId) || drivers[0];
  const assignedVehicle =
    vehicles.find((v) => v.id === currentDriver.assignedVehicleId) || vehicles[0];

  const [uploadToast, setUploadToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'driver' | 'vehicle'>('all');

  const vehicleDocs = [
    {
      id: 'V-DOC-01',
      title: 'Vehicle Registration Certificate (RC)',
      docNumber: assignedVehicle.plateNumber,
      category: 'RC Book',
      validUntil: '2034-04-15',
      status: 'valid' as const,
    },
    {
      id: 'V-DOC-02',
      title: 'All India Motor Transport National Permit',
      docNumber: 'NP-TN-2023-88912',
      category: 'National Permit',
      validUntil: assignedVehicle.health.permitValidUntil,
      status: 'valid' as const,
    },
    {
      id: 'V-DOC-03',
      title: 'Commercial Comprehensive Insurance Policy',
      docNumber: 'BAJAJ-ALL-COMM-99182',
      category: 'Insurance',
      validUntil: assignedVehicle.health.insuranceValidUntil,
      status: 'valid' as const,
    },
    {
      id: 'V-DOC-04',
      title: 'Pollution Under Control Certificate (PUC)',
      docNumber: 'PUC-TN-9921',
      category: 'Emission',
      validUntil: assignedVehicle.health.pucValidUntil,
      status: 'expiring_soon' as const,
      warningDaysRemaining: 45,
    },
  ];

  const handleUpload = () => {
    setUploadToast(true);
    setTimeout(() => setUploadToast(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-white font-heading">
              Compliance Documents & Permits
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              RTO & Carrier Verified
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Active credentials for {currentDriver.name} and assigned vehicle {assignedVehicle.plateNumber}.
          </p>
        </div>

        <button
          type="button"
          onClick={handleUpload}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Renewal Document</span>
        </button>
      </div>

      {uploadToast && (
        <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Document submitted for automated OCR verification & fleet compliance sync!</span>
        </div>
      )}

      {/* Driver Personal Documents Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-400" />
          <h2 className="text-base font-bold text-white font-heading">
            Driver Identification & Commercial Licences
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentDriver.documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl bg-[#0E1522] border border-slate-800 space-y-3 shadow-sm hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">{doc.title}</h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    Doc #: {doc.docNumber}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    doc.status === 'valid'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}
                >
                  {doc.status === 'expiring_soon'
                    ? `Expiring in ${doc.warningDaysRemaining || 21}d`
                    : 'VALID'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="font-mono">Valid Until: {doc.validUntil}</span>
                <button
                  type="button"
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assigned Vehicle Compliance Documents Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-cyan-400" />
          <h2 className="text-base font-bold text-white font-heading">
            Assigned Vehicle ({assignedVehicle.plateNumber}) Legal Compliance
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicleDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl bg-[#0E1522] border border-slate-800 space-y-3 shadow-sm hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">{doc.title}</h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    Reg #: {doc.docNumber}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    doc.status === 'valid'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}
                >
                  {doc.status === 'expiring_soon' ? 'EXPIRING SOON' : 'VALID'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="font-mono">Valid Until: {doc.validUntil}</span>
                <button
                  type="button"
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
