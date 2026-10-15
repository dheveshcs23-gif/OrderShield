import React from 'react';
import { Shield, Lock, Users, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 mt-20 border-t border-slate-800">
      {/* Security Feature Highlights Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Registered Address Defense</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Protects your home address against unauthorized purchases placed by non-household accounts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Household Permission Control</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Grant and revoke delivery permissions for family members seamlessly without unnecessary alerts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Zero-Dispatch Lock</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Pending orders cannot be dispatched until verified approval is recorded by the address owner.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white">
                Order<span className="text-teal-400">Shield</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              An independent, security-first e-commerce platform designed to prevent package delivery fraud and protect homeowner delivery privacy.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Explore Store</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/products" className="hover:text-teal-400 transition-colors">All Products</Link></li>
              <li><Link to="/products?category=home-security" className="hover:text-teal-400 transition-colors">Home Security Systems</Link></li>
              <li><Link to="/products?category=smart-home" className="hover:text-teal-400 transition-colors">Smart IoT & Gateways</Link></li>
              <li><Link to="/products?category=computing" className="hover:text-teal-400 transition-colors">Secure Hardware</Link></li>
            </ul>
          </div>

          {/* Security Features */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">OrderShield Technology</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/security" className="hover:text-teal-400 transition-colors">Protected Addresses</Link></li>
              <li><Link to="/security" className="hover:text-teal-400 transition-colors">Trusted Household Members</Link></li>
              <li><Link to="/security" className="hover:text-teal-400 transition-colors">Pending Authorizations</Link></li>
              <li><Link to="/security" className="hover:text-teal-400 transition-colors">Security Audit Logs</Link></li>
            </ul>
          </div>

          {/* Admin & Support */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Governance</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/admin" className="hover:text-teal-400 transition-colors">Admin Dispatch Center</Link></li>
              <li><Link to="/profile" className="hover:text-teal-400 transition-colors">User Account & Privacy</Link></li>
              <li><Link to="/orders" className="hover:text-teal-400 transition-colors">Order Tracking</Link></li>
              <li><span className="text-slate-500">API Documentation (Spring Boot /docs)</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} OrderShield Inc. Secure Home Delivery Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with Spring Boot 3 & React 19
          </p>
        </div>
      </div>
    </footer>
  );
};
