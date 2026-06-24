# Shopify ZIP Code Based Product Pricing Demo

A working demo that shows different product prices based on the customer's ZIP code, built with a Shopify storefront widget and a FastAPI backend deployed on Railway.

---

## Project Overview

When a customer visits a Shopify product page, they see a ZIP code input field next to the price. After entering their ZIP and clicking **Check Price**, the frontend calls a FastAPI backend that returns the correct price for that location. The price updates instantly without any page reload.

---

## Architecture

```
Customer Browser
      │
      ▼
Shopify Storefront  ──renders──▶  Product Page
                                       │
                                  ZIP Widget (Liquid + JS)
                                       │  fetch POST /api/get-price
                                       ▼
                              FastAPI on Railway
                                       │
                                  Pricing Engine
                                       │  returns { price }
                                       ▼
                              ZIP Widget updates price
```

See [docs/architecture.md](docs/architecture.md) for full explanation.

---

## Pricing Rules (Hardcoded)

| ZIP Code | Price |
|----------|-------|
| 75028    | $1,499 |
| 10001    | $1,699 |
| 90210    | $1,799 |
| Any other | $1,999 (default) |

---

## Repository Structure

```
shopify-zip-pricing-demo/
├── backend/
│   ├── main.py             # FastAPI app with /api/get-price endpoint
│   ├── requirements.txt    # Python dependencies
│   └── README.md           # Backend-specific docs
│
├── shopify-extension/
│   ├── assets/
│   │   └── zip-price-widget.js       # Vanilla JS widget (upload to Shopify Assets)
│   ├── blocks/
│   │   └── zip-price-widget.liquid   # Theme App Extension block
│   └── snippets/
│       └── zip-price-widget-snippet.liquid  # Liquid snippet fallback
│
├── docs/
│   ├── architecture.md    # System design, component explanation
│   └── deployment.md      # Step-by-step Shopify + Railway deploy guide
│
└── README.md              # This file
```

---

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API available at: `http://localhost:8000`

Swagger UI: `http://localhost:8000/docs`

### Test the API locally

```bash
# ZIP with custom price
curl -X POST http://localhost:8000/api/get-price \
  -H "Content-Type: application/json" \
  -d '{"productId": "123", "zipCode": "75028"}'
# → {"price":1499}

# Unknown ZIP → default price
curl -X POST http://localhost:8000/api/get-price \
  -H "Content-Type: application/json" \
  -d '{"productId": "123", "zipCode": "55555"}'
# → {"price":1999}
```

---

## Deployment

See [docs/deployment.md](docs/deployment.md) for complete steps.

**TL;DR:**

1. Deploy `backend/` to Railway → get public URL
2. Create Shopify Partner account → create Development Store → create product
3. Add `zip-price-widget.js` to Shopify theme Assets
4. Render snippet below product price in `main-product.liquid`
5. Test all four ZIP codes on product page

---

## API Documentation

### POST /api/get-price

**Request**

```json
{
  "productId": "string",
  "zipCode": "string"
}
```

**Response (200)**

```json
{
  "price": 1499
}
```

**Error (400) — empty zipCode**

```json
{
  "detail": "zipCode is required"
}
```

---

## Manual Test Cases

| # | ZIP Code | Expected Price | Pass Criteria |
|---|----------|---------------|---------------|
| 1 | 75028 | $1,499 | Price display updates to $1,499 |
| 2 | 10001 | $1,699 | Price display updates to $1,699 |
| 3 | 90210 | $1,799 | Price display updates to $1,799 |
| 4 | 55555 | $1,999 | Unknown ZIP returns default price |
| 5 | (empty) | Error message | "Please enter a ZIP code" shown, price unchanged |
| 6 | `abc12` | Error message | "Valid 5-digit ZIP" shown, no API call made |
| 7 | 75028 again | $1,499 | Customer can re-enter ZIP and price updates again |

---

## Screenshots

> *(Add screenshots here after deploying your Shopify dev store)*

- [ ] Product page with widget visible
- [ ] After entering ZIP 75028 — price shows $1,499
- [ ] After entering ZIP 10001 — price shows $1,699
- [ ] Error state for invalid ZIP

---

## Video Demo Instructions

Record a 2–3 minute walkthrough:

1. Open Shopify development store product page
2. Show product name, default price ($1,999), and ZIP widget
3. Enter `75028` → click Check Price → price changes to $1,499
4. Enter `10001` → price changes to $1,699
5. Enter `90210` → price changes to $1,799
6. Enter `55555` → price shows $1,999 (default fallback)
7. Enter blank → show error message
8. Open Railway dashboard → show backend logs and URL
9. Open FastAPI `/docs` → show the endpoint, run a test request
10. Briefly explain: *"Frontend sends productId and ZIP to FastAPI; backend looks up the price and returns it; JavaScript updates the DOM without reload"*

---

## Future Enhancements

- [ ] PostgreSQL: move ZIP pricing to database for 100,000+ ZIPs
- [ ] Redis caching: cache per `(productId, zipCode)` for 5 minutes
- [ ] Per-product pricing: support different price tables per product variant
- [ ] Admin UI: Shopify admin panel to manage ZIP prices without code changes
- [ ] Geo-detection: auto-detect ZIP from browser geolocation as a suggestion
- [ ] Rate limiting: prevent abuse with IP-based request limits
- [ ] Analytics: log ZIP lookups to understand geographic demand

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Shopify Liquid + Vanilla JS |
| Backend API | FastAPI (Python 3.11) |
| Validation | Pydantic v2 |
| Server | Uvicorn |
| Deployment | Railway |
| Version Control | GitHub |
