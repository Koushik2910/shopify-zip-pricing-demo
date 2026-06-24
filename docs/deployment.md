# Deployment Guide

## Prerequisites

- GitHub account
- Railway account (free tier works: https://railway.app)
- Shopify Partner account (free: https://partners.shopify.com)

---

## 1. Deploy Backend to Railway

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/shopify-zip-pricing-demo.git
git push -u origin main
```

### Step 2 — Create Railway Project

1. Go to https://railway.app → **New Project**
2. Select **Deploy from GitHub Repo**
3. Choose `shopify-zip-pricing-demo`
4. Railway auto-detects Python

### Step 3 — Set Start Command

In Railway project → **Settings** → **Deploy** → set:

```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set **Root Directory** to `/backend`.

### Step 4 — Environment Variables

No required env vars for this demo. Optional:

| Variable | Value | Purpose |
|---|---|---|
| `PORT` | Auto-set by Railway | HTTP port |
| `ENVIRONMENT` | `production` | Future flag use |

### Step 5 — Get Public URL

After deploy, Railway shows a URL like:
```
https://shopify-zip-pricing-demo-production.up.railway.app
```

Copy this URL — you will need it in the Shopify step.

### Step 6 — Verify

```bash
curl https://YOUR-URL.up.railway.app/health
# Returns: {"status":"healthy"}

curl -X POST https://YOUR-URL.up.railway.app/api/get-price \
  -H "Content-Type: application/json" \
  -d '{"productId":"123","zipCode":"75028"}'
# Returns: {"price":1499}
```

---

## 2. Set Up Shopify Development Store

### Step 1 — Create Shopify Partner Account

1. Go to https://partners.shopify.com
2. Sign up (free)
3. Complete partner profile

### Step 2 — Create Development Store

1. In Shopify Partners dashboard → **Stores** → **Add store**
2. Select **Development store**
3. Choose **Create a store to test and build**
4. Name it `zip-pricing-demo` (or anything)
5. Click **Save**

### Step 3 — Create Sample Product

1. Open your development store admin
2. Go to **Products** → **Add product**
3. Fill in:
   - **Title**: `Premium Wireless Headphones`
   - **Description**: `High-quality wireless headphones with noise cancellation.`
   - **Price**: `1999` (this is the default/fallback price)
   - **SKU**: `WH-1000`
4. Add a product image (optional)
5. Click **Save**
6. Note the product ID from the URL: `/admin/products/PRODUCT_ID`

---

## 3. Add ZIP Widget to Shopify Theme

### Option A — Theme App Extension Block (Recommended)

Use this for Dawn, Sense, Craft, and other modern Shopify themes.

1. In Shopify Admin → **Online Store** → **Themes** → **Customize**
2. Navigate to a product page
3. In the left panel → **Add block** → **Apps**
4. Find **ZIP Price Checker**
5. In block settings → set **Backend API URL** to your Railway URL
6. Save

### Option B — Edit Theme Code (Simplest for Demo)

1. In Shopify Admin → **Online Store** → **Themes** → **...** → **Edit code**

2. Under **Assets** → upload `zip-price-widget.js`
   - Change `API_BASE_URL` on line 1 to your Railway URL first

3. Under **Snippets** → **Add a new snippet** → name it `zip-price-widget-snippet`
   - Paste content from `shopify-extension/snippets/zip-price-widget-snippet.liquid`
   - Change the `api_url` variable to your Railway URL

4. Under **Sections** → open `main-product.liquid` (or `product-template.liquid`)
   - Find the line with `{{ product.price | money }}`
   - Add below it:
     ```liquid
     {% render 'zip-price-widget-snippet', product: product %}
     ```

5. Save all files

6. Preview the product page — the ZIP widget should appear below the price.

---

## 4. Test End-to-End

1. Open your Shopify development store product page
2. You should see:
   - Product name
   - Current price ($1,999)
   - ZIP code input field
   - "Check Price" button
3. Enter `75028` → click **Check Price** → price updates to **$1,499**
4. Enter `10001` → price updates to **$1,699**
5. Enter `90210` → price updates to **$1,799**
6. Enter `55555` → price updates to **$1,999** (default)
7. Enter invalid zip → error message shown, no price change
