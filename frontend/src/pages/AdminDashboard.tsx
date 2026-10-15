import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Order, Product, AuditLog } from '../types';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ShieldAlert,
  Truck,
  CheckCircle2,
  Package,
  Layers,
  History,
  Lock,
  AlertCircle,
  Plus,
  Search,
  Trash2
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'audit'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [auditSuccess, setAuditSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordList, prodList, auditList] = await Promise.all([
        api.orders.getAllOrders(),
        api.products.getAll(),
        api.security.getAuditLogs(),
      ]);
      setOrders(ordList);
      setProducts(prodList);
      setAuditLogs(auditList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDispatch = async (order: Order) => {
    if (!user) return;
    try {
      await api.orders.dispatchOrder(order.id, user.email);
      setDispatchSuccess(`Order #${order.orderNumber} dispatched to carrier successfully!`);
      setTimeout(() => setDispatchSuccess(null), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStockUpdate = async (productId: number, currentStock: number, delta: number) => {
    try {
      const nextStock = Math.max(0, currentStock + delta);
      await api.products.updateStock(productId, nextStock);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAuditLog = async (logId: number) => {
    try {
      await api.security.deleteAuditLog(logId);
      setAuditLogs((prev) => prev.filter((l) => l.id !== logId));
      setAuditSuccess('Audit log entry deleted successfully.');
      setTimeout(() => setAuditSuccess(null), 3000);
      window.dispatchEvent(new Event('ordershield_update'));
    } catch (err: any) {
      alert(err.message || 'Failed to delete audit log');
    }
  };

  const handleClearAllAuditLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all security audit logs? This action is permanent.')) return;
    try {
      await api.security.clearAuditLogs(user?.email);
      setAuditLogs([]);
      setAuditSuccess('All audit logs have been cleared.');
      setTimeout(() => setAuditSuccess(null), 3000);
      window.dispatchEvent(new Event('ordershield_update'));
    } catch (err: any) {
      alert(err.message || 'Failed to clear audit logs');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Admin Permissions Required</h2>
        <p className="text-xs text-slate-500">
          This dashboard is restricted to system administrators with dispatch authority.
        </p>
        <p className="text-xs font-semibold text-teal-600">
          Tip: Click <strong>⚙️ Admin</strong> in the top testing bar to access this screen immediately!
        </p>
      </div>
    );
  }

  const pendingBlocks = orders.filter((o) => o.isDispatchBlocked).length;
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const dispatchedOrders = orders.filter((o) => o.status === 'DISPATCHED' || o.status === 'DELIVERED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
            <Lock className="w-3.5 h-3.5" /> OrderShield Operations & Dispatch Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrator Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enforce dispatch safety, monitor real-time security blocks, and update warehouse stock.
          </p>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Operator: {user?.email}
        </span>
      </div>

      {dispatchSuccess && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{dispatchSuccess}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <span className="text-xs font-medium text-slate-500">Total System Orders</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{orders.length}</span>
            <Package className="w-6 h-6 text-slate-400" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <span className="text-xs font-medium text-slate-500">Dispatch-Blocked Orders</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-amber-600">{pendingBlocks}</span>
            <ShieldAlert className="w-6 h-6 text-amber-500" />
          </div>
          <span className="text-[11px] text-amber-700 block">Pending OrderShield check</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <span className="text-xs font-medium text-slate-500">Dispatched Packages</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-teal-600">{dispatchedOrders}</span>
            <Truck className="w-6 h-6 text-teal-500" />
          </div>
          <span className="text-[11px] text-teal-700 block">Released after verification</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <span className="text-xs font-medium text-slate-500">Total Store Volume</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-slate-900">${totalRevenue.toFixed(2)}</span>
            <Layers className="w-6 h-6 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Order Dispatch Control ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Inventory Stock ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          System Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Orders Dispatch Management Table */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Dispatch Authorization Queue</h3>
            <span className="text-xs text-slate-400">Strict Server-Enforced Policy</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Dispatch Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => {
                  const canDispatch =
                    !ord.isDispatchBlocked &&
                    (ord.status === 'PROCESSING' || ord.status === 'AUTHORIZATION_APPROVED');

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{ord.userName}</span>
                        <span className="text-slate-400 text-[11px]">{ord.userEmail}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {ord.shippingAddress.streetLine}, {ord.shippingAddress.city}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ${ord.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ord.status} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        {ord.isDispatchBlocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200" title={ord.dispatchBlockedReason}>
                            <Lock className="w-3 h-3 text-rose-600" /> BLOCKED
                          </span>
                        ) : ord.status === 'DISPATCHED' ? (
                          <span className="text-teal-700 font-semibold text-[11px]">Dispatched</span>
                        ) : (
                          <span className="text-blue-700 font-semibold text-[11px]">Eligible</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ord.status === 'DISPATCHED' ? (
                          <span className="text-xs text-slate-400 font-medium">Completed</span>
                        ) : (
                          <button
                            onClick={() => handleDispatch(ord)}
                            disabled={!canDispatch}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              canDispatch
                                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-xs active:scale-95'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            }`}
                            title={
                              !canDispatch
                                ? 'SECURITY LOCK: Cannot dispatch order while OrderShield authorization is pending or rejected.'
                                : 'Dispatch order to carrier'
                            }
                          >
                            <span className="flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5" /> Dispatch
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Inventory Management */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Product Inventory Stock Levels</h3>
            <span className="text-xs text-slate-400">Real-time Stock Allocation</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock Quantity</th>
                  <th className="py-3 px-4 text-right">Quick Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{p.sku}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500">{p.category.name}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">${p.price.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md ${
                          p.stockQuantity < 10
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {p.stockQuantity} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleStockUpdate(p.id, p.stockQuantity, 10)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
                      >
                        +10 Units
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                Comprehensive Platform Security Audit Logs
              </h3>
              <span className="text-xs text-slate-400">System Governance & Audit Trail</span>
            </div>
            <button
              type="button"
              onClick={handleClearAllAuditLogs}
              disabled={auditLogs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Clear All Logs
            </button>
          </div>

          {auditSuccess && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 font-semibold">
              {auditSuccess}
            </div>
          )}

          {auditLogs.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <History className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Security Audit Logs</p>
              <p className="text-xs text-slate-400">The audit trail is currently empty or has been cleared.</p>
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
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {log.actorEmail}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono">
                        {log.resourceType}:{log.resourceId}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
