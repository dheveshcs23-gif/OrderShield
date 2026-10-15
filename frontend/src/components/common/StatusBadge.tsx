import React from 'react';
import { OrderStatus } from '../../types';
import { ShieldAlert, CheckCircle2, XCircle, Clock, Truck, PackageCheck, Ban } from 'lucide-react';

interface Props {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs font-semibold';

  switch (status) {
    case 'PENDING_SECURITY_AUTHORIZATION':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          Pending Security Approval
        </span>
      );
    case 'AUTHORIZATION_APPROVED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          Security Approved
        </span>
      );
    case 'AUTHORIZATION_REJECTED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Authorization Declined
        </span>
      );
    case 'PROCESSING':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          Processing
        </span>
      );
    case 'DISPATCHED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 ${sizeClasses}`}>
          <Truck className="w-3.5 h-3.5 text-indigo-600" />
          Dispatched
        </span>
      );
    case 'DELIVERED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses}`}>
          <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
          Delivered
        </span>
      );
    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <Ban className="w-3.5 h-3.5 text-slate-500" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
