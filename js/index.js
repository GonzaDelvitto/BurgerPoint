import { addToCart } from './funcionesCarrito.js';
import { loadCart, saveCart } from './storage.js';
import { updateCartCount, formatCurrency } from './ui.js';

// Importo funciones para el carrito flotante
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
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.innerHTML = `
      <img src="${product.img}" alt="${product.nombre}" />
      <h3>${product.nombre}</h3>
      <p class="descripcion">${product.descripcion || ''}</p>
      <p>Precio: ${formatCurrency(product.precio)}</p>
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
   ABRIR MODAL SEGÚN PRODUCTO
------------------------------------- */
document.addEventListener('click', e => {
  if (!e.target.classList.contains('add-to-cart')) return;

  const id = e.target.dataset.id;
  currentProduct = productos.find(p => p.id === id);
  if (!currentProduct) return;

  modalProductName.textContent = currentProduct.nombre;
  modalProductImg.src = currentProduct.img;

  // Limpiar contenido anterior
  modalOptions.innerHTML = '';

  /* ------------------------------
     HAMBURGUESAS
  ------------------------------ */
  if (currentProduct.categoria !== 'papas') {
    modalOptions.innerHTML = `
      <label>
        Medallones:
        <select id="opt-medallones">
          <option value="1">1 Medallón</option>
          <option value="2">2 Medallones</option>
          <option value="3">3 Medallones</option>
        </select>
      </label>

      <fieldset id="opt-extras">
        <legend>Extras:</legend>
        <label><input type="checkbox" value="Queso" data-price="500"> Queso +$500</label><br/>
        <label><input type="checkbox" value="Lechuga" data-price="200"> Lechuga +$200</label><br/>
        <label><input type="checkbox" value="Tomate" data-price="300"> Tomate +$300</label><br/>
        <label><input type="checkbox" value="Panceta" data-price="700"> Panceta +$700</label><br/>
      </fieldset>
    `;
  }

  /* ------------------------------
     PAPAS FRITAS
  ------------------------------ */
  else {
    modalOptions.innerHTML = `
      <fieldset>
        <legend>Tamaño:</legend>
        <label><input type="radio" name="tamaño" value="Chica" data-price="400" checked> Chica (+$400)</label><br/>
        <label><input type="radio" name="tamaño" value="Mediana" data-price="600"> Mediana (+$600)</label><br/>
        <label><input type="radio" name="tamaño" value="Grande" data-price="800"> Grande (+$800)</label>
      </fieldset>

      <fieldset id="opt-aderezos">
        <legend>Aderezos:</legend>
        <label><input type="checkbox" value="Ketchup" data-price="50"> Ketchup +$50</label><br/>
        <label><input type="checkbox" value="Mayonesa" data-price="50"> Mayonesa +$50</label><br/>
        <label><input type="checkbox" value="Cheddar" data-price="80"> Cheddar +$80</label><br/>
        <label><input type="checkbox" value="Alioli" data-price="70"> Alioli +$70</label>
      </fieldset>
    `;
  }

  modal.classList.remove('hidden');
});

/* -------------------------------------
   AGREGAR AL CARRITO
------------------------------------- */
modalAddBtn.addEventListener('click', () => {
  if (!currentProduct) return;

  let opts = {};

  /* HAMBURGUESAS */
  if (currentProduct.categoria !== 'papas') {
    const med = document.getElementById('opt-medallones');
    opts.medallones = parseInt(med.value);

    opts.extras = [];
    document.querySelectorAll('#opt-extras input:checked').forEach(chk => {
      opts.extras.push({
        name: chk.value,
        price: parseInt(chk.dataset.price)
      });
    });
  }

  /* PAPAS FRITAS */
  else {
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

  cart = addToCart(cart, currentProduct, opts);
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
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

loadProductos();
