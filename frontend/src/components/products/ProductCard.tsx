import React from 'react';
import { Product } from '../../types';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatPrice, calculateDiscount } from '../../utils/formatters';

interface Props {
  product: Product;
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const { addToCart } = useCart();
  const [imgSrc, setImgSrc] = React.useState(product.imageUrl || '/products/camera.jpg');

  React.useEffect(() => {
    setImgSrc(product.imageUrl || '/products/camera.jpg');
  }, [product.imageUrl]);

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200">
      {/* Product Image */}
      <Link to={`/products/${product.id}`} className="relative block overflow-hidden bg-slate-100 aspect-square">
        <img
          src={imgSrc}
          alt={product.name}
          onError={() => setImgSrc('/products/camera.jpg')}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Category Pill */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-medium tracking-wide">
          {product.category.name}
        </span>
        {/* Stock Badge */}
        {product.stockQuantity < 10 && product.stockQuantity > 0 && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-500/90 text-white text-[11px] font-semibold tracking-wide">
            Only {product.stockQuantity} left
          </span>
        )}
      </Link>

      {/* Product Information */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-1.5 text-xs text-amber-500 mb-1.5">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(product.rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-200 fill-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="font-semibold text-slate-700">{product.rating}</span>
          <span className="text-slate-400">({product.reviewCount})</span>
        </div>

        <Link
          to={`/products/${product.id}`}
          className="font-semibold text-slate-900 hover:text-teal-700 transition-colors line-clamp-1 mb-1.5 text-base"
        >
          {product.name}
        </Link>

        <p className="text-slate-500 text-xs line-clamp-2 mb-4 flex-1">
          {product.description}
        </p>

        {/* Security Feature indicator */}
        <div className="flex items-center gap-1.5 text-[11px] text-teal-700 font-medium bg-teal-50/70 border border-teal-100/80 rounded-lg px-2.5 py-1 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>Protected by OrderShield Verified Delivery</span>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.markedPrice && product.markedPrice > product.price && (
                <span className="text-xs text-slate-400 line-through font-normal">
                  {formatPrice(product.markedPrice)}
                </span>
              )}
            </div>
            {product.markedPrice && product.markedPrice > product.price && (
              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {calculateDiscount(product.markedPrice, product.price)}% OFF
              </span>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            disabled={product.stockQuantity === 0}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              product.stockQuantity === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-teal-600 text-white shadow-xs hover:shadow-teal-600/20 active:scale-95'
            }`}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
