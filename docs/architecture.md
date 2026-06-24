# Architecture

## Overview

```
Customer Browser
      |
      | Opens product page
      v
Shopify Storefront  (Online Store)
      |
      | Renders product.liquid
      | Injects ZIP widget (block / snippet / asset)
      v
ZIP Code Widget  (Liquid + Vanilla JS)
      |
      | Customer enters ZIP → clicks "Check Price"
      | fetch POST /api/get-price
      v
FastAPI Backend  (Railway)
      |
      | Receives { productId, zipCode }
      | Looks up ZIP in pricing dictionary
      v
Pricing Engine  (In-memory dict — Python)
      |
      | Returns { price: XXXX }
      v
ZIP Code Widget
      |
      | Updates price display in DOM
      | No page reload
      v
Customer sees updated price
```

---

## Components

### 1. Shopify Product Page

The standard Shopify storefront renders the product page from a Liquid template. The widget is injected via one of three approaches (in order of preference):

| Approach | When to use |
|---|---|
| Theme App Extension Block | New themes (Dawn, Sense, etc.) with block-based sections |
| Liquid Snippet | Older themes using `product.liquid` templates |
| JS Asset | Any theme — upload `zip-price-widget.js` to Assets and include it |

The ZIP widget HTML is placed directly after the product price display.

### 2. ZIP Code Widget (Frontend)

- Written in plain Liquid + Vanilla JS (no React, no framework).
- Reads `product.id` from Liquid at render time and stores it in a `data-product-id` attribute.
- On "Check Price" click:
  1. Validates input (non-empty, 5-digit pattern).
  2. Shows loading state (button disabled, price dimmed, status text).
  3. Fires `fetch()` POST to `API_BASE_URL/api/get-price`.
  4. On success: updates price span in DOM.
  5. On error: shows error message.
  6. Always resets button state.

### 3. FastAPI Backend

- Python 3.11 + FastAPI + Uvicorn.
- Single endpoint: `POST /api/get-price`.
- CORS middleware allows all origins (suitable for demo; restrict in production).
- Pydantic models validate request and response shapes.
- Deployed to Railway with auto-detected Python buildpack.

### 4. Pricing Engine

Currently: a hardcoded Python dictionary keyed by ZIP string.

```python
ZIP_PRICING = {
    "75028": 1499,
    "10001": 1699,
    "90210": 1799,
}
DEFAULT_PRICE = 1999
```

Lookup: `ZIP_PRICING.get(zip_clean, DEFAULT_PRICE)`.

---

## How Shopify Calls the Backend

1. Page renders server-side on Shopify CDN — no API call yet.
2. Customer fills the ZIP input and clicks the button.
3. Browser JS fires `fetch()` directly from customer's browser to Railway URL.
4. This is a **direct browser-to-API call**, not proxied through Shopify.
5. CORS headers on FastAPI allow this cross-origin request.

---

## How ZIP Code Is Passed

```json
POST https://your-app.up.railway.app/api/get-price
Content-Type: application/json

{
  "productId": "7892345678901",
  "zipCode": "75028"
}
```

The `productId` is passed to support multi-product pricing in a real implementation. In this demo it is received but not used in the lookup.

---

## How Frontend Updates Price

```js
fetch(API + '/api/get-price', { method:'POST', ... })
  .then(res => res.json())
  .then(data => {
    priceEl.textContent = '$' + data.price.toLocaleString('en-US');
  });
```

No page reload. The `<span id="zpw-price">` is updated in place.

---

## Why FastAPI?

| Reason | Detail |
|---|---|
| Speed | One of the fastest Python frameworks (async, Starlette) |
| Auto docs | Swagger UI at `/docs` with zero config |
| Pydantic | Built-in request/response validation |
| Railway fit | Python detected automatically, minimal config |
| Interview signal | Shows familiarity with modern Python API tooling |

---

## Why Hardcoded Pricing?

The assignment explicitly states *"Prices can be hardcoded."* For a demo, hardcoded rules are:
- Instant to implement.
- Zero external dependencies.
- Easy to demonstrate and explain.

---

## How This Scales to Database Pricing

```python
# Replace the dict lookup with:
import asyncpg  # or SQLAlchemy async

@app.post("/api/get-price")
async def get_price(request: PriceRequest, db=Depends(get_db)):
    row = await db.fetchrow(
        "SELECT price FROM zip_pricing WHERE zip_code=$1 AND product_id=$2",
        request.zipCode, request.productId
    )
    price = row["price"] if row else DEFAULT_PRICE
    return {"price": price}
```

With PostgreSQL on Railway, 100,000+ ZIP codes are supported with an index on `zip_code`.

---

## Scaling to 100,000 ZIP Codes

- Store ZIP-price mappings in PostgreSQL.
- Index on `(zip_code, product_id)` for O(log n) lookups.
- Add Redis caching layer: check cache first, fallback to DB, cache result for 5 minutes.
- Use Railway's managed PostgreSQL + Redis services.

---

## Security Hardening (Production)

- Replace `allow_origins=["*"]` with your Shopify store domain.
- Add rate limiting (slowapi or Railway edge rules).
- Add API key header validation.
- Move API URL to Shopify Theme App Extension settings (not hardcoded in JS).

---

## Supporting Multiple Products

```python
ZIP_PRICING = {
    "product_123": {"75028": 1499, "10001": 1699, "90210": 1799},
    "product_456": {"75028": 899,  "10001": 999,  "90210": 1099},
}

price = ZIP_PRICING.get(request.productId, {}).get(request.zipCode, DEFAULT_PRICE)
```

Or in the database approach, the `product_id` column becomes part of the compound key.
