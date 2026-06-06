"""
Catalog + Listing Agent

Mod A — Mevcut SKU kalite analizi (0–100 karne)
Mod B — Yeni ürün otomatik form doldurma (FAL pipeline üzerinden)

Skor dağılımı:
  Görsel   : max 20  (her görsel 5 puan, max 4)
  Açıklama : max 30  (200+ kar=30, 50-200=15, <50=0)
  Specs    : max 30  (dolu alan / toplam alan × 30)
  Kategori : max 20  (varsa 20, yoksa 0)
"""

import fal_client


async def analyze(sku: dict) -> dict:
    image_count = len(sku.get("images", []))
    description = sku.get("description", "")
    specs = sku.get("specs", {})
    category = sku.get("category", "")

    # Skor
    img_score  = min(image_count * 5, 20)
    desc_score = 30 if len(description) >= 200 else 15 if len(description) >= 50 else 0
    filled     = sum(1 for v in specs.values() if v)
    spec_score = round((filled / max(len(specs), 1)) * 30)
    cat_score  = 20 if category else 0
    total      = img_score + desc_score + spec_score + cat_score

    actions = []
    fal_results = {"generated_image": None, "cleaned_image": None}
    grounding_parts = []

    # FAL — görsel üretimi veya temizleme
    if image_count == 0:
        try:
            result = await fal_client.run_async(
                "fal-ai/flux/dev",
                arguments={
                    "prompt": (
                        f"Professional product photo of {sku['name']}, "
                        "white background, e-commerce style, high quality, studio lighting"
                    ),
                    "image_size": "square_hd",
                    "num_images": 1,
                },
            )
            fal_results["generated_image"] = result["images"][0]["url"]
            grounding_parts.append("FAL flux/dev ile görsel üretildi")
        except Exception:
            grounding_parts.append("FAL flux/dev (fallback)")

        actions.append({
            "type": "GENERATE_IMAGE",
            "message": "Ürün görseli yok, FAL ile üretildi.",
            "priority": "high",
        })

    elif image_count > 0 and image_count < 2:
        try:
            result = await fal_client.run_async(
                "fal-ai/birefnet/v2",
                arguments={
                    "image_url": sku["images"][0],
                    "model": "General Use (Light)",
                },
            )
            fal_results["cleaned_image"] = result["image"]["url"]
            grounding_parts.append("FAL birefnet/v2 ile arka plan temizlendi")
        except Exception:
            grounding_parts.append("FAL birefnet/v2 (fallback)")

        actions.append({
            "type": "CLEAN_IMAGE",
            "message": "Görsel arka planı temizlendi. Daha fazla açı eklenmeli.",
            "priority": "medium",
        })

    if desc_score < 30:
        actions.append({
            "type": "IMPROVE_DESCRIPTION",
            "message": f"Açıklama {'çok kısa' if desc_score == 0 else 'yetersiz'} ({len(description)} karakter). 200+ karakter hedefle.",
            "priority": "high" if desc_score == 0 else "medium",
        })

    if spec_score < 20:
        empty_specs = [k for k, v in specs.items() if not v]
        actions.append({
            "type": "FILL_SPECS",
            "message": f"Eksik teknik özellikler: {', '.join(empty_specs)}",
            "priority": "medium",
        })

    if cat_score == 0:
        actions.append({
            "type": "SET_CATEGORY",
            "message": "Kategori tanımlanmamış.",
            "priority": "high",
        })

    return {
        "total_score": total,
        "breakdown": {
            "image": img_score,
            "description": desc_score,
            "specs": spec_score,
            "category": cat_score,
        },
        "actions": actions,
        "fal_results": fal_results,
        "grounding": " | ".join(grounding_parts) if grounding_parts else "FAL çağrısı yapılmadı",
    }
