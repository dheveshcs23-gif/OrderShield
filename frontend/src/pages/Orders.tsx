import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { Package, ArrowRight, ShieldAlert, ShoppingBag } from 'lucide-react';
import { formatPrice } from '../utils/formatters';

export const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (!user) return;
      try {
        setLoading(true);
        const data = await api.orders.getMyOrders(user.id);
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded-md w-48 mx-auto" />
        <div className="h-40 bg-slate-200 rounded-2xl max-w-2xl mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Order History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track package delivery statuses and OrderShield verification logs for {user?.fullName}.
          </p>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
        >
          <ShoppingBag className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4 shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't placed any orders with this account yet. Try adding an item to your cart and completing checkout.
          </p>
          <Link
            to="/products"
            className="inline-block px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
          >
            Explore Catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {ord.orderNumber}
                  </span>
                  <StatusBadge status={ord.status} />
                  {ord.isDispatchBlocked && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                      <ShieldAlert className="w-3 h-3 text-rose-600" /> Dispatch Blocked
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                  <span>Placed on {new Date(ord.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>
                    Shipping to: {ord.shippingAddress.streetLine}, {ord.shippingAddress.city}
                  </span>
                  <span>•</span>
                  <span>{ord.items.length} item(s)</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-normal">Order Total</span>
                  <span className="text-base font-bold text-slate-900">
                    {formatPrice(ord.totalAmount)}
                  </span>
                </div>

                <Link
                  to={`/orders/${ord.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-teal-600 text-white text-xs font-semibold transition-colors"
                >
                  View Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
