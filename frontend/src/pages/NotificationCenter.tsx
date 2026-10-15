import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Modal } from '../components/common/Modal';
import {
  Bell,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Check,
  X,
  Smartphone,
  Copy,
  ArrowRight
} from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { notifications, markAsRead, deleteNotification, clearAll, refresh } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<'ALL' | 'SECURITY' | 'ORDER'>('ALL');
  const [smsModal, setSmsModal] = useState<{
    phone: string;
    otp: string;
    title: string;
  } | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<number | null>(null);

  const filtered = notifications.filter((n) => {
    if (n.title.includes('OTP Generated')) return false;
    if (filter === 'SECURITY') return n.type === 'SECURITY_ALERT';
    if (filter === 'ORDER') return n.type === 'ORDER_STATUS_UPDATE';
    return true;
  });

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setActionMsg('Notification deleted.');
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      // ignore
    }
  };

  const handleAllow = async (e: React.MouseEvent, n: any) => {
    e.stopPropagation();
    if (!user || !n.relatedEntityId) return;

    try {
      setDecidingId(n.id);
      const res = await api.security.allowRequest(n.relatedEntityId, user.email);
      markAsRead(n.id);
      setSmsModal({
        phone: res.ownerPhone || user.phone || '+91 9876543210',
        otp: res.otpCode,
        title: 'Delivery Authorization Allowed',
      });
      setActionMsg(`Delivery allowed! OTP sent to phone ${res.ownerPhone}`);
      refresh();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to allow request');
    } finally {
      setDecidingId(null);
    }
  };

  const handleReject = async (e: React.MouseEvent, n: any) => {
    e.stopPropagation();
    if (!user || !n.relatedEntityId) return;

    try {
      setDecidingId(n.id);
      await api.security.rejectRequest(n.relatedEntityId, 'Declined by address owner', user.email);
      markAsRead(n.id);
      setActionMsg('Delivery request rejected. Dispatch permanently locked.');
      refresh();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time security alerts and delivery verification for {user?.fullName} ({user?.phone || 'No phone set'}).
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={async () => {
              await clearAll();
              setActionMsg('All notifications cleared.');
              setTimeout(() => setActionMsg(null), 3000);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 hover:bg-rose-100 hover:text-rose-800 font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All Notifications
          </button>
        )}
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('SECURITY')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'SECURITY'
              ? 'bg-teal-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Security Alerts ({notifications.filter((n) => n.type === 'SECURITY_ALERT').length})
        </button>
        <button
          onClick={() => setFilter('ORDER')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'ORDER'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Order Updates ({notifications.filter((n) => n.type === 'ORDER_STATUS_UPDATE').length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Notifications</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You're all caught up! When an order requires your authorization or status updates occur, alerts appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                !n.isRead
                  ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    n.type === 'SECURITY_ALERT'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-teal-100 text-teal-700'
                  }`}
                >
                  {n.type === 'SECURITY_ALERT' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed max-w-xl">{n.message}</p>
                  <span className="text-[10px] text-slate-400 block pt-0.5">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons for Security Authorizations */}
              {(() => {
                const isPendingAlert = n.type === 'SECURITY_ALERT' && 
                  n.relatedEntityId && 
                  !n.title.includes('Allowed') && 
                  !n.title.includes('Approved') && 
                  !n.title.includes('Declined') && 
                  !n.title.includes('Rejected') && 
                  !n.title.includes('OTP');
                const isAllowed = n.title.includes('Allowed') || n.title.includes('Approved');
                const isDeclined = n.title.includes('Declined') || n.title.includes('Rejected');

                if (isPendingAlert) {
                  return (
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                      <button
                        disabled={decidingId === n.id}
                        onClick={(e) => handleAllow(e, n)}
                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        Allow (Send OTP)
                      </button>

                      <button
                        disabled={decidingId === n.id}
                        onClick={(e) => handleReject(e, n)}
                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>

                      <button
                        onClick={(e) => handleDelete(e, n.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-all rounded-lg hover:bg-rose-50"
                        title="Delete Notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }

                if (isAllowed) {
                  return (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Allowed (OTP Sent to Phone)
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, n.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-all rounded-lg hover:bg-rose-50"
                        title="Delete Notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }

                if (isDeclined) {
                  return (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                        <X className="w-3.5 h-3.5 text-rose-600" />
                        Declined by You
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, n.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-all rounded-lg hover:bg-rose-50"
                        title="Delete Notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 shrink-0 font-medium"
                    >
                      Mark read
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, n.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-all rounded-lg hover:bg-rose-50"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Phone Notification Dispatched Modal */}
      {smsModal && (
        <Modal
          isOpen={true}
          onClose={() => setSmsModal(null)}
          title="📱 Phone Notification Dispatched"
        >
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-3 shadow-xl border border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-teal-400 font-bold">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" /> SMS GATEWAY DISPATCH
                </span>
                <span>TO: {smsModal.phone}</span>
              </div>
              <p className="text-slate-200 leading-relaxed font-sans text-xs">
                OrderShield Security Alert: You have <strong className="text-emerald-400">ALLOWED</strong> delivery to your protected address.
              </p>
              <div className="p-4 bg-teal-950/80 border border-teal-500/50 rounded-2xl text-center space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-teal-400 font-sans font-extrabold">Delivery Authorization OTP</div>
                <div className="text-3xl font-black tracking-widest text-emerald-300 font-mono py-1">
                  {smsModal.otp}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Share this 6-digit OTP code with the buyer so they can complete their order on their checkout screen.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(smsModal.otp);
                  setActionMsg('Security OTP copied to clipboard!');
                  setTimeout(() => setActionMsg(null), 3000);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy OTP Code
              </button>
              <button
                type="button"
                onClick={() => setSmsModal(null)}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NotificationCenter;
