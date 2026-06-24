# Interview Preparation

## Q&A

---

### 1. Why did you choose FastAPI?

FastAPI is the most practical choice for this kind of lightweight pricing API. It gives you automatic Swagger docs at `/docs` with zero config, which is great for demos. Request and response validation comes from Pydantic, so you get type safety without writing any extra code. It handles async natively, which matters when you add a database layer later. And compared to Flask or Django REST Framework, the boilerplate is minimal — the entire working API is under 40 lines of code. Railway also detects Python automatically, so deployment friction is low.

---

### 2. How does Shopify communicate with the backend?

There's no Shopify server involved in the API call. The Liquid template renders the widget HTML with the product ID baked in as a `data-product-id` attribute. When the customer clicks "Check Price", a Vanilla JS `fetch()` call fires directly from the customer's browser to the Railway URL. It's a standard cross-origin POST request. The FastAPI backend has CORS middleware that allows it. Shopify itself never touches the API — the browser does.

---

### 3. How would you store pricing in production?

PostgreSQL. The table structure would be:

```sql
CREATE TABLE zip_pricing (
  id          SERIAL PRIMARY KEY,
  product_id  VARCHAR(50)  NOT NULL,
  zip_code    VARCHAR(10)  NOT NULL,
  price       INTEGER      NOT NULL,
  UNIQUE (product_id, zip_code)
);

CREATE INDEX idx_zip_pricing_lookup ON zip_pricing (zip_code, product_id);
```

On Railway you'd add a Postgres plugin to the same project. SQLAlchemy or asyncpg handles the connection. The lookup becomes a single indexed query. Merchants could manage prices through a Shopify admin panel or a CSV import.

---

### 4. How would you support 100,000 ZIP codes?

Three changes:

1. **Database**: Move from in-memory dict to PostgreSQL with an index on `(zip_code, product_id)`. Single-row indexed reads are O(log n) regardless of table size.

2. **Redis cache**: Before hitting the database, check Redis for `zip:{zip_code}:product:{product_id}`. If it's there, return it in under 1ms. If not, query DB and write to cache with a 5-minute TTL.

3. **Regional fallback**: If a specific ZIP isn't in the database, fall back to the 3-digit ZIP prefix, then state-level pricing, then the national default. This avoids 100% database coverage being required to launch.

---

### 5. How would you cache pricing?

```python
import redis.asyncio as aioredis

cache = aioredis.from_url("redis://your-redis-url")

@app.post("/api/get-price")
async def get_price(request: PriceRequest):
    key = f"price:{request.productId}:{request.zipCode}"
    cached = await cache.get(key)
    if cached:
        return {"price": int(cached)}

    price = await db_lookup(request.productId, request.zipCode)
    await cache.setex(key, 300, price)   # 5-min TTL
    return {"price": price}
```

Cache invalidation happens via a webhook or admin action when prices change. Railway has a managed Redis plugin.

---

### 6. How would you secure the API?

For production:

1. **Restrict CORS**: Change `allow_origins=["*"]` to `allow_origins=["https://your-store.myshopify.com"]`.

2. **API key header**: Issue a key stored in Shopify theme settings, validated on every request:
   ```python
   API_KEY = os.environ["API_KEY"]
   
   def verify_key(x_api_key: str = Header()):
       if x_api_key != API_KEY:
           raise HTTPException(status_code=401)
   ```

3. **Rate limiting**: Use `slowapi` to cap requests per IP (e.g. 60/minute).

4. **HTTPS only**: Railway provides TLS automatically.

5. **Input sanitization**: Already done — Pydantic validates types, ZIP regex blocks injection attempts.

---

### 7. How would you support multiple products?

The `productId` field is already in the request body. The pricing engine just needs to use it:

```python
# Dict approach (small catalogue)
PRICING = {
    "gid://shopify/Product/7892345": {"75028": 1499, "10001": 1699},
    "gid://shopify/Product/7892346": {"75028": 899,  "10001": 999},
}

price = PRICING.get(request.productId, {}).get(request.zipCode, DEFAULT_PRICE)
```

Or with a database, the compound key `(product_id, zip_code)` handles it automatically. A merchant admin UI would let store owners upload a CSV mapping products × ZIPs × prices.

---

### 8. Why use a Shopify extension instead of editing the theme directly?

Three reasons:

1. **Portability**: A theme app extension block is theme-agnostic. If the merchant switches from Dawn to Craft, they don't lose the widget — it's reinstalled as a block.

2. **Upgrade safety**: Direct theme edits get wiped when the theme updates. An extension survives theme updates.

3. **Merchant control**: Blocks are configurable in the theme customizer without touching code. Merchants can set the API URL, reposition the widget, or disable it per-section — no developer needed.

For this demo the snippet approach is faster to set up, which is why both options are provided. In a real Shopify app submission, the block approach is the correct one.

---

## Manual Test Cases

| # | Input | Expected Result | Pass |
|---|-------|----------------|------|
| TC-01 | ZIP = `75028` | Price displays **$1,499** | ☐ |
| TC-02 | ZIP = `10001` | Price displays **$1,699** | ☐ |
| TC-03 | ZIP = `90210` | Price displays **$1,799** | ☐ |
| TC-04 | ZIP = `55555` | Price displays **$1,999** (default) | ☐ |
| TC-05 | ZIP = *(empty)* | Error: "Please enter a ZIP code" | ☐ |
| TC-06 | ZIP = `abc12` | Error: "valid 5-digit ZIP" | ☐ |
| TC-07 | ZIP = `75028`, then `10001` | Price updates each time correctly | ☐ |
| TC-08 | API down / wrong URL | Error message shown, button re-enabled | ☐ |

---

## API Test — cURL

```bash
# TC-01
curl -s -X POST YOUR_RAILWAY_URL/api/get-price \
  -H "Content-Type: application/json" \
  -d '{"productId":"123","zipCode":"75028"}' | python3 -m json.tool
# Expected: {"price": 1499}

# TC-02
curl -s -X POST YOUR_RAILWAY_URL/api/get-price \
  -H "Content-Type: application/json" \
  -d '{"productId":"123","zipCode":"10001"}' | python3 -m json.tool
# Expected: {"price": 1699}

# TC-03
curl -s -X POST YOUR_RAILWAY_URL/api/get-price \
  -H "Content-Type: application/json" \
  -d '{"productId":"123","zipCode":"90210"}' | python3 -m json.tool
# Expected: {"price": 1799}

# TC-04
curl -s -X POST YOUR_RAILWAY_URL/api/get-price \
  -H "Content-Type: application/json" \
  -d '{"productId":"123","zipCode":"55555"}' | python3 -m json.tool
# Expected: {"price": 1999}
```

---

## 2–3 Minute Video Demo Script

```
[0:00 - 0:20] Introduction
"Hi, I'm [Name]. This is my solution for the Shopify ZIP Code Based Product
Pricing assignment. I built a FastAPI backend on Railway and a Shopify
Liquid widget that calls it in real time."

[0:20 - 0:40] Show Shopify product page
"Here's my Shopify development store. You can see the product —
Premium Wireless Headphones — with a default price of $1,999.
Below the price, there's the ZIP code input and the Check Price button."

[0:40 - 1:15] Live demos
"Let me enter ZIP 75028." [type, click] "Price updates to $1,499."
"ZIP 10001." [type, click] "Now it's $1,699."
"ZIP 90210." [type, click] "$1,799."
"Unknown ZIP 55555." [type, click] "Falls back to the default $1,999."
"If I enter nothing and click —" [click] "— I get a validation error."

[1:15 - 1:45] Architecture walkthrough
"The widget is a Liquid snippet embedded in the theme's product section.
When the customer clicks Check Price, Vanilla JS fires a fetch POST
directly from the browser to the FastAPI backend on Railway.
The backend looks up the ZIP in a Python dictionary and returns the price.
The JS receives the JSON and updates the price span in the DOM.
No page reload."

[1:45 - 2:00] Show Railway backend
"Here's the Railway dashboard. The API is live at this URL.
Let me hit the /docs endpoint — FastAPI auto-generates Swagger UI.
I can test it right here." [run a test from Swagger]

[2:00 - 2:20] Scaling answer
"For production, I'd replace the dictionary with a PostgreSQL table,
add a Redis cache layer, restrict CORS to the store domain, and
move the widget to a proper Shopify Theme App Extension block
so it survives theme updates."

[2:20 - 2:30] Close
"Total build time was approximately [X] hours. Code is on GitHub at
github.com/YOUR_USERNAME/shopify-zip-pricing-demo. Happy to walk
through any part of the implementation."
```
