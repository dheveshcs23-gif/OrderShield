/**
 * Utility functions for currency and price formatting in Indian Rupees (₹).
 */

/**
 * Formats a number into Indian Rupee currency format (₹).
 * Examples:
 *   4999 -> "₹4,999"
 *   74999 -> "₹74,999"
 *   2499.5 -> "₹2,499.50"
 */
export const formatPrice = (amount?: number | null): string => {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  const hasDecimals = amount % 1 !== 0;
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Calculates discount percentage between marked price and selling price.
 * Example: (7999, 4999) -> 38
 */
export const calculateDiscount = (markedPrice?: number, sellingPrice?: number): number => {
  if (!markedPrice || !sellingPrice || markedPrice <= sellingPrice) return 0;
  return Math.round(((markedPrice - sellingPrice) / markedPrice) * 100);
};

/**
 * Calculates total savings (marked price - selling price)
 */
export const calculateSavings = (markedPrice?: number, sellingPrice?: number): number => {
  if (!markedPrice || !sellingPrice || markedPrice <= sellingPrice) return 0;
  return markedPrice - sellingPrice;
};
