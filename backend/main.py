from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Shopify ZIP Pricing API",
    description="Returns product price based on ZIP code",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ZIP_PRICING: dict[str, int] = {
    "75028": 1499,
    "10001": 1699,
    "90210": 1799,
}

DEFAULT_PRICE = 1999


class PriceRequest(BaseModel):
    productId: str
    zipCode: str


class PriceResponse(BaseModel):
    price: int


@app.get("/")
def root():
    return {"status": "ok", "service": "Shopify ZIP Pricing API"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/api/get-price", response_model=PriceResponse)
def get_price(request: PriceRequest):
    if not request.zipCode or not request.zipCode.strip():
        raise HTTPException(status_code=400, detail="zipCode is required")

    zip_clean = request.zipCode.strip()
    price = ZIP_PRICING.get(zip_clean, DEFAULT_PRICE)

    return PriceResponse(price=price)
