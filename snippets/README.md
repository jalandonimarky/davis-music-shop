# Snippets

Shopify-style reusable partials. In this static build, snippets are inlined as
helper functions inside `assets/theme.js` — when porting to Shopify, extract:

| Helper in theme.js     | Shopify snippet               |
| ---------------------- | ----------------------------- |
| `productCardHTML()`    | `snippets/card-product.liquid` |
| `formatMoney()`        | `snippets/price.liquid` (uses `money` filter) |
| `renderCartDrawer()`   | `snippets/cart-drawer.liquid` |
