# Shopify ZIP Code Based Product Pricing Demo

A working Shopify application where customers enter a ZIP code on the product page and instantly see a location-based price — no page reload.

---

## How It Works

1. Customer opens the Shopify product page
2. Enters a ZIP code and clicks **Check Price**
3. The widget sends a POST request to the FastAPI backend
4. Backend looks up the ZIP and returns the correct price
5. Price updates instantly in the browser

---

## Architecture

```
Customer Browser
      │
      ▼
Shopify Storefront  →  Product Page
                            │
                       ZIP Widget (Liquid + JS)
                            │  POST /api/get-price
                            ▼
                    FastAPI Backend (Python 3.11)
                            │
                       Pricing Engine
                            │  { price: 1499 }
                            ▼
                    Price updates in DOM
```

---

## Pricing Rules

| ZIP Code | Price |
|----------|-------|
| 75028 | $1,499 |
| 10001 | $1,699 |
| 90210 | $1,799 |
| Any other | $1,999 (default) |

---

## Project Structure

```
shopify-zip-pricing-demo/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── requirements.txt
│   ├── Procfile
│   └── README.md
├── shopify-extension/
│   ├── assets/              # JS widget
│   ├── blocks/              # Theme App Extension block
│   └── snippets/            # Liquid snippet fallback
├── docs/
│   ├── architecture.md
│   ├── architecture.png
│   └── deployment.md
└── README.md
```

---

## Local Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8002
```

API: `http://localhost:8002`
Swagger docs: `http://localhost:8002/docs`

---

## API

### POST /api/get-price

**Request**
```json
{
  "productId": "123",
  "zipCode": "75028"
}
```

**Response**
```json
{
  "price": 1499
}
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Shopify Liquid + Vanilla JS |
| Backend | FastAPI (Python 3.11) |
| Validation | Pydantic v2 |
| Server | Uvicorn |
| Tunnel | ngrok |
