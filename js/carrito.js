
import { loadCart, saveCart } from './storage.js';
import { updateQty, calcTotals } from './funcionesCarrito.js';
import { formatCurrency, updateCartCount } from './ui.js';

const cartContainer = document.getElementById('cart-container');
console.log('cartContainer:', cartContainer);

const totalsEl = document.getElementById('totals');
console.log('totalsEl:', totalsEl);

const checkoutBtn = document.getElementById('checkout-btn');
console.log('checkoutBtn:', checkoutBtn);

const customerNameInput = document.getElementById('customer-name');
console.log('customerNameInput:', customerNameInput);

const customerAddressInput = document.getElementById('customer-address');
console.log('customerAddressInput:', customerAddressInput);

const paymentMethodSelect = document.getElementById('payment-method');
console.log('paymentMethodSelect:', paymentMethodSelect);


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
            <input type="number" min="1" class="qty-input" data-index="${index}" value="${item.qty}" />
          </label>
          <button class="btn-remove" data-index="${index}">Eliminar</button>
        </div>
      `;
    } else {
      // Hamburguesas con medallonesExtra, extras y ingredientesQuitados
      const medallonesExtra = item.opts?.medallonesExtra || 0;
      const medallonesTotal = 1 + medallonesExtra;
      const extras = item.opts?.extras || [];
      const ingredientesQuitados = item.opts?.ingredientesQuitados || [];

      const extrasDesc = extras.length > 0
        ? extras.map(e => `${e.name} (+${formatCurrency(e.price)})`).join(', ')
        : 'Ninguno';

      const quitadosDesc = ingredientesQuitados.length > 0
        ? ingredientesQuitados.join(', ')
        : 'Ninguno';

      const medallonesPriceExtra = medallonesExtra * item.precio;
      const extrasPrice = extras.reduce((sum, ex) => sum + (ex.price || 0), 0);
      const unitPrice = item.precio + medallonesPriceExtra + extrasPrice;

      div.innerHTML = `
        <img src="../${item.img}" alt="${item.nombre}" />
        <div class="cart-item-details">
          <h3>${item.nombre}</h3>
          <p>Medallones: ${medallonesTotal} (Extras: ${formatCurrency(medallonesPriceExtra)})</p>
          <p>Extras: ${extrasDesc}</p>
          <p>Sin: ${quitadosDesc}</p>
          <p>Precio unitario ajustado: ${formatCurrency(unitPrice)}</p>
          <label>
            Cantidad:
            <input type="number" min="1" class="qty-input" data-index="${index}" value="${item.qty}" />
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
    if (!isNaN(index) && qty > 0) {
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
      const medallonesExtra = item.opts?.medallonesExtra || 0;
      const medallonesTotal = 1 + medallonesExtra;
      const extrasDesc = (item.opts?.extras && item.opts.extras.length)
        ? item.opts.extras.map(e => e.name).join(', ')
        : 'Ninguno';
      const quitadosDesc = (item.opts?.ingredientesQuitados && item.opts.ingredientesQuitados.length)
        ? item.opts.ingredientesQuitados.join(', ')
        : 'Ninguno';
      msg += `- ${item.nombre} x${item.qty} (Medallones: ${medallonesTotal}, Extras: ${extrasDesc}, Sin: ${quitadosDesc})\n`;
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
