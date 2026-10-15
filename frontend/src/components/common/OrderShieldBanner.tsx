import React from 'react';
import { ShieldCheck, Users, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OrderShieldBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-6 md:p-8 shadow-lg border border-slate-700">
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            Address Defense Technology
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Your Home. Your Delivery. Your Permission.
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            OrderShield protects verified home addresses. When anyone outside your trusted household tries to place an order to your doorstep, dispatch is locked until you personally approve.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" /> Owner Instant Pass
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-400" /> Trusted Household Access
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" /> Zero-Trust Stranger Lock
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <Link
            to="/security"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm transition-all shadow-md hover:shadow-teal-500/25"
          >
            Security Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Subtle decorative background circles */}
      <div className="absolute -right-12 -top-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-48 -bottom-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};
