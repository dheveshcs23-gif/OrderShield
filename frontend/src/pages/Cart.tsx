import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { formatPrice } from '../utils/formatters';

export const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart, subtotal, shipping, grandTotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Looks like you haven't added any products yet. Browse our secure hardware and electronics catalogue.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-md transition-all"
        >
          Explore Catalogue
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const freeShippingThreshold = 999;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
        </h1>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
        >
          Clear Cart
        </button>
      </div>

      {/* Free Shipping Progress */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
          <span className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-teal-600" />
            {subtotal >= freeShippingThreshold ? (
              <span className="text-teal-700 font-bold">You qualify for FREE Insured Shipping! 🎉</span>
            ) : (
              <span>Add {formatPrice(freeShippingThreshold - subtotal)} more for FREE Insured Shipping</span>
            )}
          </span>
          <span>{progressPercent.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-teal-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
          {items.map((item) => (
            <div key={item.product.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/products/camera.jpg';
                  }}
                  className="w-20 h-20 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                />
                <div>
                  <Link
                    to={`/products/${item.product.id}`}
                    className="font-bold text-slate-900 hover:text-teal-700 text-sm line-clamp-1"
                  >
                    {item.product.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">
                      Unit Price: <span className="font-semibold text-slate-800">{formatPrice(item.product.price)}</span>
                    </span>
                    {item.product.markedPrice && item.product.markedPrice > item.product.price && (
                      <span className="text-xs text-slate-400 line-through">
                        {formatPrice(item.product.markedPrice)}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-medium mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Protected Delivery Eligible
                  </span>
                </div>
              </div>

              {/* Quantity Stepper & Subtotal */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="p-1.5 text-slate-600 hover:bg-slate-200"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-900 bg-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stockQuantity}
                    className="p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[80px]">
                  <span className="text-sm font-bold text-slate-900 block">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">
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
              <span className="font-semibold text-teal-600">Included (₹0)</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-extrabold text-slate-900">
              <span>Total</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-teal-600 text-white font-bold text-sm shadow-md transition-all active:scale-98"
          >
            Proceed to Checkout
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">🛡️ OrderShield Protection at Checkout:</p>
            <p>
              Your delivery address will be verified against homeowner records in real time before dispatch authorization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
