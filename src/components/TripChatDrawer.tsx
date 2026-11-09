/**
 * HaulSense - Trip Chat Interface (Manager ↔ Driver Direct Corridor Link)
 * Direct communication between the Driver (e.g. Ravi Kumar) and Manager (Karthik Subramanian)
 * specifically involved in the active trip (S-GOLDEN: Chennai → Bengaluru).
 * Supports operational presets, live GPS pin sharing, and POD/seal attachments.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  MapPin,
  FileText,
  ShieldCheck,
  CheckCheck,
  Truck,
  User,
  Paperclip,
  Sparkles,
  Phone,
  Clock,
  ArrowRight,
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLogistics } from '../context/LogisticsContext';
import { formatINR } from '../utils';
import { ChatAttachmentType, TripChatMessage } from '../types';

interface TripChatDrawerProps {
  tripId?: string;
  isOpen: boolean;
  onClose: () => void;
  inline?: boolean;
}

export const TripChatDrawer: React.FC<TripChatDrawerProps> = ({
  tripId = 'S-GOLDEN',
  isOpen,
  onClose,
  inline = false,
}) => {
  const { user } = useAuth();
  const { shipments, vehicles, drivers, chatMessages, sendChatMessage, markTripChatAsRead } =
    useLogistics();

  const currentRole: 'manager' | 'driver' = user?.role === 'driver' ? 'driver' : 'manager';
  const activeShipment = shipments.find((s) => s.id === tripId) || shipments[0];
  const assignedDriver =
    drivers.find((d) => d.id === activeShipment.assignedDriverId) || drivers[0];
  const assignedVehicle =
    vehicles.find((v) => v.id === activeShipment.assignedVehicleId) || vehicles[0];

  const messages = chatMessages[tripId] || [];
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      markTripChatAsRead(tripId, currentRole);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen, tripId]);

  if (!isOpen && !inline) return null;

  const handleSend = async (customText?: string, attachment?: { type: ChatAttachmentType; title: string; data: string }) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend && !attachment) return;

    setIsSending(true);
    const senderName =
      currentRole === 'driver'
        ? `${assignedDriver.name} (Driver)`
        : 'Karthik Subramanian (Dispatch Lead)';

    const senderId = currentRole === 'driver' ? assignedDriver.id : 'MGR-001';

    await sendChatMessage(tripId, {
      tripId,
      senderRole: currentRole,
      senderId,
      senderName,
      text: textToSend,
      attachmentType: attachment?.type,
      attachmentTitle: attachment?.title,
      attachmentData: attachment?.data,
    });

    setInputText('');
    setShowAttachMenu(false);
    setIsSending(false);
  };

  const driverQuickReplies = [
    'Reached Sriperumbudur Toll, traffic clear. ETA on schedule.',
    'Loading completed at Bay 4. Cargo container seal #CHN-9921 locked.',
    'Requested confirmation for Return Load R1 (Bengaluru → Chennai).',
    'Arrived at Bengaluru Outer Ring Road consignee dock.',
  ];

  const managerQuickReplies = [
    'Gate entry pass and dock allocation verified for Bengaluru arrival.',
    'Return Load R1 confirmed! ₹7,800 added to your trip payout.',
    'HPCL fuel card top-up authorized at Kanchipuram bypass.',
    'Consignee has signed off digital POD. Excellent turnaround.',
  ];

  const quickReplies = currentRole === 'driver' ? driverQuickReplies : managerQuickReplies;

  const handleAttachLocation = () => {
    handleSend('Sharing current corridor location pin via GPS telemetry.', {
      type: 'location_pin',
      title: 'GPS Corridor Telemetry',
      data: `NH-48 Corridor (Near Vellore Bypass) • Speed: 52 km/h • Vehicle: ${assignedVehicle.plateNumber}`,
    });
  };

  const handleAttachPOD = () => {
    handleSend('Uploaded verified Digital Proof-of-Delivery (e-POD) with consignee stamp.', {
      type: 'pod_photo',
      title: 'Digital POD #POD-9921',
      data: `Consignee: ITC Distribution Hub • Verified at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    });
  };

  const handleAttachSeal = () => {
    handleSend('Tarp & container tamper-evident security seal verified.', {
      type: 'seal_verification',
      title: 'Container Seal Verification',
      data: 'Seal #CHN-9921 • Tamper status: INTACT • 6.2T FMCG Closed Cargo',
    });
  };

  const containerClasses = inline
    ? 'bg-[#0E1522] border border-slate-800 rounded-2xl h-[600px] flex flex-col shadow-xl overflow-hidden'
    : 'fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-[#0E1420] border-l border-slate-700/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250';

  return (
    <div className={containerClasses}>
      {/* Chat Top Banner with Trip & Participant Details */}
      <div className="bg-[#121A28] border-b border-slate-800 p-4 shrink-0 shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-white text-sm">
                  Trip Dispatch Comms
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold uppercase">
                  {tripId}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeShipment.origin} → {activeShipment.destination} ({activeShipment.distanceKm} km)
              </p>
            </div>
          </div>

          {!inline && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Operational Corridor Context Pill Bar */}
        <div className="mt-3 p-2.5 rounded-xl bg-[#090D14] border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block">Assigned Driver</span>
              <span className="font-bold text-white text-[11px] truncate block">
                {assignedDriver.name} (Trust {assignedDriver.reliabilityScore}%)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block">Assigned Vehicle</span>
              <span className="font-mono font-bold text-slate-200 text-[11px] truncate block">
                {assignedVehicle.plateNumber} ({assignedVehicle.capacityTons}T)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick operational preset reply chips */}
      <div className="bg-[#090D14] px-3 py-2 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Presets:
        </span>
        {quickReplies.map((qr, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(qr)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#131A26] text-slate-300 hover:text-white hover:bg-indigo-950 border border-slate-700/60 whitespace-nowrap transition-colors cursor-pointer"
          >
            {qr.length > 32 ? qr.substring(0, 32) + '...' : qr}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-[#0A0E17]/60">
        {messages.map((m) => {
          const isMe = m.senderRole === currentRole;
          const isManager = m.senderRole === 'manager';

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                  {m.senderName}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    isManager
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {isManager ? 'MANAGER' : 'DRIVER'}
                </span>
              </div>

              <div
                className={`max-w-[88%] p-3 rounded-2xl shadow-sm leading-relaxed ${
                  isMe
                    ? isManager
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-emerald-600 text-white rounded-tr-xs'
                    : 'bg-[#151D2A] text-slate-200 border border-slate-800 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Structured Attachment Card if present */}
                {m.attachmentType && (
                  <div className="mt-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      {m.attachmentType === 'location_pin' && <MapPin className="w-3.5 h-3.5" />}
                      {m.attachmentType === 'pod_photo' && <FileText className="w-3.5 h-3.5" />}
                      {m.attachmentType === 'seal_verification' && <ShieldCheck className="w-3.5 h-3.5" />}
                      <span>{m.attachmentTitle || 'Attachment'}</span>
                    </div>
                    {m.attachmentData && (
                      <p className="text-[11px] text-slate-300 font-mono">{m.attachmentData}</p>
                    )}
                  </div>
                )}

                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[9px] font-mono ${
                    isMe ? 'text-white/70' : 'text-slate-400'
                  }`}
                >
                  <span>
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isMe && <CheckCheck className="w-3 h-3 text-emerald-300" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Submenu popover */}
      {showAttachMenu && (
        <div className="p-2 bg-[#121A28] border-t border-slate-800 grid grid-cols-3 gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={handleAttachLocation}
            className="p-2 rounded-xl bg-[#090D14] hover:bg-slate-800 text-slate-200 flex flex-col items-center gap-1 transition-colors cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Share GPS Pin</span>
          </button>
          <button
            type="button"
            onClick={handleAttachPOD}
            className="p-2 rounded-xl bg-[#090D14] hover:bg-slate-800 text-slate-200 flex flex-col items-center gap-1 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Digital POD</span>
          </button>
          <button
            type="button"
            onClick={handleAttachSeal}
            className="p-2 rounded-xl bg-[#090D14] hover:bg-slate-800 text-slate-200 flex flex-col items-center gap-1 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Verify Seal</span>
          </button>
        </div>
      )}

      {/* Footer Form Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-[#101724] border-t border-slate-800 flex items-center gap-2 shrink-0"
      >
        <button
          type="button"
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            showAttachMenu
              ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
              : 'bg-[#090D14] text-slate-400 border-slate-700 hover:text-white'
          }`}
          title="Attach Telemetry / POD"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            currentRole === 'driver'
              ? 'Message Manager (Karthik S) about trip...'
              : 'Message Driver (Ravi Kumar) about dispatch...'
          }
          className="flex-1 bg-[#090D14] border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className={`px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-40 ${
            currentRole === 'driver'
              ? 'bg-emerald-600 hover:bg-emerald-500'
              : 'bg-indigo-600 hover:bg-indigo-500'
          }`}
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
