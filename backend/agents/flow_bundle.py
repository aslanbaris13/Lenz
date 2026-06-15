"""
Flow + Bundle Agent

Flow modülü  — funnel analizi, terk oranı, remarketing önerisi
Bundle modülü — cross-sell önerileri, ROI hesabı
"""

import random


async def analyze(sku: dict) -> dict:
    views        = random.randint(800, 2000)
    add_to_cart  = random.randint(int(views * 0.25), int(views * 0.45))
    purchase     = random.randint(int(add_to_cart * 0.08), int(add_to_cart * 0.20))

    cart_rate     = round(add_to_cart / views * 100, 1)
    purchase_rate = round(purchase / add_to_cart * 100, 1)
    abandon_rate  = round((add_to_cart - purchase) / add_to_cart * 100, 1)

    # Ortalama terk oranı %78 — 1.15x üzeri HIGH
    risk = "HIGH" if abandon_rate > 89.7 else "MEDIUM" if abandon_rate > 82 else "LOW"

    flow_action = None
    if abandon_rate > 82:
        flow_action = {
            "type": "REMARKETING",
            "message": f"Sepetten terk eden {add_to_cart - purchase} kullanıcıya remarketing önerisi",
            "suggestion": (
                f"%{abandon_rate:.1f} terk oranı yüksek. "
                f"Sepete ekleyip terk eden {add_to_cart - purchase} kullanıcıya "
                "kişiselleştirilmiş indirim kuponu gönderilmeli."
            ),
        }

    bundle_suggestions = [
        {"product": "Koruyucu Kılıf",          "avg_margin_pct": 42.0, "co_purchase_rate_pct": 31.2, "revenue_impact": 850},
        {"product": "Ekran Koruyucu",           "avg_margin_pct": 58.0, "co_purchase_rate_pct": 24.8, "revenue_impact": 420},
        {"product": "Şarj Kablosu (Type-C)",    "avg_margin_pct": 35.0, "co_purchase_rate_pct": 19.5, "revenue_impact": 310},
    ]

    return {
        "funnel": {
            "views": views,
            "add_to_cart": add_to_cart,
            "purchase": purchase,
            "cart_rate_pct": cart_rate,
            "purchase_rate_pct": purchase_rate,
            "abandon_rate_pct": abandon_rate,
        },
        "risk_level": risk,
        "flow_action": flow_action,
        "bundle_suggestions": bundle_suggestions,
        "grounding": "Teknosa müşteri davranış verisi (mock funnel)",
    }
