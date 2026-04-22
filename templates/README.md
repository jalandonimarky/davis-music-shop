# Templates

This folder mirrors Shopify's `templates/` convention. When porting to Shopify:

| Static file          | Shopify template           | Purpose                              |
| -------------------- | -------------------------- | ------------------------------------ |
| `../index.html`      | `templates/index.liquid`   | Home page                            |
| `../collection.html` | `templates/collection.liquid` | Collection / listing page         |
| `../product.html`    | `templates/product.liquid` | Product detail page                  |
| `../cart.html`       | `templates/cart.liquid`    | Full cart page (optional drawer UX)  |
| `../404.html`        | `templates/404.liquid`     | Not-found page                       |

The top-level HTML files currently double as both layout + template to keep
the preview working with vanilla static hosting. For the Shopify port, extract
the shared shell into `layout/theme.liquid` and replace the section loader
with `{% section 'header' %}`, `{% section 'footer' %}`, etc.
