import { loadCart, saveCart } from './storage.js';
import { updateCartCount } from './ui.js';

let cart = loadCart();

export function setCart(newCart) {
  cart = newCart;
}

export function renderFloatingCart(cartParam) {
  const currentCart = cartParam || cart;

  const cartContainer = document.getElementById('cart-container');
  if (!cartContainer) return;

  if (currentCart.length === 0) {
    cartContainer.innerHTML = `<p style="padding:1rem; color:#ffb347;">El carrito está vacío.</p>`;
    return;
  }

  cartContainer.innerHTML = '';

  currentCart.forEach((item, index) => {
    const medallonesExtra = item.opts?.medallonesExtra || 0;
    const medallonesText = medallonesExtra > 0
      ? `${medallonesExtra} medallón(es) extra`
      : '';

    const extrasText = item.opts?.extras?.length
      ? item.opts.extras.map(e => `${e.name} (+$${e.price})`).join(', ')
      : '';

    const quitadosText = item.opts?.ingredientesQuitados?.length
      ? 'Sin: ' + item.opts.ingredientesQuitados.join(', ')
      : '';

    const tamañoText = item.opts?.tamaño
      ? `Tamaño: ${item.opts.tamaño} (+$${item.opts.tamañoPrecio || 0})`
      : '';

    const aderezosText = item.opts?.aderezos?.length
      ? item.opts.aderezos.map(a => `${a.name} (+$${a.price})`).join(', ')
      : '';

    const details = [medallonesText, extrasText, quitadosText, tamañoText, aderezosText]
      .filter(Boolean)
      .join(' | ');

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.img}" alt="${item.nombre}" />
      <div class="cart-item-details">
        <h3>${item.nombre}</h3>
        <p>${details}</p>
        <label>Cantidad:
          <input type="number" min="1" value="${item.qty}" data-index="${index}" class="qty-input" />
        </label>
      </div>
      <button class="btn-remove" data-index="${index}">Eliminar</button>
    `;
    cartContainer.appendChild(div);
  });

  // Calculamos total usando precio base + extras + medallones + tamaño + aderezos
  const total = currentCart.reduce((acc, item) => {
    let unitPrice = item.precio;

    // Si es hamburguesa con medallones extra ya sumados en precio, no sumar acá, pero si usás el precio base, sumar medallonesExtra * precio por medallón si aplica.
    // Pero ideal que precio ya tenga todo, entonces solo sumamos extras si no están incluidos.
    // Acá asumimos que precio ya incluye medallones y extras.

    // Para papas, agregamos tamaño y aderezos extra
    if (item.categoria === 'papas') {
      unitPrice = item.precio + (item.opts?.tamañoPrecio || 0) + (item.opts?.aderezos?.reduce((sum, a) => sum + a.price, 0) || 0);
    }

    return acc + unitPrice * item.qty;
  }, 0);

  const totalDiv = document.createElement('div');
  totalDiv.id = 'cart-total';
  totalDiv.innerHTML = `
    <span>Total: $${total.toFixed(2)}</span>
    <button id="go-to-checkout-btn">Ir a pagar</button>
  `;
  cartContainer.appendChild(totalDiv);

  totalDiv.querySelector('#go-to-checkout-btn').addEventListener('click', () => {
    window.location.href = './pages/carrito.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const floatingCartBtn = document.getElementById('floating-cart-btn');
  const cartContainer = document.getElementById('cart-container');

  if (!floatingCartBtn || !cartContainer) {
    console.warn('Elementos del carrito flotante no encontrados en el DOM.');
    return;
  }

  updateCartCount(cart.reduce((acc, i) => acc + i.qty, 0));
  renderFloatingCart(cart);

  floatingCartBtn.addEventListener('click', () => {
    cartContainer.classList.toggle('show');
  });

  cartContainer.addEventListener('input', e => {
    if (!e.target.classList.contains('qty-input')) return;

    const index = parseInt(e.target.dataset.index);
    let qty = parseInt(e.target.value);

    if (isNaN(qty) || qty < 1) qty = 1;
    e.target.value = qty;

    cart[index].qty = qty;
    saveCart(cart);
    updateCartCount(cart.reduce((acc, i) => acc + i.qty, 0));
    renderFloatingCart(cart);
  });

  cartContainer.addEventListener('click', e => {
    if (!e.target.classList.contains('btn-remove')) return;

    const index = parseInt(e.target.dataset.index);
    cart.splice(index, 1);
    saveCart(cart);
    updateCartCount(cart.reduce((acc, i) => acc + i.qty, 0));
    renderFloatingCart(cart);
  });
});
