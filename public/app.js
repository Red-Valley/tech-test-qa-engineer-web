const state = { userId: null, page: 1, totalPages: 1, cartCount: 0 };
const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-User-Id': String(state.userId || ''), ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

function money(n) {
  return '$' + Number(n).toFixed(2);
}

// ---------- users ----------
async function loadUsers() {
  const users = await api('/api/users');
  $('user-select').innerHTML = users.map((u) => `<option value="${u.id}">${u.name}</option>`).join('');
  state.userId = users[0].id;
}

// ---------- products ----------
let searchTimer;
async function loadProducts() {
  const [sort, order] = $('sort').value.split(':');
  const params = new URLSearchParams({ search: $('search').value, sort, order, page: state.page, pageSize: 6 });
  const res = await api('/api/products?' + params);
  state.totalPages = res.totalPages || 1;
  $('page-info').textContent = `Page ${res.page} of ${state.totalPages}`;
  $('prev').disabled = state.page <= 1;
  $('next').disabled = state.page >= state.totalPages;
  $('products').innerHTML = res.data.length
    ? res.data
        .map(
          (p) => `
      <article class="card" data-testid="product-card" data-product-id="${p.id}">
        <h3 data-testid="product-title">${p.title}</h3>
        <div class="meta">${p.developer} · ${p.genre} · ★ ${p.rating}</div>
        <div class="price" data-testid="product-price">${money(p.price)}</div>
        ${p.stock === 0 ? '<span class="badge" data-testid="out-of-stock">Out of stock</span>' : `<span class="meta">${p.stock} left</span>`}
        <button data-add="${p.id}" data-testid="add-to-cart" ${p.stock === 0 ? 'disabled' : ''}>Add to cart</button>
      </article>`
        )
        .join('')
    : '<p data-testid="no-results">No games found.</p>';
}

// ---------- cart ----------
function renderCart(cart) {
  $('cart-items').innerHTML = cart.items
    .map(
      (i) => `
    <li data-testid="cart-item" data-product-id="${i.productId}">
      <span>${i.title}<br><small>${money(i.unitPrice)} each</small></span>
      <input type="number" min="1" value="${i.quantity}" data-qty="${i.productId}" data-testid="cart-qty" aria-label="Quantity for ${i.title}" />
      <button data-remove="${i.productId}" data-testid="remove-item">Remove</button>
    </li>`
    )
    .join('');
  let subtotal = 0;
  cart.items.forEach((i) => (subtotal += i.unitPrice * i.quantity));
  $('subtotal').textContent = '$' + subtotal;
  $('discount').textContent = '-' + money(cart.discount);
  $('total').textContent = money(cart.total);
}

function updateCount(cart) {
  state.cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  $('cart-count').textContent = state.cartCount;
}

async function refreshCart() {
  const cart = await api('/api/cart');
  renderCart(cart);
  updateCount(cart);
}

async function addToCart(productId) {
  const cart = await api('/api/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity: 1 }) });
  renderCart(cart);
  updateCount(cart);
}

async function changeQty(productId, quantity) {
  const cart = await api(`/api/cart/items/${productId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
  renderCart(cart);
  updateCount(cart);
}

async function removeItem(productId) {
  const cart = await api(`/api/cart/items/${productId}`, { method: 'DELETE' });
  renderCart(cart);
}

// ---------- orders ----------
async function loadOrders() {
  const orders = await api('/api/orders');
  $('order-list').innerHTML = orders.length
    ? orders
        .map((o) => {
          const d = new Date(o.created_at);
          return `<li data-testid="order-row"><span>Order #${o.id}<br><small data-testid="order-date">${d.toLocaleDateString()} ${d.toLocaleTimeString()}</small></span><strong>${money(o.total)}</strong></li>`;
        })
        .join('')
    : '<li>No orders yet.</li>';
}

// ---------- events ----------
function bind() {
  $('search').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.page = 1;
      loadProducts();
    }, 250);
  });
  $('sort').addEventListener('change', () => {
    state.page = 1;
    loadProducts();
  });
  $('prev').addEventListener('click', () => {
    state.page--;
    loadProducts();
  });
  $('next').addEventListener('click', () => {
    state.page++;
    loadProducts();
  });
  $('products').addEventListener('click', (e) => {
    const id = e.target.dataset.add;
    if (id) addToCart(Number(id));
  });
  $('user-select').addEventListener('change', (e) => {
    state.userId = Number(e.target.value);
    refreshCart();
  });
  $('cart-btn').addEventListener('click', () => {
    $('orders').classList.add('hidden');
    $('cart').classList.remove('hidden');
    refreshCart();
  });
  $('close-cart').addEventListener('click', () => $('cart').classList.add('hidden'));
  $('orders-btn').addEventListener('click', () => {
    $('cart').classList.add('hidden');
    $('orders').classList.remove('hidden');
    loadOrders();
  });
  $('close-orders').addEventListener('click', () => $('orders').classList.add('hidden'));
  $('cart-items').addEventListener('change', (e) => {
    const id = e.target.dataset.qty;
    if (id) changeQty(Number(id), Number(e.target.value));
  });
  $('cart-items').addEventListener('click', (e) => {
    const id = e.target.dataset.remove;
    if (id) removeItem(Number(id));
  });
  $('coupon-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('coupon-msg');
    try {
      const cart = await api('/api/cart/coupon', { method: 'POST', body: JSON.stringify({ code: $('coupon').value }) });
      renderCart(cart);
      msg.className = 'msg ok';
      msg.textContent = `Coupon ${cart.coupon} applied`;
    } catch (err) {
      msg.className = 'msg error';
      msg.textContent = err.message;
    }
  });
  $('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('checkout-msg');
    try {
      const order = await api('/api/checkout', { method: 'POST', body: JSON.stringify({ email: $('email').value }) });
      msg.className = 'msg ok';
      msg.textContent = `Order #${order.orderId} placed! Total ${money(order.total)}`;
      await refreshCart();
      loadProducts();
    } catch (err) {
      msg.className = 'msg error';
      msg.textContent = err.message;
    }
  });
}

(async function start() {
  bind();
  await loadUsers();
  await loadProducts();
  await refreshCart();
})();
