"""
Review Sentiment Agent

- Ürün yorumlarını tara (mock veya gerçek)
- Tekrarlayan şikayetleri bul
- Olumlu yönleri açıklamaya dönüştür
- Teknik servis uyarısı üret
"""

import random


_MOCK_COMPLAINTS = [
    [
        {"issue": "Pil ömrü kısa",       "count": 34, "pct": 38.2},
        {"issue": "Kurulum zor",          "count": 21, "pct": 23.6},
        {"issue": "Fiyat yüksek",         "count": 18, "pct": 20.2},
    ],
    [
        {"issue": "Görsel yanıltıcı",     "count": 28, "pct": 42.4},
        {"issue": "Teslimat gecikmesi",   "count": 15, "pct": 22.7},
        {"issue": "Ambalaj hasarlı",      "count": 12, "pct": 18.2},
    ],
    [
        {"issue": "Gürültülü",            "count": 47, "pct": 51.6},
        {"issue": "Montaj zor",           "count": 31, "pct": 34.1},
        {"issue": "Renk farklı",          "count": 13, "pct": 14.3},
    ],
]

_MOCK_POSITIVES = [
    [
        {"strength": "Hızlı şarj",        "count": 56},
        {"strength": "Kompakt tasarım",   "count": 43},
        {"strength": "Kaliteli malzeme",  "count": 38},
    ],
    [
        {"strength": "Kolay kullanım",    "count": 62},
        {"strength": "Fiyat/performans",  "count": 49},
        {"strength": "Güzel paketleme",   "count": 31},
    ],
]


async def analyze(sku: dict) -> dict:
    complaints = random.choice(_MOCK_COMPLAINTS)
    positives  = random.choice(_MOCK_POSITIVES)
    total      = random.randint(80, 420)
    avg_rating = round(random.uniform(3.4, 4.7), 1)

    description_additions = [p["strength"] for p in positives]

    service_alert = None
    high_complaint = next((c for c in complaints if c["pct"] > 40), None)
    if high_complaint:
        service_alert = (
            f"'{high_complaint['issue']}' şikayeti %{high_complaint['pct']:.1f} oranında — "
            "teknik servis / ürün ekibine iletilmeli."
        )

    return {
        "total_reviews": total,
        "avg_rating": avg_rating,
        "top_complaints": complaints,
        "top_positives": positives,
        "description_additions": description_additions,
        "service_alert": service_alert,
        "grounding": "Teknosa + Hepsiburada + Trendyol yorum taraması (mock)",
    }
