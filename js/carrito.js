import { loadCart, saveCart } from './storage.js';
import { updateQty, calcTotals } from './funcionesCarrito.js';
import { formatCurrency, updateCartCount } from './ui.js';

const cartContainer = document.getElementById('cart-container');
const totalsEl = document.getElementById('totals');
const checkoutBtn = document.getElementById('checkout-btn');
const customerNameInput = document.getElementById('customer-name');
const customerAddressInput = document.getElementById('customer-address');
const paymentMethodSelect = document.getElementById('payment-method');

let cart = loadCart();

function renderCart() {
  cartContainer.innerHTML = '';

  if (cart.length === 0) {
    cartContainer.innerHTML = '<p>El carrito está vacío.</p>';
    totalsEl.innerHTML = '';
    updateCartCount(0);
    return;
  }

  cart.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'cart-item';

    if (item.categoria === 'papas') {
      // Papas con tamaño y aderezos
      const tamaño = item.opts?.tamaño || 'Chica';
      const tamañoPrecio = item.opts?.tamañoPrecio || 0;
      const aderezos = item.opts?.aderezos || [];

      const aderezosDesc = aderezos.length > 0
        ? aderezos.map(a => `${a.name} (+${formatCurrency(a.price)})`).join(', ')
        : 'Ninguno';

      // Precio unitario = base + tamañoPrecio + suma precios aderezos
      const aderezosPrecio = aderezos.reduce((sum, a) => sum + (a.price || 0), 0);
      const unitPrice = item.precio + tamañoPrecio + aderezosPrecio;

      div.innerHTML = `
        <img src="../${item.img}" alt="${item.nombre}" />
        <div class="cart-item-details">
          <h3>${item.nombre}</h3>
          <p>Tamaño: ${tamaño} (+${formatCurrency(tamañoPrecio)})</p>
          <p>Aderezos: ${aderezosDesc}</p>
          <p>Precio unitario ajustado: ${formatCurrency(unitPrice)}</p>
          <label>
            Cantidad:
            <input type="number" min="0" class="qty-input" data-index="${index}" value="${item.qty}" />
          </label>
          <button class="btn-remove" data-index="${index}">Eliminar</button>
        </div>
      `;
    } else {
      // Hamburguesas con medallones y extras
      const medallones = item.opts?.medallones || 1;
      const extras = item.opts?.extras || [];

      const extrasDesc = extras.length > 0
        ? extras.map(e => `${e.name} (+${formatCurrency(e.price)})`).join(', ')
        : 'Ninguno';

      const medallonesPriceExtra = medallones > 1 ? item.precio * (medallones - 1) : 0;
      const extrasPrice = extras.reduce((sum, ex) => sum + (ex.price || 0), 0);
      const unitPrice = item.precio + extrasPrice + medallonesPriceExtra;

      div.innerHTML = `
        <img src="../${item.img}" alt="${item.nombre}" />
        <div class="cart-item-details">
          <h3>${item.nombre}</h3>
          <p>Medallones: ${medallones} (Extra: ${formatCurrency(medallonesPriceExtra)})</p>
          <p>Extras: ${extrasDesc}</p>
          <p>Precio unitario ajustado: ${formatCurrency(unitPrice)}</p>
          <label>
            Cantidad:
            <input type="number" min="0" class="qty-input" data-index="${index}" value="${item.qty}" />
          </label>
          <button class="btn-remove" data-index="${index}">Eliminar</button>
        </div>
      `;
    }

    cartContainer.appendChild(div);
  });

  updateTotals();
  updateCartCount(cart.reduce((acc, i) => acc + i.qty, 0));
}

function updateTotals() {
  const paymentMethod = paymentMethodSelect.value;
  const cashDiscount = paymentMethod === 'efectivo' ? 5 : 0;
  const { subtotal, discount, total } = calcTotals(cart, cashDiscount);

  totalsEl.innerHTML = `
    <p>Subtotal: ${formatCurrency(subtotal)}</p>
    <p>Descuento: ${formatCurrency(discount)}</p>
    <p><strong>Total: ${formatCurrency(total)}</strong></p>
  `;
}

cartContainer.addEventListener('input', e => {
  if (e.target.classList.contains('qty-input')) {
    const index = parseInt(e.target.dataset.index, 10);
    const qty = parseInt(e.target.value, 10);
    if (!isNaN(index) && !isNaN(qty)) {
      cart = updateQty(cart, index, qty);
      saveCart(cart);
      renderCart();
    }
  }
});

cartContainer.addEventListener('click', e => {
  if (e.target.classList.contains('btn-remove')) {
    const index = parseInt(e.target.dataset.index, 10);
    if (!isNaN(index)) {
      cart.splice(index, 1);
      saveCart(cart);
      renderCart();
    }
  }
});

paymentMethodSelect.addEventListener('change', () => {
  updateTotals();
});

checkoutBtn.addEventListener('click', () => {
  const name = customerNameInput.value.trim();
  const address = customerAddressInput.value.trim();
  const payment = paymentMethodSelect.value;

  // Validaciones simples
  let valid = true;
  document.getElementById('error-name').textContent = '';
  document.getElementById('error-address').textContent = '';
  document.getElementById('error-payment').textContent = '';

  if (!name) {
    document.getElementById('error-name').textContent = 'Por favor ingrese su nombre.';
    valid = false;
  }
  if (!address) {
    document.getElementById('error-address').textContent = 'Por favor ingrese su dirección.';
    valid = false;
  }
  if (!payment) {
    document.getElementById('error-payment').textContent = 'Seleccione una forma de pago.';
    valid = false;
  }
  if (!valid) return;

  if (cart.length === 0) {
    alert('El carrito está vacío.');
    return;
  }

  const { total } = calcTotals(cart, payment === 'efectivo' ? 5 : 0);

  // Armar mensaje para WhatsApp
  let msg = `*Pedido BurgerPoint*\n\n`;
  cart.forEach(item => {
    if (item.categoria === 'papas') {
      const tamaño = item.opts?.tamaño || 'Chica';
      const aderezosDesc = (item.opts?.aderezos && item.opts.aderezos.length)
        ? item.opts.aderezos.map(a => a.name).join(', ')
        : 'Ninguno';
      msg += `- ${item.nombre} x${item.qty} (Tamaño: ${tamaño}, Aderezos: ${aderezosDesc})\n`;
    } else {
      const medallones = item.opts?.medallones || 1;
      const extrasDesc = (item.opts?.extras && item.opts.extras.length)
        ? item.opts.extras.map(e => e.name).join(', ')
        : 'Ninguno';
      msg += `- ${item.nombre} x${item.qty} (Medallones: ${medallones}, Extras: ${extrasDesc})\n`;
    }
  });
  msg += `\n*Total:* $${total.toLocaleString('es-AR')}\n`;
  msg += `*Forma de pago:* ${payment === 'efectivo' ? 'Efectivo (5% descuento)' : 'Mercado Pago / Tarjeta'}\n`;
  msg += `*Nombre:* ${name}\n`;
  msg += `*Dirección:* ${address}`;

  const url = `https://wa.me/5491166784500?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
});

renderCart();
