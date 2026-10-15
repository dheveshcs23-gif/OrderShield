import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  ShoppingCart,
  Bell,
  User as UserIcon,
  Search,
  Menu,
  X,
  Lock,
  Users,
  LogOut,
  ChevronDown,
  Check,
  Smartphone,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../api/client';
import { Modal } from '../common/Modal';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { notifications, unreadCount, markAsRead, deleteNotification, clearAll, refresh } = useNotifications();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [dropdownActionMsg, setDropdownActionMsg] = useState<string | null>(null);
  const [dropdownSmsModal, setDropdownSmsModal] = useState<{
    phone: string;
    otp: string;
    title: string;
  } | null>(null);

  const handleDropdownAllow = async (e: React.MouseEvent, n: any) => {
    e.stopPropagation();
    if (!user || !n.relatedEntityId) return;
    try {
      const res = await api.security.allowRequest(n.relatedEntityId, user.email);
      markAsRead(n.id);
      setDropdownSmsModal({
        phone: res.ownerPhone || user.phone || '+91 8122936210',
        otp: res.otpCode,
        title: 'Delivery Authorization Allowed',
      });
      setDropdownActionMsg(`Allowed! OTP dispatched to ${res.ownerPhone}`);
      refresh();
      setTimeout(() => setDropdownActionMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to allow request');
    }
  };

  const handleDropdownReject = async (e: React.MouseEvent, n: any) => {
    e.stopPropagation();
    if (!user || !n.relatedEntityId) return;
    try {
      await api.security.rejectRequest(n.relatedEntityId, 'Declined by address owner', user.email);
      markAsRead(n.id);
      setDropdownActionMsg('Delivery declined and locked.');
      refresh();
      setTimeout(() => setDropdownActionMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm group-hover:bg-teal-500 transition-colors">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                Order<span className="text-teal-600">Shield</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 -mt-1">
                Secure Commerce
              </span>
            </div>
          </Link>

          {/* Desktop Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md mx-4 relative"
          >
            <input
              type="text"
              placeholder="Search cameras, biometric locks, headphones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-teal-600 transition-colors">
              Home
            </Link>
            <Link to="/products" className="hover:text-teal-600 transition-colors">
              Products
            </Link>
            <Link to="/security" className="flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-semibold transition-colors">
              <Lock className="w-4 h-4 text-teal-600" />
              OrderShield Security
            </Link>
            <Link to="/orders" className="hover:text-teal-600 transition-colors">
              My Orders
            </Link>
            {isAdmin && (
              <Link to="/admin" className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition-colors">
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-teal-600" />
                      Security & Activity Alerts
                    </h4>
                    <Link
                      to="/notifications"
                      onClick={() => setNotificationDropdownOpen(false)}
                      className="text-xs text-teal-600 hover:underline"
                    >
                      View all
                    </Link>
                  </div>

                  {dropdownActionMsg && (
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-800 text-[11px] font-semibold border-b border-emerald-100 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{dropdownActionMsg}</span>
                    </div>
                  )}

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-center text-slate-400">No alerts at this time</p>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors ${
                            !n.isRead ? 'bg-amber-50/70 border-l-4 border-amber-500' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div
                            onClick={() => {
                              markAsRead(n.id);
                              navigate('/notifications');
                              setNotificationDropdownOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <div className="font-semibold text-slate-900 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                {n.type === 'SECURITY_ALERT' ? '🛡️' : '📦'} {n.title}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {!n.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(n.id);
                                  }}
                                  className="p-1 text-slate-300 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                                  title="Delete notification"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-slate-600 mt-1 line-clamp-3 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Instant Allow / Reject Action Buttons right in the notification dropdown */}
                          {n.type === 'SECURITY_ALERT' && n.relatedEntityId && !n.title.includes('OTP') && !n.title.includes('Declined') && !n.title.includes('Verified') && !n.title.includes('Allowed') && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-200/50">
                              <button
                                type="button"
                                onClick={(e) => handleDropdownAllow(e, n)}
                                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Allow (Send OTP)
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDropdownReject(e, n)}
                                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    {notifications.length > 0 ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (user) {
                            await clearAll();
                            setDropdownActionMsg('All notifications cleared.');
                            setTimeout(() => setDropdownActionMsg(null), 3000);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    ) : (
                      <span className="text-slate-400">0 notifications</span>
                    )}
                    <Link
                      to="/notifications"
                      onClick={() => setNotificationDropdownOpen(false)}
                      className="text-teal-700 hover:underline font-bold"
                    >
                      Notification Center &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Dropdown SMS Dispatch Modal */}
            {dropdownSmsModal && (
              <Modal
                isOpen={true}
                onClose={() => setDropdownSmsModal(null)}
                title="📱 Phone Notification Dispatched"
              >
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-3">
                    <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                      <Smartphone className="w-5 h-5 text-teal-600" />
                      <span>SMS Alert Dispatched to Registered Phone</span>
                    </div>
                    <p className="text-xs text-slate-700">
                      The homeowner allowed this delivery! An encrypted verification OTP has been sent via SMS:
                    </p>
                    <div className="p-3 bg-white rounded-xl border border-teal-300 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Homeowner Phone</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{dropdownSmsModal.phone}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-teal-600 block">Security OTP Code</span>
                        <span className="font-mono font-extrabold text-teal-700 text-lg tracking-widest">{dropdownSmsModal.otp}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setDropdownSmsModal(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
                  >
                    Close Notification
                  </button>
                </div>
              </Modal>
            )}

            {/* Shopping Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Profile Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                    {user.fullName.charAt(0)}
                  </div>
                  <span className="hidden sm:inline max-w-[120px] truncate font-medium">
                    {user.fullName.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      Account Profile
                    </Link>

                    <Link
                      to="/security"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-teal-700 font-medium hover:bg-teal-50"
                    >
                      <Shield className="w-4 h-4 text-teal-600" />
                      Protected Addresses
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <ShoppingCart className="w-4 h-4 text-slate-400" />
                      Order History
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-purple-700 font-medium hover:bg-purple-50"
                      >
                        <Lock className="w-4 h-4 text-purple-600" />
                        Admin Controls
                      </Link>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-900"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </form>

            <nav className="flex flex-col space-y-2 pt-2 text-sm font-medium">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
              >
                Home
              </Link>
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
              >
                Products
              </Link>
              <Link
                to="/security"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg bg-teal-50 text-teal-800 font-semibold"
              >
                🛡️ OrderShield Address Security
              </Link>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
              >
                My Orders
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-semibold"
                >
                  ⚙️ Admin Management
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
