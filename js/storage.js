const CART_KEY = 'burgerpoint_cart';

export function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) return JSON.parse(raw);
    return [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
