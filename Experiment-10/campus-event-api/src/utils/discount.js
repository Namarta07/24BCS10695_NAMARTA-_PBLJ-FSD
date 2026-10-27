const AppError = require('./AppError');

const VALID_DISCOUNT_CODES = ['CAMPUS50', 'EARLYBIRD'];
const EARLYBIRD_FLAT_OFF = 100;

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
}

function normalizeDiscountCode(discountCode) {
  if (discountCode === undefined || discountCode === null) return undefined;

  if (typeof discountCode !== 'string') {
    throw new AppError(400, 'Invalid discount code');
  }

  const code = discountCode.trim().toUpperCase();
  if (code === '') return undefined;

  if (!VALID_DISCOUNT_CODES.includes(code)) {
    throw new AppError(400, 'Invalid discount code');
  }
  return code;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function calculateFinalAmount(ticketPrice, discountCode) {
  const code = normalizeDiscountCode(discountCode);
  const price = toNumber(ticketPrice);

  if (!Number.isFinite(price) || price < 0) {
    return { code, finalAmount: undefined };
  }

  let finalAmount = price;
  if (code === 'CAMPUS50') {
    finalAmount = price * 0.5;
  } else if (code === 'EARLYBIRD') {
    finalAmount = Math.max(price - EARLYBIRD_FLAT_OFF, 0);
  }

  return { code, finalAmount: round2(finalAmount) };
}

module.exports = { VALID_DISCOUNT_CODES, normalizeDiscountCode, calculateFinalAmount };
