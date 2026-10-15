import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api, normalizeAddress, findProtectedAddressMatch, isAuthorizedHouseholdMember, localStore, getActiveCooldown, addRejectionCooldown } from '../api/client';
import { ProtectedAddress } from '../types';
import { Modal } from '../components/common/Modal';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Truck,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  Smartphone,
  KeyRound,
  RotateCw,
  Check,
  X,
  Clock
} from 'lucide-react';
import { formatPrice } from '../utils/formatters';

export const Checkout: React.FC = () => {
  const { items, subtotal, shipping, grandTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Address fields - clean state isolated per user account
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.fullName || 'Customer',
    streetLine: '',
    unit: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: user?.phone || '+91 9876500000',
  });

  useEffect(() => {
    if (user) {
      if (user.email.toLowerCase() === 'dhevesh@shield.com') {
        setShippingAddress((prev) => ({
          ...prev,
          fullName: user.fullName || 'Dhevesh',
          streetLine: '42 Lotus Residency, Gandhi Road',
          unit: 'Villa 12',
          city: 'Chennai',
          state: 'TN',
          postalCode: '600001',
          country: 'India',
          phone: user.phone || '+91 9876543210',
        }));
      } else if (user.email.toLowerCase() === 'ajay@shield.com') {
        setShippingAddress({
          fullName: user.fullName || 'Ajay',
          streetLine: '',
          unit: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India',
          phone: user.phone || '+91 9876500000',
        });
      } else {
        // Any newly created account starts with completely clean empty address
        setShippingAddress({
          fullName: user.fullName || '',
          streetLine: '',
          unit: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India',
          phone: user.phone || '',
        });
      }
    }
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState<'DEMO_CARD' | 'COD'>('DEMO_CARD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // OTP Verification Modal state for OrderShield protected addresses
  const [otpModal, setOtpModal] = useState<{
    isOpen: boolean;
    authReqId: number;
    orderId: number;
    orderNumber: string;
    ownerName: string;
    ownerPhoneMasked: string;
    status: 'PENDING' | 'OTP_SENT' | 'APPROVED' | 'REJECTED';
    otpInput: string;
    verifying: boolean;
    error: string | null;
  } | null>(null);

  // Address security evaluation in real-time
  const [addressEvaluation, setAddressEvaluation] = useState<{
    type: 'UNPROTECTED' | 'OWNER' | 'HOUSEHOLD' | 'STRANGER';
    title: string;
    description: string;
    ownerDisplayName?: string;
    ownerPhone?: string;
  } | null>(null);

  // 10-Minute Anti-Frustration Rejection Cooldown State
  const [cooldown, setCooldown] = useState<{ active: boolean; remainingSeconds: number; ownerEmail?: string }>({
    active: false,
    remainingSeconds: 0,
  });

  // 10-Minute Anti-Spam Rejection Cooldown timer
  useEffect(() => {
    const syncCooldown = () => {
      const cd = getActiveCooldown(
        shippingAddress.streetLine,
        shippingAddress.unit,
        shippingAddress.city,
        shippingAddress.postalCode
      );
      setCooldown(cd);
    };

    syncCooldown();
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (!prev.active || prev.remainingSeconds <= 1) {
          return getActiveCooldown(
            shippingAddress.streetLine,
            shippingAddress.unit,
            shippingAddress.city,
            shippingAddress.postalCode
          );
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    window.addEventListener('ordershield_cooldown_update', syncCooldown);
    window.addEventListener('storage', syncCooldown);

    return () => {
      clearInterval(timer);
      window.removeEventListener('ordershield_cooldown_update', syncCooldown);
      window.removeEventListener('storage', syncCooldown);
    };
  }, [shippingAddress.streetLine, shippingAddress.unit, shippingAddress.city, shippingAddress.postalCode]);

  useEffect(() => {
    let cancelled = false;
    if (!shippingAddress.streetLine || shippingAddress.streetLine.trim().length < 2) {
      setAddressEvaluation(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.security.evaluateAddress(shippingAddress);
        if (cancelled) return;
        if (!res.isProtected) {
          setAddressEvaluation({
            type: 'UNPROTECTED',
            title: 'Standard Unprotected Address',
            description: 'This address is not registered in the OrderShield defense registry. Normal order processing will apply.',
          });
        } else if (res.isOwner) {
          const rawName = res.ownerDisplayName || 'Dhevesh';
          const cleanOwnerName = (!rawName || rawName.toLowerCase().includes('alice')) ? 'Dhevesh' : rawName;
          setAddressEvaluation({
            type: 'OWNER',
            title: '👑 Verified Address Owner',
            description: `You are the registered owner of this address. Your order will process normally with zero security friction or alert interruption.`,
            ownerDisplayName: cleanOwnerName,
            ownerPhone: res.ownerPhone && !res.ownerPhone.includes('555') ? res.ownerPhone : '+91 9876543210',
          });
        } else if (res.isHouseholdMember) {
          const rawName = res.ownerDisplayName || 'Dhevesh';
          const cleanOwnerName = (!rawName || rawName.toLowerCase().includes('alice')) ? 'Dhevesh' : rawName;
          setAddressEvaluation({
            type: 'HOUSEHOLD',
            title: '👥 Active Household Member — Instant Approval',
            description: `You are authorized by homeowner ${cleanOwnerName}. Your order will proceed directly with zero dispatch delay or security blocks.`,
            ownerDisplayName: cleanOwnerName,
            ownerPhone: res.ownerPhone && !res.ownerPhone.includes('555') ? res.ownerPhone : '+91 9876543210',
          });
        } else {
          const rawName = res.ownerDisplayName || 'Dhevesh';
          const cleanOwnerName = (!rawName || rawName.toLowerCase().includes('alice')) ? 'Dhevesh' : rawName;
          setAddressEvaluation({
            type: 'STRANGER',
            title: '🛡️ OrderShield Protection Triggered!',
            description: `This destination is a protected home address belonging to verified owner ${cleanOwnerName}. Because your account is not an authorized member, a security authorization request will be created and dispatch will be strictly BLOCKED until the owner approves.`,
            ownerDisplayName: cleanOwnerName,
            ownerPhone: res.ownerPhone && !res.ownerPhone.includes('555') ? res.ownerPhone : '+91 9876543210',
          });
        }
      } catch {
        localStore.load();
        // Fallback check against localStore
        const match = findProtectedAddressMatch(
          shippingAddress.streetLine,
          shippingAddress.unit,
          shippingAddress.city,
          shippingAddress.postalCode
        );

        if (cancelled) return;
        if (!match) {
          setAddressEvaluation({
            type: 'UNPROTECTED',
            title: 'Standard Unprotected Address',
            description: 'This address is not registered in the OrderShield defense registry. Normal order processing will apply.',
          });
        } else {
          const rawOwnerEmail = match.ownerEmail || (match as any).owner?.email || 'dhevesh@shield.com';
          const matchedOwnerEmail = rawOwnerEmail.toLowerCase().includes('alice') ? 'dhevesh@shield.com' : rawOwnerEmail;
          const rawOwnerName = match.ownerName || (match as any).owner?.fullName || 'Dhevesh';
          const matchedOwnerName = (!rawOwnerName || rawOwnerName.toLowerCase().includes('alice')) ? 'Dhevesh' : rawOwnerName;
          const matchedOwnerPhone = match.phone && !match.phone.includes('555') ? match.phone : '+91 9876543210';

          const isOwner = user?.email.toLowerCase() === matchedOwnerEmail.toLowerCase();
          const isHousehold = isAuthorizedHouseholdMember(match, {
            phone: user?.phone,
            shippingPhone: shippingAddress.phone,
            fullName: user?.fullName,
            shippingFullName: shippingAddress.fullName,
            email: user?.email,
          });

          if (isOwner) {
            setAddressEvaluation({
              type: 'OWNER',
              title: '👑 Verified Address Owner',
              description: `You are the registered owner of "${match.label}". Your order will process normally with zero security friction or alert interruption.`,
              ownerDisplayName: matchedOwnerName,
              ownerPhone: matchedOwnerPhone,
            });
          } else if (isHousehold) {
            setAddressEvaluation({
              type: 'HOUSEHOLD',
              title: '👥 Active Household Member — Instant Approval',
              description: `You are authorized by homeowner ${matchedOwnerName}. Your order will proceed directly with zero dispatch delay or security blocks.`,
              ownerDisplayName: matchedOwnerName,
              ownerPhone: matchedOwnerPhone,
            });
          } else {
            setAddressEvaluation({
              type: 'STRANGER',
              title: '🛡️ OrderShield Protection Triggered!',
              description: `This destination is a protected home address belonging to verified owner ${matchedOwnerName}. Because your account is not an authorized member, a security authorization request will be created and dispatch will be strictly BLOCKED until the owner approves.`,
              ownerDisplayName: matchedOwnerName,
              ownerPhone: matchedOwnerPhone,
            });
          }
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    shippingAddress.streetLine,
    shippingAddress.unit,
    shippingAddress.city,
    shippingAddress.postalCode,
    shippingAddress.phone,
    shippingAddress.fullName,
    user,
  ]);

  // Polling and real-time event listener for homeowner decision on pending OTP request
  useEffect(() => {
    if (!otpModal || !otpModal.isOpen || otpModal.status === 'APPROVED' || otpModal.status === 'REJECTED') {
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await api.security.getRequestStatus(otpModal.authReqId);
        if (res.status === 'OTP_SENT' && otpModal.status !== 'OTP_SENT') {
          setOtpModal((prev) => prev ? {
            ...prev,
            status: 'OTP_SENT',
            ownerPhoneMasked: res.ownerPhoneMasked || prev.ownerPhoneMasked,
          } : null);
        } else if (res.status === 'REJECTED') {
          setOtpModal((prev) => prev ? { ...prev, status: 'REJECTED' } : null);
          addRejectionCooldown(
            shippingAddress.streetLine,
            shippingAddress.unit,
            shippingAddress.city,
            shippingAddress.postalCode,
            otpModal.ownerName
          );
          setCooldown(getActiveCooldown(
            shippingAddress.streetLine,
            shippingAddress.unit,
            shippingAddress.city,
            shippingAddress.postalCode
          ));
        } else if (res.status === 'APPROVED') {
          setOtpModal((prev) => prev ? { ...prev, status: 'APPROVED' } : null);
          clearCart();
          navigate(`/orders/${otpModal.orderId}`, {
            state: { justPlaced: true, authorizationRequired: true, otpVerified: true },
          });
        }
      } catch {
        // ignore
      }
    };

    const interval = setInterval(checkStatus, 1000);

    const handleUpdate = (e: any) => {
      if (e.detail?.requestId === otpModal.authReqId || !e.detail?.requestId) {
        if (e.detail?.status === 'OTP_SENT') {
          setOtpModal((prev) => prev ? { ...prev, status: 'OTP_SENT' } : null);
        } else if (e.detail?.status === 'REJECTED') {
          setOtpModal((prev) => prev ? { ...prev, status: 'REJECTED' } : null);
          addRejectionCooldown(
            shippingAddress.streetLine,
            shippingAddress.unit,
            shippingAddress.city,
            shippingAddress.postalCode,
            otpModal.ownerName
          );
          setCooldown(getActiveCooldown(
            shippingAddress.streetLine,
            shippingAddress.unit,
            shippingAddress.city,
            shippingAddress.postalCode
          ));
        } else if (e.detail?.status === 'APPROVED') {
          setOtpModal((prev) => prev ? { ...prev, status: 'APPROVED' } : null);
          clearCart();
          navigate(`/orders/${otpModal.orderId}`, {
            state: { justPlaced: true, authorizationRequired: true, otpVerified: true },
          });
        } else {
          checkStatus();
        }
      }
    };

    window.addEventListener('ordershield_update', handleUpdate);
    window.addEventListener('storage', checkStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('ordershield_update', handleUpdate);
      window.removeEventListener('storage', checkStatus);
    };
  }, [otpModal?.isOpen, otpModal?.authReqId, otpModal?.status, navigate, clearCart, shippingAddress]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Please sign in to place an order.');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }
    if (cooldown.active) {
      const m = Math.floor(cooldown.remainingSeconds / 60);
      const s = cooldown.remainingSeconds % 60;
      setErrorMsg(`Homeowner declined delivery to this address. A 10-minute anti-spam cooldown is active (${m}m ${s}s remaining). No notification sent.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const result = await api.orders.createOrder({
        user,
        shippingAddress,
        items,
        totalAmount: grandTotal,
      });

      // If OrderShield authorization is required (untrusted customer / stranger ordering to protected address):
      // Hold buyer on checkout and open OTP verification workflow modal!
      if (result.authorizationRequired) {
        const rawOwnerName = (result.order as any).ownerName || addressEvaluation?.ownerDisplayName || 'Dhevesh';
        const ownerName = (!rawOwnerName || rawOwnerName.toLowerCase().includes('alice')) ? 'Dhevesh' : rawOwnerName;
        const rawOwnerPhone = (result.order as any).ownerPhone || addressEvaluation?.ownerPhone || '+91 9876543210';
        const masked = rawOwnerPhone.length > 4
          ? `${rawOwnerPhone.slice(0, 4)} **** ${rawOwnerPhone.slice(-4)}`
          : '+91 **** 3210';

        const authReqId = result.order.authorizationRequestId || (result.order as any).id || Date.now();

        setOtpModal({
          isOpen: true,
          authReqId,
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          ownerName,
          ownerPhoneMasked: masked,
          status: 'PENDING',
          otpInput: '',
          verifying: false,
          error: null,
        });
      } else {
        // Verified address owner or normal address: order placed safely!
        clearCart();
        navigate(`/orders/${result.order.id}`, {
          state: {
            justPlaced: true,
            authorizationRequired: false,
          },
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModal || !otpModal.otpInput || otpModal.otpInput.trim().length < 4) {
      setOtpModal((prev) => prev ? { ...prev, error: 'Please enter the 6-digit OTP code.' } : null);
      return;
    }

    try {
      setOtpModal((prev) => prev ? { ...prev, verifying: true, error: null } : null);
      await api.security.verifyOtp(otpModal.authReqId, otpModal.otpInput.trim(), user?.email);

      // Successfully verified!
      clearCart();
      navigate(`/orders/${otpModal.orderId}`, {
        state: {
          justPlaced: true,
          authorizationRequired: true,
          otpVerified: true,
        },
      });
    } catch (err: any) {
      setOtpModal((prev) => prev ? {
        ...prev,
        verifying: false,
        error: err.message || 'Invalid OTP. Please check the code sent to the homeowner.',
      } : null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Please add items to your cart before proceeding to checkout.</p>
        <Link to="/products" className="inline-block px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold">
          Return to Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Secure Order Checkout
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review shipping address, inspect real-time OrderShield protection status, and confirm your order.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Shipping & OrderShield Real-time Verification */}
        <div className="lg:col-span-7 space-y-6">
          {/* Shipping Address Inputs */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-600" />
              1. Delivery Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Full Name
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.fullName}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.streetLine}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, streetLine: e.target.value })}
                  placeholder="Enter destination street address"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apartment / Suite / Unit
                </label>
                <input
                  type="text"
                  value={shippingAddress.unit}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, unit: e.target.value })}
                  placeholder="e.g. Apt 4B"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Postal / ZIP Code
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.postalCode}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* 10-Minute Anti-Spam Rejection Cooldown Alert Banner */}
          {cooldown.active && (
            <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-300 space-y-2 text-rose-950 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <span>⛔ 10-Minute Protection Cooldown Active</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                Homeowner <strong>{cooldown.ownerEmail || 'Dhevesh'}</strong> recently declined delivery to this address. To protect homeowner peace and prevent notification spam, new order requests to this address are locked for another <strong className="font-mono text-rose-900 bg-rose-200/80 px-2 py-0.5 rounded font-bold">{Math.floor(cooldown.remainingSeconds / 60)}m {cooldown.remainingSeconds % 60}s</strong>.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-medium pt-1">
                <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>No notifications will be dispatched to the homeowner during this cooldown. Please change your delivery address or wait.</span>
              </div>
            </div>
          )}

          {/* REAL-TIME OrderShield Address Verification Card */}
          {addressEvaluation && (
            <div
              className={`rounded-3xl p-6 border transition-all ${
                cooldown.active
                  ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                  : addressEvaluation.type === 'STRANGER'
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : addressEvaluation.type === 'OWNER'
                  ? 'bg-teal-50/80 border-teal-300 text-teal-950'
                  : addressEvaluation.type === 'HOUSEHOLD'
                  ? 'bg-sky-50/80 border-sky-300 text-sky-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {cooldown.active ? (
                  <Lock className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                ) : addressEvaluation.type === 'STRANGER' ? (
                  <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-teal-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h3 className="text-sm font-bold">
                    {cooldown.active ? '⛔ Delivery Locked by Homeowner' : addressEvaluation.title}
                  </h3>
                  <p className="text-xs leading-relaxed opacity-90">
                    {cooldown.active
                      ? `This address is protected and temporarily locked due to a recent homeowner decline. Cooldown active for another ${Math.floor(cooldown.remainingSeconds / 60)}m ${cooldown.remainingSeconds % 60}s.`
                      : addressEvaluation.description}
                  </p>
                  <div className="pt-2 text-[11px] font-mono opacity-75">
                    Logged in as: <span className="font-bold">{user?.fullName} ({user?.email})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-600" />
              2. Demonstration Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'DEMO_CARD'
                    ? 'border-teal-500 bg-teal-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'DEMO_CARD'}
                  onChange={() => setPaymentMethod('DEMO_CARD')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Safe Demo Payment</span>
                  <span className="text-[11px] text-slate-500">Instant test authorization (no real card charged)</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-teal-500 bg-teal-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Cash on Delivery</span>
                  <span className="text-[11px] text-slate-500">Pay courier upon verified doorstep receipt</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Items Summary & Place Order CTA */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
            Order Review ({items.length} items)
          </h2>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
            {items.map((i) => (
              <div key={i.product.id} className="py-3 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={i.product.imageUrl}
                    alt={i.product.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/products/camera.jpg';
                    }}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 line-clamp-1">{i.product.name}</span>
                    <span className="text-slate-400">Qty: {i.quantity} × {formatPrice(i.product.price)}</span>
                  </div>
                </div>
                <span className="font-bold text-slate-900 shrink-0">
                  {formatPrice(i.product.price * i.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Insured Shipping</span>
              <span className="font-semibold text-slate-900">
                {shipping === 0 ? <span className="text-teal-600 font-bold">FREE</span> : formatPrice(shipping)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>OrderShield Address Protection</span>
              <span className="font-semibold text-teal-600">Active (₹0)</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-extrabold text-slate-900">
              <span>Total Amount</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || cooldown.active}
            className={`w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm shadow-md transition-all active:scale-98 ${
              cooldown.active
                ? 'bg-rose-100 text-rose-700 border-2 border-rose-300 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-teal-600 text-white disabled:opacity-50 cursor-pointer'
            }`}
          >
            {cooldown.active ? (
              <>
                <Lock className="w-4 h-4 text-rose-600" />
                <span>
                  Delivery Blocked by Homeowner (Cooldown: {Math.floor(cooldown.remainingSeconds / 60)}:{(cooldown.remainingSeconds % 60).toString().padStart(2, '0')})
                </span>
              </>
            ) : isSubmitting ? (
              'Verifying & Placing Order...'
            ) : (
              <>
                Confirm & Place Order
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            By clicking Confirm, you agree to OrderShield terms. Delivery to protected addresses requires owner authorization if placed by non-household members.
          </p>
        </div>
      </form>

      {/* OrderShield OTP Verification Modal */}
      {otpModal && (
        <Modal
          isOpen={otpModal.isOpen}
          onClose={() => {
            if (otpModal.status === 'APPROVED') {
              clearCart();
              navigate(`/orders/${otpModal.orderId}`);
            } else {
              setOtpModal(null);
            }
          }}
          title="🛡️ OrderShield Protection: Delivery Authorization"
          maxWidth="max-w-lg"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Order Number:</span>
                <span className="font-mono font-bold text-slate-800">{otpModal.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Protected Address Owner:</span>
                <span className="font-bold text-slate-800">{otpModal.ownerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Owner Phone Notification:</span>
                <span className="font-mono font-semibold text-teal-700">{otpModal.ownerPhoneMasked}</span>
              </div>
            </div>

            {/* Step 1: PENDING Homeowner Decision */}
            {otpModal.status === 'PENDING' && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto mb-2 shadow-xs animate-pulse">
                    <KeyRound className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Step 1: Awaiting Homeowner Decision
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    This address is protected by <strong className="text-slate-800">{otpModal.ownerName}</strong> ({otpModal.ownerPhoneMasked}). Homeowner must click <strong className="text-emerald-700 font-bold">Allow</strong> in their notification before the 6-digit OTP is generated.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3 shadow-2xs">
                  <RotateCw className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                  <div className="leading-relaxed">
                    <strong>Security alert dispatched to {otpModal.ownerName}.</strong> Please tell {otpModal.ownerName} to check their notification bell and click <strong>Allow</strong>.
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="opacity-75">
                    <label className="block text-xs font-bold text-slate-500 mb-2 text-center">
                      6-Digit Delivery OTP (Unlocks once homeowner allows)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        placeholder="Waiting for homeowner to click Allow..."
                        className="w-full text-center text-sm font-sans py-3.5 px-4 rounded-2xl border-2 border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed shadow-inner"
                      />
                      <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[11px] text-slate-400 text-center mt-1.5">
                      Once {otpModal.ownerName} clicks Allow, this window will automatically unlock for entering the OTP sent to their phone.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-4 bg-slate-100 text-slate-400 border border-slate-200 font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-not-allowed shadow-xs"
                  >
                    <RotateCw className="w-4 h-4 animate-spin text-slate-400" />
                    <span>Awaiting Homeowner Approval (Ask {otpModal.ownerName} to click Allow)...</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: OTP_SENT - Homeowner has approved! */}
            {otpModal.status === 'OTP_SENT' && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Step 2: Homeowner Allowed! Enter OTP
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    <strong className="text-emerald-700">{otpModal.ownerName}</strong> has ALLOWED delivery! A 6-digit verification OTP was sent to their phone (<strong className="text-slate-800">{otpModal.ownerPhoneMasked}</strong>).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ask {otpModal.ownerName} for the 6-digit phone OTP and enter it below to complete your order:</span>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
                      Enter 6-Digit Delivery OTP (Received on Homeowner's Phone)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="3 2 7 1 1 2"
                        value={otpModal.otpInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setOtpModal(prev => prev ? { ...prev, otpInput: val, error: null } : null);
                        }}
                        className="w-full text-center tracking-[0.25em] text-xl font-mono font-bold py-3.5 px-4 rounded-2xl border-2 border-teal-500 bg-white shadow-inner focus:outline-none focus:ring-4 focus:ring-teal-100"
                        autoFocus
                      />
                      <KeyRound className="w-5 h-5 text-teal-500 absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
                    </div>
                    <p className="text-[11px] text-slate-400 text-center mt-1.5">
                      Type the 6-digit verification OTP received on {otpModal.ownerName}'s phone to complete your order.
                    </p>
                  </div>

                  {otpModal.error && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{otpModal.error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={otpModal.verifying || otpModal.otpInput.length < 6}
                    className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {otpModal.verifying ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Verifying OTP Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify OTP & Complete Order</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* State: REJECTED */}
            {otpModal.status === 'REJECTED' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-16 h-16 rounded-3xl bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center mx-auto">
                  <X className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Delivery Authorization Declined
                  </h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                    Verified address owner <span className="font-semibold text-slate-800">{otpModal.ownerName}</span> has rejected this delivery request. The order has been cancelled and will not be dispatched.
                  </p>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium max-w-sm mx-auto">
                    ⛔ <strong>10-Minute Cooldown Activated:</strong> To protect homeowner peace and prevent notification spam, further delivery requests to this address are locked for 10 minutes.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpModal(null);
                    setCooldown(getActiveCooldown(
                      shippingAddress.streetLine,
                      shippingAddress.unit,
                      shippingAddress.city,
                      shippingAddress.postalCode
                    ));
                  }}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer"
                >
                  Close & Modify Shipping Address
                </button>
              </div>
            )}

            {/* State: APPROVED */}
            {otpModal.status === 'APPROVED' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-emerald-950">
                    OTP Verified Successfully!
                  </h3>
                  <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                    Order authorization confirmed. Dispatch unblocked! Redirecting to your receipt...
                  </p>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
