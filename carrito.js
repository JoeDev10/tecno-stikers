// ===== CARRITO DE COMPRAS =====
let carrito = JSON.parse(localStorage.getItem('tecnostikers_carrito') || '[]');

function guardarCarrito() {
  localStorage.setItem('tecnostikers_carrito', JSON.stringify(carrito));
  actualizarContador();
}

function actualizarContador() {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = carrito.length;
}

function abrirCarrito() {
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-panel').classList.add('open');
  renderizarCarrito();
}

function cerrarCarrito() {
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-panel').classList.remove('open');
}

function renderizarCarrito() {
  const container = document.getElementById('cart-items');
  const footer    = document.getElementById('cart-footer');
  const totalEl   = document.getElementById('cart-total');

  if (!container) return;

  if (carrito.length === 0) {
    container.innerHTML = '<p class="cart-empty">Tu carrito está vacío 🛒</p>';
    if (footer) footer.style.display = 'none';
    return;
  }

  let total = 0;
  container.innerHTML = carrito.map((item, i) => {
    total += item.precio;
    const detalle = item.material && item.tamanio
      ? `${item.catalogo} — ${item.material} ${item.tamanio}`
      : item.catalogo;
    const iconHtml = item.imagen
      ? `<img class="cart-item-img" src="${item.imagen}" alt="${item.nombre}" onerror="this.outerHTML='${item.emoji}'">`
      : item.emoji;
    return `
      <div class="cart-item">
        <div class="cart-item-icon">${iconHtml}</div>
        <div class="cart-item-info">
          <h4>${item.nombre}</h4>
          <p>${detalle}</p>
        </div>
        <div class="cart-item-price">$${item.precio}</div>
        <button class="cart-item-remove" onclick="quitarDelCarrito(${i})" title="Quitar">✕</button>
      </div>
    `;
  }).join('');

  if (footer) {
    footer.style.display = 'block';
    totalEl.textContent = '$' + total.toLocaleString('es-AR');
  }
}

function agregarAlCarrito(id, nombre, emoji, catalogo, precio, material, tamanio, imagen) {
  if (carrito.find(i => i.id === id)) {
    mostrarToast('Este stiker ya está en tu carrito');
    return false;
  }
  carrito.push({ id, nombre, emoji, catalogo, precio, material: material || '', tamanio: tamanio || '', imagen: imagen || '' });
  guardarCarrito();
  mostrarToast('✅ ' + nombre + ' agregado al carrito');
  return true;
}

function quitarDelCarrito(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  renderizarCarrito();
  if (typeof actualizarBotonesGrilla === 'function') actualizarBotonesGrilla();
}

function checkout() {
  if (carrito.length === 0) return;
  const total = carrito.reduce((s, i) => s + i.precio, 0);
  const lista = carrito.map((item, i) => {
    const detalle = item.material && item.tamanio
      ? `${item.material} ${item.tamanio}`
      : '';
    return `${i+1}. ${item.nombre} (${item.catalogo})${detalle ? ' — ' + detalle : ''} — $${item.precio}`;
  }).join('\n');
  const mensaje = encodeURIComponent(
    `¡Hola! Quiero hacer un pedido de stikers:\n\n${lista}\n\nTOTAL: $${total.toLocaleString('es-AR')}\n\n¿Cómo coordino el pago y envío?`
  );
  window.open(`https://wa.me/5491124575207?text=${mensaje}`, '_blank');
}

function mostrarToast(msg) {
  let toast = document.getElementById('toast-global');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-global';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

document.addEventListener('DOMContentLoaded', actualizarContador);
