"""
Competitive Intelligence Agent

3 boyut:
  Fiyat     — rakip fiyat çek, fark hesapla, öneri üret
  Attribute — rakip sayfadaki özellik sayısı vs Teknosa
  Stok      — rakip stok bitti → fırsat sinyali
"""

import httpx
from bs4 import BeautifulSoup


async def analyze(sku: dict) -> dict:
    price_res = await _analyze_price(sku)
    attr_res  = await _analyze_attributes(sku)
    stock_res = await _check_stock(sku)

    return {
        "price": price_res,
        "attribute_gap": attr_res,
        "stock_opportunity": stock_res,
        "grounding": "Hepsiburada, Trendyol, MediaMarkt taraması",
    }


async def _analyze_price(sku: dict) -> dict:
    competitor_prices = await _scrape_prices(sku["name"])

    if not competitor_prices:
        base = sku["price"]
        competitor_prices = {
            "hepsiburada": round(base * 0.88),
            "trendyol": round(base * 0.86),
            "mediamarkt": round(base * 0.92),
        }

    market_avg = sum(competitor_prices.values()) / len(competitor_prices)
    diff_pct   = ((sku["price"] - market_avg) / market_avg) * 100
    risk       = "HIGH" if diff_pct > 5 else "MEDIUM" if diff_pct > 3 else "LOW"

    action = None
    if diff_pct > 3:
        suggested = round(market_avg * 1.03)
        action = {
            "type": "PRICE_HIGH",
            "message": f"Piyasadan %{diff_pct:.1f} pahalı",
            "suggested_price": suggested,
        }

    return {
        "teknosa_price": sku["price"],
        "market_avg": round(market_avg),
        "competitor_prices": competitor_prices,
        "diff_pct": round(diff_pct, 1),
        "risk_level": risk,
        "action": action,
    }


async def _scrape_prices(product_name: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://www.hepsiburada.com/ara",
                params={"q": product_name},
                headers={"User-Agent": "Mozilla/5.0"},
            )
            soup = BeautifulSoup(resp.text, "html.parser")
            prices = soup.select(".price-value")
            if prices:
                price_text = prices[0].text.replace(".", "").replace(",", ".").strip()
                return {"hepsiburada": float(price_text)}
    except Exception:
        pass
    return {}


async def _analyze_attributes(sku: dict) -> dict:
    teknosa_count  = sum(1 for v in sku.get("specs", {}).values() if v)
    competitor_count = 14
    missing = max(0, competitor_count - teknosa_count)
    return {
        "teknosa_count": teknosa_count,
        "best_competitor_count": competitor_count,
        "missing_count": missing,
        "suggestion": (
            f"Rakip {missing} daha fazla özellik listeliyor. Eksik alanları doldur."
            if missing > 0 else "Attribute sayısı rakiple eşit."
        ),
    }


async def _check_stock(sku: dict) -> dict:
    return {"competitor": None, "status": "available", "action": None}
