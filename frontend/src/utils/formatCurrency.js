/**
 * Formats a number as currency (e.g., ₹1,000.00).
 * @param {number} amount - The amount to format.
 * @param {string} currency - The currency symbol (default: ₹).
 * @returns {string} - The formatted currency string.
 */
export default function formatCurrency(amount, currency = '₹') {
    if (isNaN(amount)) return `${currency}0.00`;
    return `${currency}${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  }