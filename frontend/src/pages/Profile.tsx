import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Shield,
  Mail,
  Phone,
  Calendar,
  Lock,
  ArrowRight,
  LogOut,
  CheckCircle2
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">You are not signed in</h2>
        <Link to="/login" className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Customer Account & Security Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your account identity, security role, and protected address permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Account Details */}
        <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user.fullName}</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mt-1">
                {user.role}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Email Address</span>
                <span className="font-semibold text-slate-900">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Phone Number</span>
                <span className="font-semibold text-slate-900">{user.phone || 'Not provided'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Account Member Since</span>
                <span className="font-semibold text-slate-900">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' }) : 'Member'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <Link
              to="/security"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Shield className="w-4 h-4" />
              Manage Protected Addresses
            </Link>

            <Link
              to="/orders"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              Order History
            </Link>
          </div>
        </div>

        {/* Right Column: Security Status & Logout */}
        <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            OrderShield Protection Status
          </h3>

          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-2">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Real-Time Protection Active</span>
            </div>
            <p className="text-[11px] text-teal-700 leading-relaxed">
              Your deliveries are monitored by OrderShield. When registered addresses match checkout destinations, authorizations are enforced server-side.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700">Account Session</h4>
            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              Sign Out of OrderShield
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
