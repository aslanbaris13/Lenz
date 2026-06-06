import config  # noqa: F401 — sets FAL_KEY env before anything else

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from tenants.config import get_tenant_config, create_custom_tenant
from data import get_mock_skus

app = FastAPI(title="Lenz API", version="1.0.0")

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
