import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import {
  ShieldCheck,
  Star,
  ShoppingCart,
  ArrowLeft,
  Truck,
  RotateCcw,
  Check,
  Package
} from 'lucide-react';
import { formatPrice, calculateDiscount, calculateSavings } from '../utils/formatters';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('/products/camera.jpg');

  useEffect(() => {
    if (product?.imageUrl) {
      setImgSrc(product.imageUrl);
    }
  }, [product?.imageUrl]);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api.products.getById(Number(id));
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded-md w-48 mx-auto" />
        <div className="h-96 bg-slate-200 rounded-2xl max-w-xl mx-auto" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-500">The product you are looking for does not exist or has been removed.</p>
        <button
          onClick={() => navigate('/products')}
          className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
        >
          Return to Catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/products" className="hover:text-teal-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
        </Link>
        <span>/</span>
        <span className="text-slate-400">{product.category.name}</span>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate">{product.name}</span>
      </div>

      {/* Main Product Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs">
        {/* Product Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-square border border-slate-200">
            <img
              src={imgSrc}
              alt={product.name}
              onError={() => setImgSrc('/products/camera.jpg')}
              className="w-full h-full object-cover object-center"
            />
            {product.stockQuantity < 10 && product.stockQuantity > 0 && (
              <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-md">
                Only {product.stockQuantity} remaining
              </span>
            )}
          </div>
        </div>

        {/* Product Info & Purchase Options */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              <span>SKU: {product.sku}</span>
              <span>•</span>
              <span>{product.category.name}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {product.name}
            </h1>

            {/* Rating Stars */}
            <div className="flex items-center gap-2 text-sm text-amber-500">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 fill-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-slate-800">{product.rating}</span>
              <span className="text-slate-400 text-xs">({product.reviewCount} customer reviews)</span>
            </div>

            {/* Price */}
            <div className="pt-2 space-y-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {formatPrice(product.price)}
                </span>
                {product.markedPrice && product.markedPrice > product.price && (
                  <>
                    <span className="text-xl text-slate-400 line-through font-medium">
                      {formatPrice(product.markedPrice)}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {calculateDiscount(product.markedPrice, product.price)}% OFF
                    </span>
                  </>
                )}
              </div>
              {product.markedPrice && product.markedPrice > product.price && (
                <p className="text-xs font-semibold text-emerald-600">
                  You save {formatPrice(calculateSavings(product.markedPrice, product.price))} ({calculateDiscount(product.markedPrice, product.price)}% discount)
                </p>
              )}
              <span className="text-xs text-slate-500 block pt-1">
                Taxes included. Free insured delivery on orders over ₹999.
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed pt-2">
              {product.description}
            </p>

            {/* OrderShield Delivery Protection Box */}
            <div className="rounded-2xl bg-teal-50/70 border border-teal-200/80 p-4 space-y-2">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                OrderShield Delivery Guarantee
              </div>
              <p className="text-xs text-teal-800 leading-relaxed">
                If shipped to an address protected under OrderShield, unauthorized accounts must undergo verified homeowner authorization before dispatch. Package intercepts and address impersonation are completely mitigated.
              </p>
            </div>
          </div>

          {/* Quantity & Add to Cart Controls */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-700">Quantity</span>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-bold text-slate-900 bg-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-500">
                ({product.stockQuantity} in stock)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-teal-600 text-white font-bold text-sm shadow-md transition-all active:scale-98 disabled:bg-slate-200 disabled:text-slate-400"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart • {formatPrice(product.price * quantity)}
              </button>

              <button
                onClick={() => {
                  addToCart(product, quantity);
                  navigate('/checkout');
                }}
                disabled={product.stockQuantity === 0}
                className="px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>

            {addedToast && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-between animate-fade-in">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Added {quantity} item(s) to your cart!
                </span>
                <Link to="/cart" className="underline hover:text-emerald-900 font-bold">
                  View Cart
                </Link>
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-600" />
                <span>Insured Rapid Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-teal-600" />
                <span>30-Day Return Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
