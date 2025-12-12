// funcionesCarrito.js

// Agregar al carrito
export function addToCart(cart, product, opts = {}) {
  // opts solo describe las opciones elegidas, no deben recalcular precio
  const existing = cart.find(
    i => i.id === product.id && JSON.stringify(i.opts) === JSON.stringify(opts)
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,   // PRECIO FINAL POR UNIDAD (calculo del modal)
      img: product.img,
      categoria: product.categoria,
      qty: 1,
      opts,                     // Solo descripción de opciones
    });
  }

  return cart;
}

// Actualizar cantidad
export function updateQty(cart, index, qty) {
  if (qty <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].qty = qty;
  }
  return cart;
}

// Calcular totales
export function calcTotals(cart, cashDiscountPercent = 5) {

  // AHORA NO SE RECALCULA NADA, SOLO SE USA EL PRECIO FINAL POR UNIDAD
  const subtotal = cart.reduce((sum, item) => {
    return sum + (item.precio * item.qty);
  }, 0);

  const discount = cashDiscountPercent
    ? (subtotal * cashDiscountPercent) / 100
    : 0;

  const total = subtotal - discount;

  return { subtotal, discount, total };
}
