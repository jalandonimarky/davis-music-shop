# JMarky's Music Co. — Shopify Theme

A clean, Dawn-inspired Shopify theme for musical-instrument shops.

## Install

1. Zip the **contents** of this folder (not this folder itself) so `layout/`, `templates/`, `sections/`, etc. are at the root of the zip.
2. In Shopify admin: **Online Store → Themes → Upload theme → Add theme**.
3. Customize via **Customize** (sections/blocks) and **Theme settings** (colors, fonts, favicon).

## Structure

```
layout/theme.liquid          Master layout
templates/                   Page templates (index, product, collection, cart, 404, etc.)
sections/                    Customizable sections (header, footer, hero, featured-products, main-product, main-collection, main-cart, cart-drawer)
snippets/                    Reusable partials (card-product, price)
assets/                      theme.css, theme.js, images
config/                      Theme settings (settings_schema.json, settings_data.json)
locales/                     Translations (en.default.json)
```

## What's included

- Full responsive layout (mobile-optimized)
- Header with logo + menu + cart drawer
- Hero section (customizable text, image, CTAs)
- Featured products section (pick any collection)
- Product detail page with variant dropdown + qty selector
- Collection listing with pagination
- Cart drawer (AJAX add-to-cart via `/cart/add.js`)
- Full cart page, 404, search, page, blog, article templates
- Collection list template
