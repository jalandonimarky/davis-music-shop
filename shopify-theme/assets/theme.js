/* ============================================================
   JMarky's Music Co. — Shopify theme JS
   Minimal companion to Liquid rendering. Shopify handles cart
   state server-side; this file only handles UI behaviors.
   ============================================================ */

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

async function refreshCartDrawer() {
  try {
    const res = await fetch(window.Shopify.routes.root + '?sections=cart-drawer', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const html = data['cart-drawer'];
    if (!html) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const next = doc.querySelector('#cart-drawer');
    const backdrop = doc.querySelector('#cart-backdrop');
    if (next) document.querySelector('#cart-drawer')?.replaceWith(next);
    if (backdrop && !document.querySelector('#cart-backdrop')) {
      document.body.insertBefore(backdrop, document.body.firstChild);
    }
    wireCartDrawer();
    updateCartCount();
  } catch (err) {
    console.error('cart refresh failed', err);
  }
}

async function updateCartCount() {
  try {
    const res = await fetch('/cart.js', { cache: 'no-store' });
    if (!res.ok) return;
    const cart = await res.json();
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = cart.item_count;
    });
  } catch (err) { /* noop */ }
}

function wireCartDrawer() {
  document.querySelectorAll('[data-cart-open]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCart();
    });
  });
  document.querySelectorAll('[data-cart-close]').forEach(btn => {
    btn.addEventListener('click', closeCart);
  });
}

function wireQuantity() {
  document.querySelectorAll('[data-qty-dec]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.quantity')?.querySelector('[data-qty-input]');
      if (input) input.value = Math.max(1, Number(input.value) - 1);
    });
  });
  document.querySelectorAll('[data-qty-inc]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.quantity')?.querySelector('[data-qty-input]');
      if (input) input.value = Number(input.value) + 1;
    });
  });
}

function wireAddToCart() {
  const form = document.getElementById('product-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    if (!window.fetch) return;
    e.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.setAttribute('disabled', '');

    try {
      const fd = new FormData(form);
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        body: fd,
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.description || 'Could not add to cart.');
        return;
      }
      await refreshCartDrawer();
      openCart();
    } catch (err) {
      console.error(err);
      form.submit();
    } finally {
      if (submit) submit.removeAttribute('disabled');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  wireCartDrawer();
  wireQuantity();
  wireAddToCart();
  document.getElementById('cart-backdrop')?.addEventListener('click', closeCart);
});
