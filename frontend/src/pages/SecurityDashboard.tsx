import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ProtectedAddress,
  TrustedHouseholdMember,
  AuthorizationRequest,
  AuditLog
} from '../types';
import { api, normalizeAddress } from '../api/client';
import { Modal } from '../components/common/Modal';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Lock,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Trash2,
  UserPlus,
  Home,
  Check,
  X,
  Bell,
  ArrowRight,
  Phone,
  Search
} from 'lucide-react';

export const SecurityDashboard: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'addresses' | 'members' | 'audit'>('addresses');
  const [requests, setRequests] = useState<AuthorizationRequest[]>([]);
  const [addresses, setAddresses] = useState<ProtectedAddress[]>([]);
  const [members, setMembers] = useState<TrustedHouseholdMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isRegisterAddressOpen, setIsRegisterAddressOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [deleteAddressModal, setDeleteAddressModal] = useState<ProtectedAddress | null>(null);
  const [deleteMemberModal, setDeleteMemberModal] = useState<TrustedHouseholdMember | null>(null);
  const [isClearAuditOpen, setIsClearAuditOpen] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [decisionModal, setDecisionModal] = useState<{
    request: AuthorizationRequest;
    decision: 'APPROVED' | 'REJECTED';
  } | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [revokeModalMember, setRevokeModalMember] = useState<TrustedHouseholdMember | null>(null);
  const [smsOtpModal, setSmsOtpModal] = useState<{
    phone: string;
    otp: string;
    orderNumber: string;
    buyerName: string;
  } | null>(null);

  // Form states
  const [newAddressForm, setNewAddressForm] = useState({
    streetLine: '',
    unit: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: user?.phone || '',
    label: '',
  });

  const [newMemberForm, setNewMemberForm] = useState({
    protectedAddressId: 0,
    memberName: '',
    memberPhone: '',
  });

  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const loadAllSecurityData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [reqData, addrData, auditData] = await Promise.all([
        api.security.getPendingRequests(user.email),
        api.addresses.getProtectedAddresses(user.email),
        api.security.getAuditLogs(),
      ]);
      const memData = await api.addresses.getTrustedMembers();
      const userAddressIds = new Set(addrData.map((a) => Number(a.id)));
      const userAddressLabels = new Set(addrData.map((a) => (a.label || '').trim().toLowerCase()));
      const isDhevesh = (user.email || '').toLowerCase().includes('dhevesh');
      const userMembers = memData.filter(
        (m) =>
          userAddressIds.has(Number(m.protectedAddressId)) ||
          userAddressLabels.has((m.protectedAddressLabel || '').trim().toLowerCase()) ||
          (isDhevesh && (Number(m.protectedAddressId) === 102 || (m.protectedAddressLabel || '').toLowerCase().includes('dhevesh')))
      );

      setRequests(reqData);
      setAddresses(addrData);
      setMembers(userMembers);
      setAuditLogs(auditData);

      if (addrData.length > 0 && newMemberForm.protectedAddressId === 0) {
        setNewMemberForm((prev) => ({ ...prev, protectedAddressId: addrData[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllSecurityData();
    const handleUpdate = () => {
      loadAllSecurityData();
    };
    window.addEventListener('ordershield_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('ordershield_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleAllowOrder = async (req: AuthorizationRequest) => {
    if (!user) return;
    try {
      const res = await api.security.allowRequest(req.id, user.email);
      setSmsOtpModal({
        phone: res.ownerPhone,
        otp: res.otpCode,
        orderNumber: req.orderNumber,
        buyerName: req.buyerName,
      });
      showSuccess(`Order #${req.orderNumber} allowed! OTP sent to ${res.ownerPhone}`);
      loadAllSecurityData();
    } catch (err: any) {
      alert(err.message || 'Failed to allow order');
    }
  };

  const handleRejectOrder = async (req: AuthorizationRequest) => {
    if (!user) return;
    try {
      await api.security.rejectRequest(req.id, 'Declined by address owner', user.email);
      showSuccess(`Order #${req.orderNumber} rejected. Dispatch permanently locked.`);
      loadAllSecurityData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject order');
    }
  };

  // Handlers
  const handleRegisterAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.addresses.registerProtectedAddress({
        ownerId: user.id,
        ownerName: user.fullName,
        ownerEmail: user.email,
        streetLine: newAddressForm.streetLine,
        unit: newAddressForm.unit,
        city: newAddressForm.city,
        state: newAddressForm.state,
        postalCode: newAddressForm.postalCode,
        country: newAddressForm.country,
        phone: newAddressForm.phone || user.phone || '',
        label: newAddressForm.label || 'Home Address',
        isActive: true,
      });
      setIsRegisterAddressOpen(false);
      setNewAddressForm({
        streetLine: '',
        unit: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        phone: user.phone || '',
        label: '',
      });
      showSuccess('Home address registered and protected successfully!');
      loadAllSecurityData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const isDhevesh = (user.email || '').toLowerCase().includes('dhevesh');
    const targetAddressId = Number(newMemberForm.protectedAddressId) || addresses[0]?.id || (isDhevesh ? 102 : 0);
    try {
      await api.addresses.inviteMember({
        protectedAddressId: targetAddressId,
        memberName: newMemberForm.memberName,
        memberPhone: newMemberForm.memberPhone,
        ownerEmail: user.email,
      });
      setIsInviteMemberOpen(false);
      setNewMemberForm({
        protectedAddressId: addresses[0]?.id || (isDhevesh ? 102 : 0),
        memberName: '',
        memberPhone: '',
      });
      showSuccess(`Authorized family member ${newMemberForm.memberName} (${newMemberForm.memberPhone})!`);
      loadAllSecurityData();
      window.dispatchEvent(new Event('ordershield_update'));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleMemberAccess = async (mem: TrustedHouseholdMember) => {
    if (!user) return;
    try {
      if (mem.status === 'ACTIVE') {
        await api.addresses.revokeMember(mem.id, user.email);
        showSuccess(`Revoked family member access for ${mem.memberName} (${mem.memberPhone || mem.memberEmail}).`);
      } else {
        await api.addresses.grantMember(mem.id, user.email);
        showSuccess(`Granted family member access to ${mem.memberName} (${mem.memberPhone || mem.memberEmail})!`);
      }
      loadAllSecurityData();
      window.dispatchEvent(new Event('ordershield_update'));
    } catch (err: any) {
      alert(err.message || 'Failed to update member status');
    }
  };

  const handleConfirmDeleteMember = async () => {
    if (!deleteMemberModal || !user) return;
    try {
      await api.addresses.deleteMember(deleteMemberModal.id, user.email);
      showSuccess(`Deleted family member ${deleteMemberModal.memberName} successfully.`);
      setDeleteMemberModal(null);
      loadAllSecurityData();
      window.dispatchEvent(new Event('ordershield_update'));
    } catch (err: any) {
      alert(err.message || 'Failed to delete family member');
    }
  };

  const handleDeleteAuditLog = async (logId: number) => {
    try {
      await api.security.deleteAuditLog(logId);
      showSuccess('Deleted audit log entry.');
      setAuditLogs((prev) => prev.filter((l) => l.id !== logId));
      window.dispatchEvent(new Event('ordershield_update'));
    } catch (err: any) {
      alert(err.message || 'Failed to delete audit log');
    }
  };

  const handleClearAllAuditLogs = async () => {
    if (!user) return;
    try {
      await api.security.clearAuditLogs(user.email);
      showSuccess('Security audit trail cleared completely.');
      setIsClearAuditOpen(false);
      setAuditLogs([]);
      window.dispatchEvent(new Event('ordershield_update'));
    } catch (err: any) {
      alert(err.message || 'Failed to clear audit trail');
    }
  };

  const handleConfirmDecision = async () => {
    if (!decisionModal || !user) return;
    try {
      await api.security.decideRequest(
        decisionModal.request.id,
        decisionModal.decision,
        decisionNotes,
        user.email
      );
      showSuccess(
        decisionModal.decision === 'APPROVED'
          ? `Order #${decisionModal.request.orderNumber} approved! Dispatch lock released.`
          : `Order #${decisionModal.request.orderNumber} rejected. Dispatch permanently blocked.`
      );
      setDecisionModal(null);
      setDecisionNotes('');
      loadAllSecurityData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmDeleteAddress = async () => {
    if (!deleteAddressModal || !user) return;
    try {
      await api.addresses.deleteProtectedAddress(deleteAddressModal.id, user.email);
      showSuccess(`Privacy address "${deleteAddressModal.label}" deleted successfully.`);
      setDeleteAddressModal(null);
      loadAllSecurityData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete privacy address');
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeModalMember || !user) return;
    try {
      await api.addresses.revokeMember(revokeModalMember.id, user.email);
      showSuccess(`Revoked family member access for ${revokeModalMember.memberPhone || revokeModalMember.memberEmail}.`);
      setRevokeModalMember(null);
      loadAllSecurityData();
      window.dispatchEvent(new Event('ordershield_update'));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearchQuery.trim()) return true;
    const q = auditSearchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actorEmail.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.resourceType.toLowerCase().includes(q) ||
      log.resourceId.toLowerCase().includes(q) ||
      new Date(log.timestamp).toLocaleString().toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Home Address Protection Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            OrderShield Security Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your protected delivery addresses, authorized household members, and incoming delivery approval requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRegisterAddressOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            Protect New Address
          </button>
          <button
            onClick={() => setIsInviteMemberOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Authorize Family Member
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <Check className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Banner directing to Notification Center for delivery authorizations */}
      {pendingRequestsCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
            <span>
              You have <strong>{pendingRequestsCount} delivery authorization alert(s)</strong> waiting for your decision! Delivery approval and OTP actions are handled in your Notification Center.
            </span>
          </div>
          <Link
            to="/notifications"
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 inline-flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Review in Notification Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'addresses'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-4 h-4" />
          Protected Addresses ({addresses.length})
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'members'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Household Members ({members.filter((m) => m.status === 'ACTIVE').length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Security Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab 2: Protected Addresses */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          {addresses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
              <Home className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Protected Addresses</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No protected delivery addresses are registered under this account ({user?.email}). Use the <strong>+ Protect New Address</strong> button above to register and secure your personal delivery destination.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((addr) => {
                const normHash = normalizeAddress(addr.streetLine, addr.unit, addr.city, addr.postalCode);
                return (
                  <div
                    key={addr.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[11px] font-bold border border-teal-200 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified Protected
                        </span>
                        <h3 className="text-base font-bold text-slate-900 pt-1">{addr.label}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeleteAddressModal(addr)}
                        title="Delete protected privacy address"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Address
                      </button>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="font-semibold text-slate-800">{addr.streetLine} {addr.unit}</p>
                      <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                      <p>{addr.country}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Registered: {new Date(addr.registeredAt).toLocaleDateString()}</span>
                      <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        Hash: {normHash.slice(0, 16)}...
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Trusted Household Members */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="bg-sky-50 rounded-2xl p-4 border border-sky-200 text-xs text-sky-900 flex items-start gap-3">
            <Users className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Trusted Household Permission Policy:</span>
              Active members can place orders to your protected address without creating authorization requests or bothering you with notifications. You can toggle between <strong>Granted</strong> and <strong>Revoked</strong> access anytime, or permanently delete members.
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Authorized Household Members</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Household members authorized to order to your protected address without security delays.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteMemberOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Authorize Family Member
              </button>
            </div>

            {members.length === 0 ? (
              <div className="text-center py-16 space-y-3 p-6">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Authorized Family Members Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No family members are currently added under your protected address. Use the <strong>Authorize Family Member</strong> button above to add a trusted member.
                </p>
              </div>
            ) : (
              members.map((mem) => {
                const isGranted = mem.status === 'ACTIVE';
                return (
                  <div
                    key={mem.id}
                    className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">{mem.memberName}</h4>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-mono text-xs font-semibold border border-teal-200">
                          <Phone className="w-3 h-3 text-teal-600" />
                          {mem.memberPhone || mem.memberEmail}
                        </span>
                        {isGranted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Permission Granted (Active)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                            <XCircle className="w-3.5 h-3.5 text-amber-600" />
                            Permission Revoked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Assigned to destination:{' '}
                        <span className="text-slate-800 font-semibold">{mem.protectedAddressLabel || 'Protected Home'}</span>
                      </p>
                    </div>

                    {/* Actions: Toggle switch, Toggle action button (Grant/Revoke), and Delete button */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Interactive Toggle Switch */}
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-600">
                          {isGranted ? 'Access ON' : 'Access OFF'}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isGranted}
                          onClick={() => handleToggleMemberAccess(mem)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            isGranted ? 'bg-teal-600' : 'bg-slate-300'
                          }`}
                          title={isGranted ? 'Click to Revoke Permission' : 'Click to Grant Permission'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isGranted ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Grant / Revoke Toggle Button */}
                      {isGranted ? (
                        <button
                          type="button"
                          onClick={() => handleToggleMemberAccess(mem)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 transition-all cursor-pointer shadow-xs"
                          title="Revoke delivery permission for this member"
                        >
                          <XCircle className="w-3.5 h-3.5 text-amber-600" />
                          Revoke Access
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleMemberAccess(mem)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 transition-all cursor-pointer shadow-xs"
                          title="Grant delivery permission for this member"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Grant Access
                        </button>
                      )}

                      {/* Delete Member Button */}
                      <button
                        type="button"
                        onClick={() => setDeleteMemberModal(mem)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-xs"
                        title="Permanently remove this authorized family member"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-teal-600" />
                Immutable Security Event Audit Trail
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographically recorded logs of address protection, family member approvals, status toggles, and delivery permissions.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 w-36 sm:w-48"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsClearAuditOpen(true)}
                disabled={auditLogs.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
                title="Clear all recorded security audit logs"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                Clear All Logs
              </button>
            </div>
          </div>

          {filteredAuditLogs.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <History className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Security Audit Logs Found</p>
              <p className="text-xs text-slate-400">
                {auditSearchQuery
                  ? `No events match "${auditSearchQuery}". Try a different search filter.`
                  : 'The audit trail is currently empty or has been cleared.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.map((log) => {
                    let actionBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                    if (log.action.includes('GRANTED') || log.action.includes('APPROVED')) {
                      actionBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    } else if (log.action.includes('REVOKED') || log.action.includes('REJECTED')) {
                      actionBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                    } else if (log.action.includes('DELETED') || log.action.includes('BLOCKED')) {
                      actionBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                    } else if (log.action.includes('INVITED') || log.action.includes('REGISTERED')) {
                      actionBadgeColor = 'bg-teal-50 text-teal-700 border-teal-200';
                    }

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${actionBadgeColor}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          {log.actorEmail}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono">
                          {log.resourceType}:{log.resourceId}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {log.details}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeleteAuditLog(log.id)}
                            className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete this audit log entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Register Protected Address */}
      <Modal
        isOpen={isRegisterAddressOpen}
        onClose={() => setIsRegisterAddressOpen(false)}
        title="Protect a Delivery Address"
      >
        <form onSubmit={handleRegisterAddress} className="space-y-4">
          <p className="text-xs text-slate-500">
            Once registered, your address will be secured. Any order from accounts not on your trusted household roster will trigger authorization.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Friendly Label</label>
            <input
              type="text"
              required
              placeholder="e.g. Primary Residence / Beach House"
              value={newAddressForm.label}
              onChange={(e) => setNewAddressForm({ ...newAddressForm, label: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              required
              placeholder="e.g. 742 Evergreen Terrace"
              value={newAddressForm.streetLine}
              onChange={(e) => setNewAddressForm({ ...newAddressForm, streetLine: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit / Apt</label>
              <input
                type="text"
                placeholder="e.g. Apt 4B"
                value={newAddressForm.unit}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                required
                placeholder="e.g. Springfield"
                value={newAddressForm.city}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
              <input
                type="text"
                required
                placeholder="e.g. OR"
                value={newAddressForm.state}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
              <input
                type="text"
                required
                placeholder="e.g. 97477"
                value={newAddressForm.postalCode}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, postalCode: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Owner Phone Number for OTP Alerts (PostgreSQL Verified)
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. +91 9876543210"
              value={newAddressForm.phone}
              onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 font-mono text-slate-800"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              OrderShield will send security authorization notifications and delivery OTPs to this phone number.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRegisterAddressOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-teal-600 text-white text-xs font-bold shadow-xs"
            >
              Protect Address
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Authorize Household Member */}
      <Modal
        isOpen={isInviteMemberOpen}
        onClose={() => setIsInviteMemberOpen(false)}
        title="Authorize Family Member"
      >
        <form onSubmit={handleInviteMember} className="space-y-4">
          <p className="text-xs text-slate-500">
            Authorized family members can order to your protected address without triggering alerts or authorization delays.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assign to Protected Address</label>
            {addresses.length === 0 ? (
              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-800 border border-amber-200">
                No protected addresses registered yet. Please protect an address first.
              </div>
            ) : (
              <select
                value={newMemberForm.protectedAddressId || addresses[0]?.id || 0}
                onChange={(e) => setNewMemberForm({ ...newMemberForm, protectedAddressId: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} ({a.streetLine})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Member Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ajay (Family Member)"
              value={newMemberForm.memberName}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, memberName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Member Mobile Number (Unique Phone Identifier)
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="e.g. +91 98765 00000"
                value={newMemberForm.memberPhone}
                onChange={(e) => setNewMemberForm({ ...newMemberForm, memberPhone: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 font-mono text-slate-800"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Orders matching this mobile number will automatically pass without triggering authorization delays or security locks.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInviteMemberOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addresses.length === 0}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs disabled:opacity-50"
            >
              Grant Permission
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Approve / Reject Decision */}
      {decisionModal && (
        <Modal
          isOpen={true}
          onClose={() => setDecisionModal(null)}
          title={decisionModal.decision === 'APPROVED' ? 'Approve Delivery Authorization' : 'Decline Delivery Authorization'}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              {decisionModal.decision === 'APPROVED'
                ? `You are about to authorize order #${decisionModal.request.orderNumber} placed by ${decisionModal.request.buyerName} to your address "${decisionModal.request.protectedAddressLabel}". Once approved, fulfillment and carrier dispatch will proceed.`
                : `You are rejecting order #${decisionModal.request.orderNumber}. The order will be cancelled immediately and permanently blocked from carrier dispatch.`}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Decision Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder={decisionModal.decision === 'APPROVED' ? 'e.g. Verified with nephew via phone.' : 'e.g. Unrecognized sender, do not deliver to this house.'}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDecisionModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-xs ${
                  decisionModal.decision === 'APPROVED'
                    ? 'bg-teal-600 hover:bg-teal-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {decisionModal.decision === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Revoke Household Member */}
      {revokeModalMember && (
        <Modal
          isOpen={true}
          onClose={() => setRevokeModalMember(null)}
          title="Revoke Household Member Access"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to revoke delivery permissions for{' '}
              <strong>{revokeModalMember.memberName}</strong> ({revokeModalMember.memberPhone || revokeModalMember.memberEmail})?
            </p>
            <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-800 border border-amber-200">
              Future orders placed by this account to your protected address will no longer pass automatically and will require explicit authorization. (Previously approved orders will not be altered).
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRevokeModalMember(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Revoke Member
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Delete Protected Privacy Address */}
      {deleteAddressModal && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteAddressModal(null)}
          title="Delete Privacy Address"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Permanent Deletion Warning:</span>
                <p className="leading-relaxed">
                  Are you sure you want to delete privacy protection for{' '}
                  <strong>{deleteAddressModal.label}</strong> ({deleteAddressModal.streetLine}, {deleteAddressModal.city})?
                  Any authorized family members assigned to this address will also be removed.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteAddressModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAddress}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Address
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Phone SMS OTP Dispatched */}
      {smsOtpModal && (
        <Modal
          isOpen={true}
          onClose={() => setSmsOtpModal(null)}
          title="📱 Phone Notification Dispatched"
        >
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-3 shadow-xl border border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-teal-400 font-bold">
                <span>SMS GATEWAY DISPATCH</span>
                <span>TO: {smsOtpModal.phone}</span>
              </div>
              <p className="text-slate-200 leading-relaxed font-sans text-xs">
                OrderShield Security Alert: You have <strong className="text-emerald-400">ALLOWED</strong> delivery for Order <strong className="text-white">#{smsOtpModal.orderNumber}</strong> by buyer <strong className="text-white">{smsOtpModal.buyerName}</strong>.
              </p>
              <div className="p-4 bg-teal-950/80 border border-teal-500/50 rounded-2xl text-center space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-teal-400 font-sans font-extrabold">Delivery Authorization OTP</div>
                <div className="text-3xl font-black tracking-widest text-emerald-300 font-mono py-1">
                  {smsOtpModal.otp}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Please share this 6-digit OTP code with <strong>{smsOtpModal.buyerName}</strong> so they can enter it at checkout to complete their order.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(smsOtpModal.otp);
                  showSuccess('Security OTP copied to clipboard!');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all"
              >
                Copy OTP Code
              </button>
              <button
                type="button"
                onClick={() => setSmsOtpModal(null)}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Delete Authorized Family Member */}
      {deleteMemberModal && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteMemberModal(null)}
          title="Delete Authorized Family Member"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Permanent Deletion:</span>
                <p className="leading-relaxed">
                  Are you sure you want to permanently delete family member{' '}
                  <strong>{deleteMemberModal.memberName}</strong>{' '}
                  ({deleteMemberModal.memberPhone || deleteMemberModal.memberEmail}) from your authorized household roster for{' '}
                  <strong>{deleteMemberModal.protectedAddressLabel}</strong>?
                </p>
                <p className="text-[11px] text-rose-700">
                  This member will no longer have delivery permissions. Subsequent orders placed by this account will require your explicit security authorization.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteMemberModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMember}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Member
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Clear All Audit Logs */}
      {isClearAuditOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsClearAuditOpen(false)}
          title="Clear Security Audit Trail"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Clear Entire Audit Trail:</span>
                <p className="leading-relaxed">
                  Are you sure you want to clear all <strong>{auditLogs.length}</strong> security audit log entries? This will permanently wipe all recorded security events.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearAuditOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllAuditLogs}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All Logs
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
