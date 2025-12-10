import { addToCart } from './funcionesCarrito.js';
import { loadCart, saveCart } from './storage.js';
import { updateCartCount, formatCurrency } from './ui.js';

import { renderFloatingCart, setCart as setFloatingCart } from './carritoflotante.js';

const simplesEl = document.querySelector('#simples .menu-items-container');
const doblesEl = document.querySelector('#dobles .menu-items-container');
const triplesEl = document.querySelector('#triples .menu-items-container');
const papasEl = document.querySelector('#papas .menu-items-container');

export let cart = loadCart();

const modal = document.getElementById('customize-modal');
const modalProductName = document.getElementById('modal-product-name');
const modalProductImg = document.getElementById('modal-product-img');
const modalOptions = document.getElementById('modal-options');
const modalAddBtn = document.getElementById('modal-add-to-cart');
const modalCancelBtn = document.getElementById('modal-cancel');

let currentProduct = null;
let productos = [];

/* -------------------------------------
   CARGAR PRODUCTOS
------------------------------------- */
async function loadProductos() {
  try {
    const res = await fetch('./data/productos.json');
    productos = await res.json();
    renderMenu();
  } catch (e) {
    console.error('Error cargando productos:', e);
  }
}

/* -------------------------------------
   RENDER DEL MENÚ
------------------------------------- */
function renderMenu() {
  simplesEl.innerHTML = '';
  doblesEl.innerHTML = '';
  triplesEl.innerHTML = '';
  papasEl.innerHTML = '';

  productos.forEach(product => {
    let extraInfo = '';

    if (product.categoria !== 'papas') {
      extraInfo = `<small>Precio base incluye medallones: ${formatCurrency(product.precio)}</small>`;
    } else {
      extraInfo = `
        <small>Precios por tamaño:</small>
        <ul>
          <li>Chica +$400</li>
          <li>Mediana +$600</li>
          <li>Grande +$800</li>
        </ul>
      `;
    }

    const div = document.createElement('div');
    div.className = 'menu-item';
    div.innerHTML = `
      <img src="${product.img}" alt="${product.nombre}" />
      <h3>${product.nombre}</h3>
      <p class="descripcion">${product.descripcion || ''}</p>
      <p>Precio base: ${formatCurrency(product.precio)}</p>
      ${extraInfo}
      <button class="btn add-to-cart" data-id="${product.id}">🛒Agregar al Carrito🛒</button>
    `;

    if (product.categoria === 'triple') triplesEl.appendChild(div);
    else if (product.categoria === 'doble') doblesEl.appendChild(div);
    else if (product.categoria === 'papas') papasEl.appendChild(div);
    else simplesEl.appendChild(div);
  });

  updateCartCount(cart.reduce((acc, i) => acc + i.qty, 0));
  setFloatingCart(cart);
  renderFloatingCart(cart);
}

/* -------------------------------------
   MANEJAR CLICK EN AGREGAR — LISTENER ÚNICO
------------------------------------- */
function handleAddToCartClick(e) {
  if (!e.target.classList.contains('add-to-cart')) return;

  const id = e.target.dataset.id;
  currentProduct = productos.find(p => p.id === id);
  if (!currentProduct) return;

  modalProductName.textContent = currentProduct.nombre;
  modalProductImg.src = currentProduct.img;

  modalOptions.innerHTML = '';

  if (currentProduct.categoria !== 'papas') {
    modalOptions.innerHTML = `
      <label>
        Medallones extra:
        <select id="opt-medallones-extra">
          <option value="0" data-price="0">Sin medallón extra</option>
          <option value="1" data-price="1500">1 Medallón extra +$1500</option>
          <option value="2" data-price="3000">2 Medallones extra +$3000</option>
          <option value="3" data-price="4500">3 Medallones extra +$4500</option>
        </select>
      </label>

      <fieldset id="opt-extras">
        <legend>Extras:</legend>
        <label><input type="checkbox" value="Queso" data-price="200"> Queso +$200</label><br/>
        <label><input type="checkbox" value="Lechuga" data-price="100"> Lechuga +$100</label><br/>
        <label><input type="checkbox" value="Tomate" data-price="200"> Tomate +$200</label><br/>
        <label><input type="checkbox" value="Panceta" data-price="500"> Panceta +$500</label><br/>
      </fieldset>

      <fieldset id="opt-ingredientes-quitados">
        <legend>Quitar ingredientes:</legend>
        <label><input type="checkbox" value="Huevo"> Huevo</label><br/>
        <label><input type="checkbox" value="Cebolla"> Cebolla</label><br/>
        <label><input type="checkbox" value="Pepinillos"> Pepinillos</label><br/>
      </fieldset>
    `;
  } else {
    modalOptions.innerHTML = `
      <fieldset>
        <legend>Tamaño:</legend>
        <label><input type="radio" name="tamaño" value="Chica" data-price="400" checked> Chica (+$400)</label><br/>
        <label><input type="radio" name="tamaño" value="Mediana" data-price="600"> Mediana (+$600)</label><br/>
        <label><input type="radio" name="tamaño" value="Grande" data-price="800"> Grande (+$800)</label>
      </fieldset>

      <fieldset id="opt-aderezos">
        <legend>Aderezos:</legend>
        <label><input type="checkbox" value="Ketchup" data-price="0"> Ketchup +$0</label><br/>
        <label><input type="checkbox" value="Mayonesa" data-price="0"> Mayonesa +$0</label><br/>
        <label><input type="checkbox" value="Cheddar" data-price="0"> Cheddar +$0</label><br/>
        <label><input type="checkbox" value="Alioli" data-price="0"> Alioli +$0</label>
      </fieldset>
    `;
  }

  modal.classList.remove('hidden');
}

/* --- LIMPIAR DUPLICADOS Y REGISTRAR UNA SOLA VEZ --- */
document.removeEventListener('click', handleAddToCartClick);
document.addEventListener('click', handleAddToCartClick);

/* -------------------------------------
   AGREGAR AL CARRITO DESDE EL MODAL
------------------------------------- */
modalAddBtn.addEventListener('click', () => {
  if (!currentProduct) return;

  let opts = {};

  if (currentProduct.categoria !== 'papas') {
    const medallonesExtraSelect = document.getElementById('opt-medallones-extra');
    const medallonesExtra = parseInt(medallonesExtraSelect.value);
    const medallonesExtraPrecio = parseInt(medallonesExtraSelect.options[medallonesExtraSelect.selectedIndex].dataset.price);

    opts.medallonesExtra = medallonesExtra;
    opts.medallonesPrecio = currentProduct.precio + medallonesExtraPrecio;

    opts.extras = [];
    document.querySelectorAll('#opt-extras input:checked').forEach(chk => {
      opts.extras.push({
        name: chk.value,
        price: parseInt(chk.dataset.price)
      });
    });

    opts.ingredientesQuitados = [];
    document.querySelectorAll('#opt-ingredientes-quitados input:checked').forEach(chk => {
      opts.ingredientesQuitados.push(chk.value);
    });

    // Sumá extras al precio
    const extrasTotal = opts.extras.reduce((sum, ex) => sum + ex.price, 0);
    opts.medallonesPrecio += extrasTotal;

  } else {
    const tamañoInput = document.querySelector('input[name="tamaño"]:checked');
    opts.tamaño = tamañoInput.value;
    opts.tamañoPrecio = parseInt(tamañoInput.dataset.price);

    opts.aderezos = [];
    document.querySelectorAll('#opt-aderezos input:checked').forEach(chk => {
      opts.aderezos.push({
        name: chk.value,
        price: parseInt(chk.dataset.price)
      });
    });
  }

  // Creá una copia del producto con precio actualizado para el carrito
  const productToAdd = {
    ...currentProduct,
    precio: currentProduct.categoria !== 'papas' 
      ? opts.medallonesPrecio 
      : currentProduct.precio + (opts.tamañoPrecio || 0) + opts.aderezos.reduce((sum, ad) => sum + ad.price, 0)
  };

  cart = addToCart(cart, productToAdd, opts);
  saveCart(cart);

  updateCartCount(cart.reduce((acc, i) => acc + i.qty, 0));
  setFloatingCart(cart);
  renderFloatingCart(cart);

  modal.classList.add('hidden');
  currentProduct = null;
});

/* -------------------------------------
   CANCELAR MODAL
------------------------------------- */
modalCancelBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  currentProduct = null;
});

/* -------------------------------------
   FILTRO DE BOTONES
------------------------------------- */
document.querySelectorAll('.filter-buttons button').forEach(button => {
  button.addEventListener('click', () => {
    const targetId = button.dataset.filter;
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  });
});

loadProductos();
