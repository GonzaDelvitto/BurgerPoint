import { loadCart, saveCart } from './storage.js';
import { updateQty, calcTotals } from './funcionesCarrito.js';
import { formatCurrency, updateCartCount } from './ui.js';

// ELEMENTOS DEL DOM
const cartContainer = document.getElementById('cart-container');
const totalsEl = document.getElementById('totals');
const checkoutBtn = document.getElementById('checkout-btn');
const customerNameInput = document.getElementById('customer-name');
const customerAddressInput = document.getElementById('customer-address');
const paymentMethodSelect = document.getElementById('payment-method');
const deliveryMethodSelect = document.getElementById('delivery-method');
const addressWrapper = document.getElementById('address-wrapper');

// CAMPOS NUEVOS
const pisoWrapper = document.createElement('label');
pisoWrapper.id = "floor-wrapper";
pisoWrapper.style.display = "none";
pisoWrapper.innerHTML = `
  Piso (opcional)
  <input id="customer-floor" type="text" placeholder="Piso / Depto" />
`;

const entreCallesWrapper = document.createElement('label');
entreCallesWrapper.id = "streets-wrapper";
entreCallesWrapper.style.display = "none";
entreCallesWrapper.innerHTML = `
  Entre calles (opcional)
  <input id="customer-streets" type="text" placeholder="Entre calles" />
`;

const referenciaWrapper = document.createElement('label');
referenciaWrapper.id = "reference-wrapper";
referenciaWrapper.style.display = "none";
referenciaWrapper.innerHTML = `
  Referencia de la casa (opcional)
  <input id="customer-reference" type="text" placeholder="Puerta azul, portón negro, etc." />
  <small class="error-msg" id="error-reference"></small>
`;

addressWrapper.after(pisoWrapper);
pisoWrapper.after(entreCallesWrapper);
entreCallesWrapper.after(referenciaWrapper);

// Cargar carrito desde localStorage
let cart = loadCart();


// ==========================
// 🔥 RENDER DEL CARRITO
// ==========================
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

    // 📌 PAPAS
    if (item.categoria === 'papas') {
      const tamaño = item.opts?.tamaño || 'Chica';
      const tamañoPrecio = item.opts?.tamañoPrecio || 0;
      const aderezos = item.opts?.aderezos || [];

      const aderezosDesc = aderezos.length
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
    }

    // 📌 HAMBURGUESAS
    else {
      const medallonesExtra = item.opts?.medallonesExtra || 0;
      const medallonesPriceExtra = medallonesExtra * item.precio;
      const extras = item.opts?.extras || [];
      const extrasDesc = extras.length
        ? extras.map(e => `${e.name} (+${formatCurrency(e.price)})`).join(', ')
        : 'Ninguno';

      const quitadosDesc = item.opts?.ingredientesQuitados?.length
        ? item.opts.ingredientesQuitados.join(', ')
        : 'Ninguno';

      const extrasPrice = extras.reduce((sum, ex) => sum + (ex.price || 0), 0);
      const unitPrice = item.precio + medallonesPriceExtra + extrasPrice;

      div.innerHTML = `
        <img src="../${item.img}" alt="${item.nombre}" />
        <div class="cart-item-details">
          <h3>${item.nombre}</h3>
          <p>Medallones: ${1 + medallonesExtra} (Extras: ${formatCurrency(medallonesPriceExtra)})</p>
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


// ==========================
// 💰 TOTAL
// ==========================
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


// ==========================
// 🔄 CAMBIAR CANTIDAD
// ==========================
cartContainer.addEventListener('input', e => {
  if (e.target.classList.contains('qty-input')) {
    const index = parseInt(e.target.dataset.index);
    const qty = parseInt(e.target.value);

    if (qty > 0) {
      cart = updateQty(cart, index, qty);
      saveCart(cart);
      renderCart();
    }
  }
});


// ==========================
// 🗑️ ELIMINAR ITEM
// ==========================
cartContainer.addEventListener('click', e => {
  if (e.target.classList.contains('btn-remove')) {
    const index = parseInt(e.target.dataset.index);
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
  }
});


// ==========================
// 🛵 CAMPOS DELIVERY
// ==========================
deliveryMethodSelect.addEventListener('change', () => {
  const isDelivery = deliveryMethodSelect.value === 'delivery';

  addressWrapper.style.display = isDelivery ? 'block' : 'none';
  pisoWrapper.style.display = isDelivery ? 'block' : 'none';
  entreCallesWrapper.style.display = isDelivery ? 'block' : 'none';
  referenciaWrapper.style.display = isDelivery ? 'block' : 'none';
});


// ==========================
// 💳 MÉTODO DE PAGO
// ==========================
paymentMethodSelect.addEventListener('change', updateTotals);


// ==========================
// 📲 ENVIAR PEDIDO
// ==========================
checkoutBtn.addEventListener('click', () => {
  const name = customerNameInput.value.trim();
  const address = customerAddressInput.value.trim();
  const piso = document.getElementById("customer-floor").value.trim();
  const streets = document.getElementById("customer-streets").value.trim();
  const reference = document.getElementById("customer-reference").value.trim();

  const payment = paymentMethodSelect.value;
  const delivery = deliveryMethodSelect.value;

  // LIMPIAR ERRORES
  document.getElementById('error-name').textContent = '';
  document.getElementById('error-address').textContent = '';
  document.getElementById('error-payment').textContent = '';
  document.getElementById('error-delivery').textContent = '';
  document.getElementById('error-reference').textContent = '';

  // VALIDACIONES
  let valid = true;

  if (!delivery) {
    document.getElementById('error-delivery').textContent = 'Seleccione cómo recibirá su pedido.';
    valid = false;
  }

  if (!name) {
    document.getElementById('error-name').textContent = 'Ingrese su nombre.';
    valid = false;
  }

 if (delivery === 'delivery') {
  if (!address) {
    document.getElementById('error-address').textContent = 'Ingrese su dirección.';
    valid = false;
  }
  
}


  if (!payment) {
    document.getElementById('error-payment').textContent = 'Seleccione un método de pago.';
    valid = false;
  }

  if (!valid) return;
  if (cart.length === 0) return alert('El carrito está vacío.');

  const { total } = calcTotals(cart, payment === 'efectivo' ? 5 : 0);

  // ==============================
  // 📲 ARMAR MENSAJE WHATSAPP
  // ==============================
  let msg = `*Pedido BurgerPoint*\n\n`;

  cart.forEach(item => {
    if (item.categoria === 'papas') {
      const tamaño = item.opts?.tamaño || 'Chica';
      const aderezos = item.opts?.aderezos?.map(a => a.name).join(', ') || 'Ninguno';

      msg += `- ${item.nombre} x${item.qty} (Tamaño: ${tamaño}, Aderezos: ${aderezos})\n`;
    } else {
      const medallonesExtra = item.opts?.medallonesExtra || 0;
      const extras = item.opts?.extras?.map(e => e.name).join(', ') || 'Ninguno';
      const quitados = item.opts?.ingredientesQuitados?.join(', ') || 'Ninguno';

      msg += `- ${item.nombre} x${item.qty} (Medallones: ${1 + medallonesExtra}, Extras: ${extras}, Sin: ${quitados})\n`;
    }
  });

  msg += `\n*Entrega:* ${delivery === 'delivery' ? 'Delivery' : 'Retiro en local'}`;

  if (delivery === 'delivery') {
    msg += `\n*Dirección:* ${address}`;
    if (piso) msg += `\n*Piso:* ${piso}`;
    if (streets) msg += `\n*Entre calles:* ${streets}`;
    if (reference) msg += `\n*Referencia:* ${reference}`;

  }

  msg += `\n*Forma de pago:* ${payment}`;
  msg += `\n*Nombre:* ${name}`;
  msg += `\n*Total:* $${total.toLocaleString('es-AR')}`;

  const url = `https://wa.me/5491166784500?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
});


// Render inicial
renderCart();
