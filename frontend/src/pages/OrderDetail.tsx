import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Order } from '../types';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  MapPin,
  Lock,
  Package
} from 'lucide-react';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const justPlaced = (location.state as any)?.justPlaced;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api.orders.getOrderById(Number(id));
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded-md w-48 mx-auto" />
        <div className="h-64 bg-slate-200 rounded-3xl max-w-2xl mx-auto" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <Link to="/orders" className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/orders" className="hover:text-teal-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-800 font-bold">{order.orderNumber}</span>
      </div>

      {/* Header Info */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {order.orderNumber}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-slate-500">
            Placed on {new Date(order.createdAt).toLocaleString()} by {order.userName} ({order.userEmail})
          </p>
        </div>

        <div className="text-left md:text-right">
          <span className="text-xs text-slate-400 block">Total Amount</span>
          <span className="text-2xl font-extrabold text-slate-900">
            ${order.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* OrderShield Security Status Alert Banner */}
      {order.status === 'PENDING_SECURITY_AUTHORIZATION' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 space-y-4 text-amber-950 shadow-sm animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500 text-white shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">
                OrderShield Security Notice: Authorization Pending
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-amber-900">
                This order was addressed to a registered protected home address (<strong>{order.shippingAddress.streetLine}</strong>) by an account that is neither the verified owner nor an authorized household member.
              </p>
              <div className="bg-white/80 rounded-xl p-4 border border-amber-200 text-xs space-y-1.5 font-medium">
                <div className="flex items-center gap-2 text-rose-700 font-bold">
                  <Lock className="w-4 h-4" /> Dispatch Locked: Carrier delivery cannot proceed.
                </div>
                <p className="text-slate-600">
                  The verified homeowner has received an in-app security notification. Once the owner reviews and approves the request, this order will automatically unlock and proceed to fulfillment.
                </p>
                <div className="pt-2 flex items-center gap-2 text-slate-800">
                  <span className="text-xs font-bold">Testing Tip:</span>
                  <span className="text-xs">
                    Switch to <strong>👑 Dhevesh (Owner)</strong> in the top bar, then visit the{' '}
                    <Link to="/security" className="text-teal-700 font-bold underline">
                      Security Dashboard
                    </Link>{' '}
                    to approve or decline this request!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {order.status === 'AUTHORIZATION_APPROVED' && (
        <div className="bg-teal-50 border-2 border-teal-300 rounded-3xl p-6 text-teal-950 space-y-2 animate-fade-in">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-teal-600 shrink-0" />
            <h3 className="text-base font-bold">OrderShield Security Verified</h3>
          </div>
          <p className="text-xs text-teal-800 leading-relaxed pl-9">
            The verified address owner has approved this delivery request. The order is now moving into normal warehouse preparation and dispatch.
          </p>
        </div>
      )}

      {order.status === 'AUTHORIZATION_REJECTED' && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 text-rose-950 space-y-2 animate-fade-in">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <h3 className="text-base font-bold">Delivery Authorization Declined</h3>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed pl-9">
            The verified homeowner reviewed this request and rejected delivery to their address. This order is permanently cancelled and blocked from dispatch.
          </p>
        </div>
      )}

      {/* Fulfillment Progress Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900">Delivery Progression</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Step 1: Placed */}
          <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-1">
            <span className="text-xs font-bold text-teal-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" /> 1. Placed
            </span>
            <p className="text-[11px] text-slate-500">Order recorded in system</p>
          </div>

          {/* Step 2: Address Check */}
          <div
            className={`p-4 rounded-2xl border space-y-1 ${
              order.status === 'PENDING_SECURITY_AUTHORIZATION'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : order.status === 'AUTHORIZATION_REJECTED'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-teal-50/50 border-teal-200 text-teal-900'
            }`}
          >
            <span className="text-xs font-bold flex items-center gap-1.5">
              {order.status === 'PENDING_SECURITY_AUTHORIZATION' ? (
                <>
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" /> 2. Security Check (Pending)
                </>
              ) : order.status === 'AUTHORIZATION_REJECTED' ? (
                <>
                  <XCircle className="w-4 h-4 text-rose-600" /> 2. Security (Declined)
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> 2. Security Verified
                </>
              )}
            </span>
            <p className="text-[11px] opacity-75">
              {order.status === 'PENDING_SECURITY_AUTHORIZATION'
                ? 'Awaiting owner response'
                : order.status === 'AUTHORIZATION_REJECTED'
                ? 'Authorization denied by owner'
                : 'Approved or trusted member'}
            </p>
          </div>

          {/* Step 3: Dispatch */}
          <div
            className={`p-4 rounded-2xl border space-y-1 ${
              order.status === 'DISPATCHED' || order.status === 'DELIVERED'
                ? 'bg-teal-50/50 border-teal-200'
                : order.isDispatchBlocked
                ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Truck className="w-4 h-4" /> 3. Dispatch
            </span>
            <p className="text-[11px] text-slate-400">
              {order.isDispatchBlocked ? 'Locked by policy' : 'Carrier handoff'}
            </p>
          </div>

          {/* Step 4: Delivery */}
          <div
            className={`p-4 rounded-2xl border space-y-1 ${
              order.status === 'DELIVERED'
                ? 'bg-teal-50/50 border-teal-200'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Package className="w-4 h-4" /> 4. Delivery
            </span>
            <p className="text-[11px] text-slate-400">Doorstep drop-off</p>
          </div>
        </div>
      </div>

      {/* Grid: Items & Shipping Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
          <div className="p-6">
            <h3 className="text-base font-bold text-slate-900">Ordered Items</h3>
          </div>
          {order.items.map((item) => (
            <div key={item.id} className="p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={item.productImageUrl}
                  alt={item.productName}
                  className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.productName}</h4>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              <span className="font-bold text-slate-900 text-sm">
                ${item.subtotal.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Shipping Address info */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-teal-600" />
            Destination Address
          </h3>

          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900 text-sm">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.streetLine} {order.shippingAddress.unit}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
            <p className="pt-2 text-slate-400">Phone: {order.shippingAddress.phone}</p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Payment</span>
              <span className="font-semibold text-slate-900">Safe Demonstration</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>OrderShield Status</span>
              <span className="font-semibold text-teal-600">
                {order.isDispatchBlocked ? 'Dispatch Blocked' : 'Normal / Approved'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
