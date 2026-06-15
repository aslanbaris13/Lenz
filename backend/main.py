import config  # noqa: F401 — sets FAL_KEY env before anything else

import os
import uuid

import aiofiles
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from tenants.config import get_tenant_config, create_custom_tenant
from data import get_mock_skus

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Lenz API", version="1.0.0")
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic modeller ──────────────────────────────────────

class OnboardingInput(BaseModel):
    platform: str
    category: str
    region: str
    language: str
    product_style: str | None = None
    lifestyle_preference: str | None = None


class ListingGenerateInput(BaseModel):
    image_url: str
    product_hint: str = ""
    platform: str = "etsy"


# ── Sağlık kontrolü ───────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Cihazdan görsel yükle → public URL döndür."""
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Sadece JPEG, PNG, WebP veya GIF yüklenebilir.")

    ext      = (file.filename or "image.jpg").rsplit(".", 1)[-1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    path     = os.path.join(UPLOAD_DIR, filename)

    async with aiofiles.open(path, "wb") as f:
        content = await file.read()
        await f.write(content)

    base_url = config.CORS_ORIGINS[0].replace("3000", "8000") if "3000" in config.CORS_ORIGINS[0] else "http://localhost:8000"
    return {"url": f"{base_url}/uploads/{filename}"}


# ── SKU endpoint'leri ─────────────────────────────────────

@app.get("/skus")
async def list_skus():
    return get_mock_skus()


@app.get("/skus/{sku_id}")
async def get_sku(sku_id: str):
    skus = {s["id"]: s for s in get_mock_skus()}
    if sku_id not in skus:
        raise HTTPException(status_code=404, detail="SKU bulunamadı")
    return skus[sku_id]


# ── Onboarding ────────────────────────────────────────────

@app.post("/onboarding")
async def onboarding(data: OnboardingInput):
    config_obj = create_custom_tenant(data.model_dump())
    return {"status": "ok", "config": config_obj.model_dump()}


# ── Listing üretimi ───────────────────────────────────────

@app.post("/listing/generate")
async def generate_listing(data: ListingGenerateInput):
    from pipelines.visual_generation import run_visual_pipeline

    try:
        tenant = get_tenant_config(data.platform)
        gallery = await run_visual_pipeline(
            image_url=data.image_url,
            product_hint=data.product_hint,
            tenant_config=tenant.model_dump(),
        )
        return gallery
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Ajan analizi ──────────────────────────────────────────

@app.post("/analyze/{sku_id}")
async def analyze_sku(sku_id: str):
    from agents import orchestrator

    skus = {s["id"]: s for s in get_mock_skus()}
    if sku_id not in skus:
        raise HTTPException(status_code=404, detail="SKU bulunamadı")
    return await orchestrator.analyze_sku(skus[sku_id])


@app.post("/sweep")
async def sweep_catalog():
    from agents import orchestrator

    skus = get_mock_skus()
    results = await orchestrator.sweep(skus)
    return {"results": results, "total": len(results)}


@app.get("/agents/status")
async def agents_status():
    return {
        "catalog": {"analyzed_today": 142, "avg_score": 67, "fal_calls": 23},
        "competitive": {"price_alerts": 89, "avg_diff_pct": 11.2},
        "sentiment": {"reviews_scanned": 1240, "alerts": 12},
        "flow": {"abandoned_carts": 340, "high_risk_skus": 8},
        "returns": {"return_rate_avg": 4.2, "visual_issues": 3},
    }
