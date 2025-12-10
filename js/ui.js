export function formatCurrency(num) {
  return '$' + num.toLocaleString('es-AR', { minimumFractionDigits: 0 });
}

export function updateCartCount(count) {
 const countEl = document.getElementById('cart-count');
  const countFloatEl = document.getElementById('cart-count-float');

  if (countEl) countEl.textContent = count;
  if (countFloatEl) {
    countFloatEl.textContent = count;
    countFloatEl.style.display = count > 0 ? 'inline-block' : 'none';
  }
}
