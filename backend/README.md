# Backend — FastAPI ZIP Pricing API

## Local Development

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API runs at: http://localhost:8000

Swagger docs: http://localhost:8000/docs

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | / | Health root |
| GET | /health | Health check |
| POST | /api/get-price | Get price for ZIP code |

## Test locally

```bash
curl -X POST http://localhost:8000/api/get-price \
  -H "Content-Type: application/json" \
  -d '{"productId": "123", "zipCode": "75028"}'
# Returns: {"price": 1499}
```

## Railway Deployment

1. Push this repo to GitHub.
2. Create a new Railway project → New Service → GitHub Repo.
3. Railway auto-detects Python; set start command:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. No environment variables required for base demo.
5. Copy the Railway public URL → paste into `zip-price-widget.js` as `API_BASE_URL`.
