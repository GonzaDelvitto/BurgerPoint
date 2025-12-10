// funcionesCarrito.js

export function addToCart(cart, product, opts = {}) {
  // opts: { medallones: 1, medallonesPrecio, extras: [], tamaño, tamañoPrecio, aderezos: [] }

  const existing = cart.find(
    i => i.id === product.id && JSON.stringify(i.opts) === JSON.stringify(opts)
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      img: product.img,
      categoria: product.categoria,  // Para diferenciar papas y hamburguesas
      qty: 1,
      opts,
    });
  }

  return cart;
}

export function updateQty(cart, index, qty) {
  if (qty <= 0) {
    cart.splice(index, 1); // eliminar ítem si qty <= 0
  } else {
    cart[index].qty = qty;
  }
  return cart;
}

export function calcTotals(cart, cashDiscountPercent = 5) {
  let subtotal = 0;

  for (const it of cart) {
    if (it.categoria === 'papas') {
      // Para papas: precio base + tamaño + aderezos
      const tamañoPrecio = it.opts?.tamañoPrecio || 0;
      const aderezos = it.opts?.aderezos || [];
      const aderezosTotal = aderezos.reduce((sum, a) => sum + (a.price || 0), 0);

      const unitPrice = it.precio + tamañoPrecio + aderezosTotal;
      subtotal += unitPrice * it.qty;
    } else {
      // Para hamburguesas: usamos el precio real de los medallones que guardamos en opts
      const medallonesPrecio = it.opts?.medallonesPrecio ?? it.precio;
      const extrasTotal = (it.opts?.extras || []).reduce((sum, ex) => sum + (ex.price || 0), 0);

      const unitPrice = medallonesPrecio + extrasTotal;
      subtotal += unitPrice * it.qty;
    }
  }

  const discount = cashDiscountPercent
    ? (subtotal * cashDiscountPercent) / 100
    : 0;

  const total = subtotal - discount;

  return { subtotal, discount, total };
}
