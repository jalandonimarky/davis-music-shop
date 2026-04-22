# Sonido Musical — Shopify-Ready Instrument Shop

A local, static build of a musical-instrument e-commerce site whose folder
structure, data shape, and rendering patterns mirror a Shopify theme (Dawn-style).
Preview runs on any static server. Migration to Shopify is a lift-and-shift of
the Liquid equivalents.

## Run locally

```bash
cd music-shop

# option A (zero deps, built-in on macOS)
python3 -m http.server 4321

# option B (Node)
npx serve -l 4321 .
```

Open http://localhost:4321

## Folder layout — mapped to Shopify theme structure

```
music-shop/
├── assets/          → Shopify assets/ (theme.css, theme.js, images)
├── config/          → Shopify config/ (settings_schema.json, settings_data.json)
├── layout/          → Shopify layout/theme.liquid (reference)
├── locales/         → Shopify locales/
├── sections/        → Shopify sections/*.liquid (header, footer, hero, cart-drawer)
├── snippets/        → Shopify snippets/ (reference — helpers inlined in theme.js)
├── templates/       → Shopify templates/ (reference; static pages at root)
├── data/
│   └── products.json ← Shopify product object shape (handle, variants, options…)
├── index.html       ← templates/index.liquid
├── collection.html  ← templates/collection.liquid
└── product.html     ← templates/product.liquid
```

## Shopify-compatible data shape

`data/products.json` uses the Shopify product schema:

- `id`, `title`, `handle`, `description`, `vendor`, `product_type`, `tags`
- `options[]` with `{name, position, values}`
- `variants[]` with `{id, title, option1, price, compare_at_price, sku, available, inventory_quantity}`
- `featured_image`, `images[]`

This is the exact response shape of Shopify's `/products/{handle}.js` and
`/products.json` endpoints. When migrating, point `ShopAPI` at those endpoints
instead of the local JSON.

## Migration checklist (static → Shopify)

1. **Create a new Shopify theme** (`shopify theme init`).
2. **Copy `assets/theme.css` and `assets/theme.js`** verbatim into the theme's `assets/`.
3. **Replace `ShopAPI.load()`** with native Shopify endpoints:
   - `GET /products.json` for collection/listing
   - `GET /products/{handle}.js` for product detail
   - `POST /cart/add.js`, `GET /cart.js`, `POST /cart/update.js` for cart
4. **Rebuild pages as Liquid templates**:
   - `index.html` → `templates/index.liquid` + `sections/hero.liquid` + `sections/featured-products.liquid`
   - `collection.html` → `templates/collection.liquid` (uses `{{ collection.products }}`)
   - `product.html` → `templates/product.liquid` (uses `{{ product }}` object)
5. **Convert section HTML files in `sections/` to `.liquid`** and reference via `{% section 'name' %}` in `layout/theme.liquid`.
6. **Extract `productCardHTML()`** to `snippets/card-product.liquid`.
7. **Replace `formatMoney()`** with Liquid's `| money` filter.
8. **Replace `localStorage` cart** with Shopify's native cart AJAX API (already matches shape).
9. **Map `config/settings_schema.json`** — already in Shopify format.

## What's faked vs. real

| Area        | Local build                          | Shopify equivalent                           |
| ----------- | ------------------------------------ | -------------------------------------------- |
| Product data | `data/products.json`                 | Shopify Admin → Products                     |
| Cart        | `localStorage`                       | `/cart.js` AJAX API                          |
| Checkout    | Toast notification                   | `/checkout`                                  |
| Sections    | `fetch('sections/x.html')`           | `{% section 'x' %}` Liquid tag               |
| Money       | `Intl.NumberFormat`                  | `{{ amount | money }}`                       |
| Images      | Local SVGs                           | Shopify CDN (`{{ product.featured_image | img_url }}`) |

## Pages

- **Home** (`index.html`) — Hero + featured products grid
- **Collection** (`collection.html?collection=<handle>`) — Filterable listing
- **Product** (`product.html?handle=<handle>`) — Variant picker, qty, add-to-cart
- **Cart** — Drawer (slide-in), accessible from every page

## Tech

Vanilla HTML + CSS + JS, zero build step. Google Fonts (Fraunces) loaded over CDN.
