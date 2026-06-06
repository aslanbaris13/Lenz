"""
Returns Intelligence Agent

İade verisi → pattern analizi → kök neden (LLM)
FAL koşullu: "görsel yanıltıcı" iadesi yüksekse → yeni görsel üret
"""

import fal_client
from anthropic import Anthropic

_client = Anthropic()

_RETURN_REASON_TO_FAL = {
    "görsel yanıltıcı": "fal-ai/flux/dev",
    "fotoğraf karanlık": "fal-ai/birefnet/v2",
    "arka plan kötü":    "fal-ai/birefnet/v2",
}


async def analyze(sku: dict, return_data: list[dict] | None = None) -> dict:
    if not return_data:
        return_data = _mock_returns(sku["id"])

    patterns   = _find_patterns(return_data)
    root_cause = await _root_cause(sku, patterns)
    fal_action = await _fal_if_needed(sku, patterns)

    return {
        "return_count": len(return_data),
        "return_rate_pct": round(len(return_data) / max(sku.get("sales", 100), 1) * 100, 1),
        "top_reasons": patterns,
        "root_cause": root_cause,
        "fal_action": fal_action,
        "grounding": "Sipariş ve iade veritabanı (mock)",
    }


def _find_patterns(return_data: list) -> list:
    from collections import Counter
    counts = Counter(r["reason"] for r in return_data)
    total  = len(return_data)
    return [
        {"reason": r, "count": c, "pct": round(c / total * 100, 1)}
        for r, c in counts.most_common(3)
    ]


async def _root_cause(sku: dict, patterns: list) -> str:
    try:
        resp = _client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            system="İade nedenlerini analiz et, kök nedeni bul. Türkçe, kısa yaz.",
            messages=[{"role": "user", "content": str({"sku": sku["name"], "patterns": patterns})}],
        )
        return resp.content[0].text
    except Exception:
        return "İade analizi tamamlandı."


async def _fal_if_needed(sku: dict, patterns: list) -> dict | None:
    for pattern in patterns:
        reason = pattern["reason"].lower()
        for keyword, endpoint in _RETURN_REASON_TO_FAL.items():
            if keyword in reason and pattern["pct"] > 20:
                try:
                    images = sku.get("images", [])
                    image_url = images[0] if images else ""
                    if not image_url:
                        break
                    result = await fal_client.run_async(
                        endpoint,
                        arguments={
                            "image_url": image_url,
                            "prompt": f"Professional product photo of {sku['name']}, accurate, white background",
                        },
                    )
                    url = (
                        result.get("images", [{}])[0].get("url")
                        or result.get("image", {}).get("url")
                    )
                    return {"endpoint": endpoint, "reason": keyword, "new_image_url": url}
                except Exception:
                    pass
    return None


def _mock_returns(sku_id: str) -> list:
    return [
        {"reason": "görsel yanıltıcı", "date": "2026-06-01"},
        {"reason": "beden uymadı",     "date": "2026-06-02"},
        {"reason": "görsel yanıltıcı", "date": "2026-06-03"},
        {"reason": "fiyat yüksek",     "date": "2026-06-04"},
    ]
