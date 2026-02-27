export interface StripeLineItem {
  price_data: {
    currency: string;
    product_data: { name: string };
    unit_amount: number;
  };
  quantity: number;
}

/**
 * Stripe requires integer quantities. When the source quantity is fractional
 * (e.g. 1.5 hours), we fold it into unit_amount and set quantity to 1.
 */
export function normalizeLineItem(item: {
  price_data: {
    currency: string;
    product_data: { name: string };
    unit_amount: number;
  };
  quantity: number | string;
}): StripeLineItem {
  const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error(`Invalid quantity: ${item.quantity}`);
  }

  if (!Number.isInteger(qty)) {
    return {
      ...item,
      price_data: {
        ...item.price_data,
        unit_amount: Math.round(item.price_data.unit_amount * qty),
      },
      quantity: 1,
    };
  }

  return { ...item, quantity: qty };
}
