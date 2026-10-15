import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../data/mockData';
import { ProductCard } from '../components/products/ProductCard';
import { OrderShieldBanner } from '../components/common/OrderShieldBanner';

export const Home: React.FC = () => {
  const featuredProducts = MOCK_PRODUCTS.filter((p) => p.isFeatured).slice(0, 4);

  return (
    <div className="space-y-16 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            Next-Gen Delivery Address Protection
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
            The E-Commerce Store with <span className="text-teal-400">Home Address</span> Defense
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            Shop cutting-edge smart tech, security hardware, and electronics. Plus, protect your home address against unauthorized orders: only you and your authorized family members can ship to your door without explicit owner approval.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-md hover:shadow-teal-500/25 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              Browse Catalog
            </Link>
            <Link
              to="/security"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
            >
              <Lock className="w-4 h-4 text-teal-400" />
              How OrderShield Works
            </Link>
          </div>

          {/* Quick Proof Pills */}
          <div className="pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left max-w-2xl">
            <div>
              <span className="block text-2xl font-bold text-teal-400">100%</span>
              <span className="text-xs text-slate-400">Protected Address Match</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-teal-400">Zero</span>
              <span className="text-xs text-slate-400">Unauthorized Dispatches</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-teal-400">1-Click</span>
              <span className="text-xs text-slate-400">Household Permission</span>
            </div>
          </div>
        </div>

        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Featured Products */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Secure Store</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Security Hardware & Tech
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 group"
          >
            View all products
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Banner Component */}
      <OrderShieldBanner />

      {/* Category Grid */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Categories</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Shop by Category
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg group-hover:text-teal-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {cat.description}
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
                <span>Explore products</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works Explainer */}
      <section className="rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-12 shadow-xs">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Architecture & Protection</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            How OrderShield Address Verification Works
          </h2>
          <p className="text-slate-600 text-sm">
            Address fraud, package intercept scamming, and unauthorized deliveries are stopped at checkout through server-side verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base">Register Your Protected Address</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Verify your physical home address in the OrderShield dashboard. Our backend normalizes street names and hashes coordinates to prevent spelling discrepancies.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base">Invite Trusted Household Members</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Add family members or roommates by email. When active, they order freely to your home without triggering security alerts or interrupting your day.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base">Lock Dispatch on Foreign Orders</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If an unknown account ships to your door, the system creates an authorization request, notifies you instantly, and locks the order so it cannot be dispatched until you approve.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
