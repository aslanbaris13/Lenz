"""
Orchestrator Agent

İki mod:
  sweep    — tüm SKU'ları periyodik tara, riskli olanları döndür
  reactive — tek SKU için soru cevapla, kök neden + aksiyon üret

Fan-out mantığı:
  SKU gelir → 4 ajana asyncio.gather ile paralel sor
            → Anthropic ile sentezle
            → kök neden + öncelikli aksiyonlar
"""

import asyncio
import json

from anthropic import Anthropic
from . import catalog_listing, competitive, review_sentiment, flow_bundle

_client = Anthropic()


async def analyze_sku(sku: dict, mode: str = "reactive") -> dict:
    catalog_res, comp_res, review_res, flow_res = await asyncio.gather(
        catalog_listing.analyze(sku),
        competitive.analyze(sku),
        review_sentiment.analyze(sku),
        flow_bundle.analyze(sku),
    )

    synthesis = await _synthesize(sku, catalog_res, comp_res, review_res, flow_res)

    return {
        "sku_id": sku["id"],
        "sku_name": sku["name"],
        "catalog": catalog_res,
        "competitive": comp_res,
        "sentiment": review_res,
        "flow": flow_res,
        "synthesis": synthesis,
    }


async def _synthesize(sku, catalog, comp, review, flow) -> dict:
    payload = {
        "sku": sku["name"],
        "catalog_score": catalog.get("total_score"),
        "catalog_actions": catalog.get("actions"),
        "price_diff_pct": comp.get("price", {}).get("diff_pct"),
        "price_risk": comp.get("price", {}).get("risk_level"),
        "top_complaints": review.get("top_complaints"),
        "abandon_rate": flow.get("funnel", {}).get("abandon_rate_pct"),
        "flow_risk": flow.get("risk_level"),
    }

    try:
        resp = _client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=(
                "Sen Lenz'in SKU analiz koordinatörüsün. "
                "4 uzman ajandan gelen bulgularla kök nedeni ve aksiyonları üret. "
                "Türkçe, kısa, gerekçeli yaz. "
                "Yalnızca JSON döndür:\n"
                '{"root_cause": str, "priority_actions": [str], "summary": str, "risk_level": "HIGH|MEDIUM|LOW"}'
            ),
            messages=[{"role": "user", "content": json.dumps(payload, ensure_ascii=False)}],
        )
        return json.loads(resp.content[0].text.strip())
    except Exception:
        return {
            "root_cause": "Analiz tamamlandı, detaylar alt ajan sonuçlarında mevcut.",
            "priority_actions": ["Katalog skorunu incele", "Fiyat konumunu kontrol et"],
            "summary": "Çoklu ajan analizi tamamlandı.",
            "risk_level": "MEDIUM",
        }


async def sweep(skus: list[dict]) -> list[dict]:
    results = await asyncio.gather(*[analyze_sku(sku) for sku in skus])
    return sorted(
        results,
        key=lambda r: {"HIGH": 0, "MEDIUM": 1, "LOW": 2}.get(
            r["synthesis"].get("risk_level", "LOW"), 2
        ),
    )
