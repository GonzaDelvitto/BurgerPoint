export function addToCart(cart, product, opts = {}) {
  // opts: { medallones: 1, extras: [], tamaño, tamañoPrecio, aderezos: [] }

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
      categoria: product.categoria,  // Importante para diferenciar papas y hamburguesas
      qty: 1,
      opts,
    });
  }

  return cart;
}

export function updateQty(cart, index, qty) {
  if (qty <= 0) {
    cart.splice(index, 1); // elimina ítem
  } else {
    cart[index].qty = qty;
  }
  return cart;
}

export function calcTotals(cart, cashDiscountPercent = 5) {
  let subtotal = 0;

  for (const it of cart) {
    if (it.categoria === 'papas') {
      // Para papas sumamos precio base + tamaño + aderezos, luego por cantidad
      const tamañoPrecio = it.opts?.tamañoPrecio || 0;
      const aderezos = it.opts?.aderezos || [];
      const aderezosTotal = aderezos.reduce((sum, a) => sum + (a.price || 0), 0);

      const unitPrice = it.precio + tamañoPrecio + aderezosTotal;
      subtotal += unitPrice * it.qty;
    } else {
      // Para hamburguesas: precio base * qty * medallones + extras * qty
      const medallones = it?.opts?.medallones ?? 1;
      subtotal += it.precio * it.qty * medallones;

      if (it?.opts?.extras?.length) {
        for (const ex of it.opts.extras) {
          subtotal += (ex.price || 0) * it.qty;
        }
      }
    }
  }

  const discount = cashDiscountPercent
    ? (subtotal * cashDiscountPercent) / 100
    : 0;

  const total = subtotal - discount;

  return { subtotal, discount, total };
}
