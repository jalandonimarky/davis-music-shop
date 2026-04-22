/* ============================================================
   Sonido Musical — theme.js
   Mirrors Shopify's theme.js patterns: cart API shape, formatMoney,
   event-driven updates. When migrating to Shopify, swap the
   ShopAPI module for fetch('/cart.js'), /products.json, etc.
   ============================================================ */

const DATA_URL = 'data/products.json';
const CART_KEY = 'sonido:cart:v1';

/* ---------- Data layer (Shopify-compatible shape) ---------- */
const ShopAPI = {
  _cache: null,

  async load() {
    if (this._cache) return this._cache;
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('Failed to load products.json');
    this._cache = await res.json();
    return this._cache;
  },

  async products() {
    const d = await this.load();
    return d.products;
  },

  async productByHandle(handle) {
    const ps = await this.products();
    return ps.find(p => p.handle === handle) || null;
  },

  async productById(id) {
    const ps = await this.products();
    return ps.find(p => p.id === Number(id)) || null;
  },

  async variantById(variantId) {
    const ps = await this.products();
    for (const p of ps) {
      const v = p.variants.find(v => v.id === Number(variantId));
      if (v) return { product: p, variant: v };
    }
    return null;
  },

  async collections() {
    const d = await this.load();
    return d.collections;
  },

  async shop() {
    const d = await this.load();
    return d.shop;
  }
};

/* ---------- Money formatter (Shopify uses Liquid money filter) ---------- */
function formatMoney(amount, currencySymbol = '₱') {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${currencySymbol}0.00`;
  return currencySymbol + n.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/* ---------- Cart (mirrors Shopify /cart.js state shape) ---------- */
const Cart = {
  _state: null,

  _empty() {
    return { items: [], total_price: 0, item_count: 0, currency: 'PHP' };
  },

  _load() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      this._state = raw ? JSON.parse(raw) : this._empty();
    } catch {
      this._state = this._empty();
    }
    return this._state;
  },

  _save() {
    localStorage.setItem(CART_KEY, JSON.stringify(this._state));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: this._state }));
  },

  _recalc() {
    this._state.total_price = this._state.items.reduce(
      (sum, it) => sum + Number(it.price) * it.quantity,
      0
    );
    this._state.item_count = this._state.items.reduce((sum, it) => sum + it.quantity, 0);
  },

  get() {
    return this._state || this._load();
  },

  async add(variantId, quantity = 1) {
    this.get();
    const match = await ShopAPI.variantById(variantId);
    if (!match) throw new Error('Variant not found');
    const { product, variant } = match;

    const existing = this._state.items.find(it => it.variant_id === variant.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this._state.items.push({
        id: variant.id,
        variant_id: variant.id,
        product_id: product.id,
        handle: product.handle,
        title: product.title,
        variant_title: variant.title,
        sku: variant.sku,
        price: variant.price,
        image: product.featured_image,
        quantity
      });
    }
    this._recalc();
    this._save();
    return this._state;
  },

  update(variantId, quantity) {
    this.get();
    const line = this._state.items.find(it => it.variant_id === Number(variantId));
    if (!line) return this._state;
    if (quantity <= 0) {
      this._state.items = this._state.items.filter(it => it.variant_id !== Number(variantId));
    } else {
      line.quantity = quantity;
    }
    this._recalc();
    this._save();
    return this._state;
  },

  remove(variantId) {
    return this.update(variantId, 0);
  },

  clear() {
    this._state = this._empty();
    this._save();
    return this._state;
  }
};

/* ---------- UI: Header cart badge + drawer ---------- */
function renderCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;
  const state = Cart.get();
  const itemsEl = drawer.querySelector('[data-cart-items]');
  const totalEl = drawer.querySelector('[data-cart-total]');
  const footerEl = drawer.querySelector('[data-cart-footer]');

  if (state.items.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-drawer__empty">
        <p>Your cart is empty.</p>
        <a href="collection.html" class="btn btn--secondary" style="margin-top:14px">Browse instruments</a>
      </div>`;
    footerEl.style.display = 'none';
    return;
  }

  footerEl.style.display = 'block';
  itemsEl.innerHTML = state.items.map(it => `
    <div class="cart-line" data-variant-id="${it.variant_id}">
      <div class="cart-line__media"><img src="${it.image}" alt="${it.title}"></div>
      <div>
        <h4 class="cart-line__title"><a href="product.html?handle=${it.handle}" style="text-decoration:none;color:inherit">${it.title}</a></h4>
        <div class="cart-line__variant">${it.variant_title}</div>
        <div class="cart-line__controls">
          <div class="cart-line__qty">
            <button data-cart-decrement aria-label="Decrease">−</button>
            <span>${it.quantity}</span>
            <button data-cart-increment aria-label="Increase">+</button>
          </div>
          <button class="cart-line__remove" data-cart-remove>Remove</button>
        </div>
      </div>
      <div class="cart-line__price">${formatMoney(Number(it.price) * it.quantity)}</div>
    </div>
  `).join('');

  totalEl.textContent = formatMoney(state.total_price);
}

function renderCartBadge() {
  const badge = document.querySelector('[data-cart-count]');
  if (!badge) return;
  const state = Cart.get();
  badge.textContent = state.item_count;
  badge.style.display = state.item_count > 0 ? '' : 'none';
}

function openCart() {
  document.getElementById('cart-drawer')?.classList.add('is-open');
  document.getElementById('cart-backdrop')?.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-drawer')?.classList.remove('is-open');
  document.getElementById('cart-backdrop')?.classList.remove('is-open');
  document.body.style.overflow = '';
}

function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add('is-visible'));
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('is-visible'), 2200);
}

/* ---------- Product card snippet (mirrors Dawn's card-product.liquid) ---------- */
function productCardHTML(p) {
  const v = p.variants[0];
  const onSale = v.compare_at_price && Number(v.compare_at_price) > Number(v.price);
  const priceClass = onSale ? 'price price--on-sale' : 'price';
  const compare = onSale ? `<span class="price__compare">${formatMoney(v.compare_at_price)}</span>` : '';
  const badge = onSale ? `<span class="card-product__badge">Sale</span>` : '';
  return `
    <a class="card-product" href="product.html?handle=${p.handle}">
      <div class="card-product__media">
        ${badge}
        <img src="${p.featured_image}" alt="${p.title}" loading="lazy">
      </div>
      <div class="card-product__body">
        <div class="card-product__vendor">${p.vendor}</div>
        <h3 class="card-product__title">${p.title}</h3>
        <div class="${priceClass}">
          <span class="price__current">${formatMoney(v.price)}</span>
          ${compare}
        </div>
      </div>
    </a>
  `;
}

/* ---------- Page: home ---------- */
async function renderHome() {
  const grid = document.querySelector('[data-product-grid="featured"]');
  if (!grid) return;
  const products = await ShopAPI.products();
  const featured = products.slice(0, 8);
  grid.innerHTML = featured.map(productCardHTML).join('');
}

/* ---------- Page: collection ---------- */
async function renderCollection() {
  const grid = document.querySelector('[data-product-grid="collection"]');
  if (!grid) return;
  const params = new URLSearchParams(location.search);
  const activeHandle = params.get('collection') || 'all';

  const [products, collections] = await Promise.all([ShopAPI.products(), ShopAPI.collections()]);
  const filtersEl = document.querySelector('[data-collection-filters]');
  const titleEl = document.querySelector('[data-collection-title]');

  if (filtersEl) {
    filtersEl.innerHTML = collections.map(c =>
      `<button data-collection="${c.handle}" class="${c.handle === activeHandle ? 'is-active' : ''}">${c.title}</button>`
    ).join('');
    filtersEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-collection]');
      if (!btn) return;
      const handle = btn.getAttribute('data-collection');
      const next = new URLSearchParams(location.search);
      next.set('collection', handle);
      history.replaceState(null, '', 'collection.html?' + next.toString());
      renderCollection();
    });
  }

  const active = collections.find(c => c.handle === activeHandle) || collections[0];
  if (titleEl) titleEl.textContent = active.title;
  const descEl = document.querySelector('[data-collection-description]');
  if (descEl) descEl.textContent = active.description || '';

  let filtered = products;
  if (active.handle !== 'all' && active.tags) {
    filtered = products.filter(p => p.tags.some(t => active.tags.includes(t)));
  }

  grid.innerHTML = filtered.map(productCardHTML).join('');
}

/* ---------- Page: product ---------- */
async function renderProduct() {
  const root = document.querySelector('[data-product-root]');
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const handle = params.get('handle');
  if (!handle) {
    root.innerHTML = '<p>Product not found.</p>';
    return;
  }
  const product = await ShopAPI.productByHandle(handle);
  if (!product) {
    root.innerHTML = '<p>Product not found.</p>';
    return;
  }

  document.title = `${product.title} — Sonido Musical`;

  let selectedVariant = product.variants.find(v => v.available) || product.variants[0];

  function render() {
    const onSale = selectedVariant.compare_at_price && Number(selectedVariant.compare_at_price) > Number(selectedVariant.price);
    const compare = onSale ? `<span class="price__compare">${formatMoney(selectedVariant.compare_at_price)}</span>` : '';
    const priceClass = onSale ? 'price price--on-sale' : 'price';

    root.innerHTML = `
      <div class="product__grid">
        <figure class="product__media">
          <img src="${product.featured_image}" alt="${product.title}">
        </figure>
        <div class="product__info">
          <div class="product__vendor">${product.vendor}</div>
          <h1 class="product__title">${product.title}</h1>
          <div class="product__price ${priceClass}">
            <span class="price__current">${formatMoney(selectedVariant.price)}</span>
            ${compare}
          </div>
          <p class="product__description">${product.description}</p>

          <div class="variant-picker">
            <label class="variant-picker__label">${product.options[0].name}: <strong data-selected-option></strong></label>
            <div class="variant-picker__options" data-variant-options></div>
          </div>

          <div class="quantity-row">
            <div class="quantity">
              <button type="button" data-qty-dec aria-label="Decrease">−</button>
              <input type="number" min="1" value="1" data-qty-input>
              <button type="button" data-qty-inc aria-label="Increase">+</button>
            </div>
            <button class="btn btn--primary btn--block" data-add-to-cart ${selectedVariant.available ? '' : 'disabled'}>
              ${selectedVariant.available ? 'Add to cart' : 'Sold out'}
            </button>
          </div>

          <div class="product__meta">
            <dl>
              <dt>SKU</dt><dd data-sku>${selectedVariant.sku}</dd>
              <dt>Type</dt><dd>${product.product_type}</dd>
              <dt>Vendor</dt><dd>${product.vendor}</dd>
              <dt>Availability</dt><dd>${selectedVariant.available ? 'In stock' : 'Sold out'}</dd>
            </dl>
          </div>
        </div>
      </div>
    `;

    const optsWrap = root.querySelector('[data-variant-options]');
    optsWrap.innerHTML = product.variants.map(v => `
      <button class="variant-option"
              data-variant-id="${v.id}"
              aria-checked="${v.id === selectedVariant.id}"
              ${v.available ? '' : 'disabled'}>
        ${v.title}
      </button>
    `).join('');
    root.querySelector('[data-selected-option]').textContent = selectedVariant.title;

    optsWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.variant-option');
      if (!btn || btn.hasAttribute('disabled')) return;
      const vid = Number(btn.getAttribute('data-variant-id'));
      selectedVariant = product.variants.find(v => v.id === vid);
      render();
    });

    const qtyInput = root.querySelector('[data-qty-input]');
    root.querySelector('[data-qty-dec]').addEventListener('click', () => {
      qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
    });
    root.querySelector('[data-qty-inc]').addEventListener('click', () => {
      qtyInput.value = Number(qtyInput.value) + 1;
    });

    root.querySelector('[data-add-to-cart]').addEventListener('click', async () => {
      if (!selectedVariant.available) return;
      const qty = Math.max(1, Number(qtyInput.value) || 1);
      await Cart.add(selectedVariant.id, qty);
      toast(`Added ${product.title} to cart`);
      openCart();
    });
  }

  render();
}

/* ---------- Global wiring ---------- */
function wireGlobalUI() {
  document.querySelectorAll('[data-cart-open]').forEach(btn => {
    btn.addEventListener('click', openCart);
  });
  document.querySelectorAll('[data-cart-close]').forEach(btn => {
    btn.addEventListener('click', closeCart);
  });
  document.getElementById('cart-backdrop')?.addEventListener('click', closeCart);

  document.getElementById('cart-drawer')?.addEventListener('click', (e) => {
    const line = e.target.closest('[data-variant-id]');
    if (!line) return;
    const vid = Number(line.getAttribute('data-variant-id'));
    const state = Cart.get();
    const item = state.items.find(it => it.variant_id === vid);
    if (!item) return;

    if (e.target.closest('[data-cart-increment]')) {
      Cart.update(vid, item.quantity + 1);
    } else if (e.target.closest('[data-cart-decrement]')) {
      Cart.update(vid, item.quantity - 1);
    } else if (e.target.closest('[data-cart-remove]')) {
      Cart.remove(vid);
    }
  });

  document.querySelector('[data-checkout]')?.addEventListener('click', () => {
    const state = Cart.get();
    if (state.items.length === 0) return;
    toast('Demo checkout — on Shopify this hits /checkout');
  });

  window.addEventListener('cart:updated', () => {
    renderCartBadge();
    renderCartDrawer();
  });
}

/* ---------- Section loader (mirrors Shopify's {% section 'x' %}) ---------- */
async function loadSections() {
  const slots = document.querySelectorAll('[data-section]');
  await Promise.all(Array.from(slots).map(async (slot) => {
    const name = slot.getAttribute('data-section');
    try {
      const res = await fetch(`sections/${name}.html`);
      slot.innerHTML = await res.text();
    } catch (err) {
      console.error(`Failed to load section: ${name}`, err);
    }
  }));
  const y = document.getElementById('footer-year');
  if (y) y.textContent = new Date().getFullYear();
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  Cart._load();
  await loadSections();
  renderCartBadge();
  renderCartDrawer();
  wireGlobalUI();

  try {
    await renderHome();
    await renderCollection();
    await renderProduct();
  } catch (err) {
    console.error(err);
  }
});

window.Sonido = { ShopAPI, Cart, formatMoney };
