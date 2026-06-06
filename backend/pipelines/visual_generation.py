"""
Lenz Görsel Üretim Pipeline'ı

Akış:
  AŞAMA 1 (sıralı):   birefnet/v2       → master görsel
  AŞAMA 2 (paralel):  qwen-angles × 5
                       bria/product-shot × 3
                       kling-video × 1   (tenant'a göre)
                       florence-2 × 1
  AŞAMA 3 (paralel):  kalite kontrol (florence-2)
  AŞAMA 4 (sıralı):   LLM form doldurma
  AŞAMA 5 (sıralı):   galeri paketi
"""

import asyncio
import json
import logging

import fal_client
from anthropic import Anthropic

logger = logging.getLogger(__name__)
_anthropic = Anthropic()


# ═══════════════════════════════════════════════════════════
# YARDIMCI: güvenli FAL çağrısı
# ═══════════════════════════════════════════════════════════

async def _safe_fal(endpoint: str, args: dict, fallback: str) -> str:
    """FAL çağrısını sar — başarısız olursa fallback döner, uygulama çökmez."""
    try:
        result = await fal_client.run_async(endpoint, arguments=args)
        if "images" in result:
            return result["images"][0]["url"]
        if "image_urls" in result:
            return result["image_urls"][0]
        if "image" in result:
            return result["image"]["url"]
        if "video" in result:
            return result["video"]["url"]
        return fallback
    except Exception as e:
        logger.error(f"FAL hata [{endpoint}]: {e}")
        return fallback


# ═══════════════════════════════════════════════════════════
# AŞAMA 1: Arka plan temizle
# ═══════════════════════════════════════════════════════════

async def clean_background(image_url: str) -> str:
    """
    Endpoint : fal-ai/birefnet/v2
    Görev    : Ürün görselinden arka planı kaldır
    Süre     : ~2 sn | Maliyet: $0.01
    """
    url = await _safe_fal(
        "fal-ai/birefnet/v2",
        {"image_url": image_url, "model": "General Use (Light)"},
        fallback=image_url,
    )
    logger.info(f"[birefnet] master hazır")
    return url


# ═══════════════════════════════════════════════════════════
# AŞAMA 2A: Çoklu açı üretimi
# ═══════════════════════════════════════════════════════════

_ANGLES = [
    {"view": "back",          "az": "back view",              "el": "eye-level shot",  "dist": "medium shot", "slot": 4},
    {"view": "left_side",     "az": "left side view",         "el": "eye-level shot",  "dist": "medium shot", "slot": 5},
    {"view": "right_side",    "az": "right side view",        "el": "eye-level shot",  "dist": "medium shot", "slot": 6},
    {"view": "top_down",      "az": "front view",             "el": "top-down shot",   "dist": "medium shot", "slot": 7},
    {"view": "front_left_45", "az": "front-left quarter view","el": "elevated shot",   "dist": "medium shot", "slot": 8},
]


async def _one_angle(master_url: str, product_name: str, cfg: dict) -> dict:
    prompt = (
        f"<sks> {cfg['az']} {cfg['el']} {cfg['dist']}, "
        f"{product_name}, white background, professional product photography, studio lighting"
    )
    url = await _safe_fal(
        "fal-ai/qwen-image-edit-2511-multiple-angles",
        {
            "image_url": master_url,
            "prompt": prompt,
            "lora_scale": 1.0,
            "guidance_scale": 4.5,
            "num_inference_steps": 28,
            "acceleration": "regular",
            "image_size": "square_hd",
            "num_images": 1,
        },
        fallback=master_url,
    )
    fallback = url == master_url
    if not fallback:
        logger.info(f"[qwen] açı üretildi: {cfg['view']}")
    return {"view": cfg["view"], "slot": cfg["slot"], "url": url, "type": "angle", "fallback": fallback}


async def generate_angles(master_url: str, product_name: str) -> list[dict]:
    """
    Endpoint : fal-ai/qwen-image-edit-2511-multiple-angles
    Görev    : 5 farklı açı — hepsi paralel
    Süre     : ~15 sn | Maliyet: 5 × $0.035 = $0.175
    """
    results = await asyncio.gather(*[_one_angle(master_url, product_name, a) for a in _ANGLES])
    return list(results)


# ═══════════════════════════════════════════════════════════
# AŞAMA 2B: Lifestyle sahneler
# ═══════════════════════════════════════════════════════════

async def _one_lifestyle(master_url: str, scene: str, slot: int) -> dict:
    url = await _safe_fal(
        "fal-ai/bria/product-shot",
        {"image_url": master_url, "scene_description": scene, "num_results": 1, "placement_type": "automatic"},
        fallback=master_url,
    )
    fallback = url == master_url
    if not fallback:
        logger.info(f"[bria] lifestyle üretildi slot={slot}")
    return {"scene": scene, "slot": slot, "url": url, "type": "lifestyle", "fallback": fallback}


async def generate_lifestyle(master_url: str, tenant_config: dict) -> list[dict]:
    """
    Endpoint : fal-ai/bria/product-shot
    Görev    : 3 lifestyle sahne — hepsi paralel
    Süre     : ~12 sn | Maliyet: 3 × $0.04 = $0.12
    """
    scenes = tenant_config.get("lifestyle_scenes", [
        "on white marble surface, minimal aesthetic, soft natural light",
        "flat lay on pastel background with decorative elements",
        "in lifestyle context, warm lighting, blurred background",
    ])[:3]
    slots = [2, 3, 9]
    results = await asyncio.gather(*[_one_lifestyle(master_url, s, slots[i]) for i, s in enumerate(scenes)])
    return list(results)


# ═══════════════════════════════════════════════════════════
# AŞAMA 2C: Tanıtım videosu
# ═══════════════════════════════════════════════════════════

async def generate_video(master_url: str, product_name: str, tenant_config: dict) -> dict:
    """
    Endpoint : fal-ai/kling-video/v2.1/standard/image-to-video
    Görev    : 5 sn tanıtım videosu
    Süre     : ~30 sn | Maliyet: $0.05 × 5 = $0.25
    Tenant   : video_required=false ise atlanır
    """
    if not tenant_config.get("visual_rules", {}).get("video_required", True):
        logger.info("[kling] video tenant config'de kapalı, atlandı")
        return {"url": None, "skipped": True}

    url = await _safe_fal(
        "fal-ai/kling-video/v2.1/standard/image-to-video",
        {
            "image_url": master_url,
            "prompt": (
                f"{product_name}, slowly rotating 360 degrees, "
                "studio lighting, white background, professional product showcase, smooth motion"
            ),
            "duration": 5,
            "resolution": "720p",
            "movement_amplitude": "small",
        },
        fallback="",
    )
    if url:
        logger.info("[kling] video üretildi")
    return {"url": url or None, "skipped": not bool(url)}


# ═══════════════════════════════════════════════════════════
# AŞAMA 2D: Görsel anlama
# ═══════════════════════════════════════════════════════════

async def analyze_image(image_url: str) -> str:
    """
    Endpoint : fal-ai/florence-2-large
    Görev    : Görsel → detaylı metin açıklaması (form doldurma için)
    Süre     : ~2 sn | Maliyet: $0.01
    """
    try:
        result = await fal_client.run_async(
            "fal-ai/florence-2-large",
            arguments={"image_url": image_url, "task": "DETAILED_CAPTION"},
        )
        caption = result["results"]
        logger.info(f"[florence-2] caption: {caption[:80]}...")
        return caption
    except Exception as e:
        logger.error(f"[florence-2] hata: {e}")
        return "product image"


# ═══════════════════════════════════════════════════════════
# AŞAMA 3: Kalite kontrol
# ═══════════════════════════════════════════════════════════

async def quality_check(images: list[dict], master_url: str, product_keywords: list[str]) -> list[dict]:
    """
    Endpoint : fal-ai/florence-2-large (her görsel için)
    Görev    : Ürün görselde var mı kontrol et — başarısız → master_url ile değiştir
    Süre     : ~5 sn | Maliyet: görsel_sayısı × $0.01
    """
    async def _check(img: dict) -> dict:
        if img.get("fallback"):
            return img
        try:
            result = await fal_client.run_async(
                "fal-ai/florence-2-large",
                arguments={"image_url": img["url"], "task": "DETAILED_CAPTION"},
            )
            caption = result["results"].lower()
            if not any(kw.lower() in caption for kw in product_keywords):
                logger.warning(f"[QC] başarısız: {img['view']}")
                return {**img, "url": master_url, "fallback": True}
            return img
        except Exception:
            return {**img, "url": master_url, "fallback": True}

    checked = await asyncio.gather(*[_check(img) for img in images])
    failed = sum(1 for i in checked if i.get("fallback"))
    logger.info(f"[QC] {len(checked) - failed} geçti, {failed} fallback")
    return list(checked)


# ═══════════════════════════════════════════════════════════
# AŞAMA 4: Platform formu doldur
# ═══════════════════════════════════════════════════════════

_PLATFORM_RULES = {
    "etsy": (
        "Title: max 140 chars, front-load SEO keywords. "
        "Tags: exactly 13 comma-separated tags, multi-word allowed. "
        "Description: 500+ words, storytelling style. "
        "Add 'handmade' and 'unique' keywords."
    ),
    "trendyol": (
        "Başlık: max 200 karakter, marka + model + özellik. "
        "Açıklama: teknik özellikler önce, sonra faydalar. "
        "Zorunlu spec alanları: renk, boyut, malzeme, garanti. Türkçe yaz."
    ),
    "amazon": (
        "Title: max 200 chars, Brand + Model + Key Feature + Color. "
        "Bullet points: exactly 5, each starting with capital letter. "
        "Description: 2000 chars, paragraph format."
    ),
    "teknosa": (
        "Başlık: marka + model + ana özellik, max 255 karakter. "
        "Teknik özellik tablosu zorunlu. Türkçe yaz."
    ),
}


async def fill_platform_form(product_hint: str, vision_caption: str, tenant_config: dict) -> dict:
    """
    Model  : claude-haiku-4-5 (Etsy/Trendyol/Amazon) | claude-sonnet (Teknosa)
    Görev  : Platforma özel listing formu doldur
    Süre   : ~3 sn | Maliyet: ~$0.001 (haiku)
    """
    platform = tenant_config["platform"]
    language = tenant_config["language"]
    fields   = tenant_config["listing_fields"]
    model    = tenant_config.get("llm_model", "claude-haiku-4-5")
    rules    = _PLATFORM_RULES.get(platform, "")

    system = (
        f"You are an expert {platform} listing specialist. "
        f"Language: {language}. Platform rules: {rules}. "
        f"Return ONLY valid JSON with these exact fields: {fields}. No markdown."
    )
    user = (
        f"Product hint: {product_hint}\n"
        f"Visual analysis: {vision_caption}\n"
        f"Create a {platform} listing optimized for maximum visibility."
    )

    try:
        resp = _anthropic.messages.create(
            model=model,
            max_tokens=1500,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        raw = resp.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        form = json.loads(raw)
        logger.info(f"[LLM] form dolduruldu: {list(form.keys())}")
        return form
    except json.JSONDecodeError as e:
        logger.error(f"[LLM] JSON parse hatası: {e}")
        return {field: "" for field in fields}
    except Exception as e:
        logger.error(f"[LLM] form hatası: {e}")
        return {field: "" for field in fields}


# ═══════════════════════════════════════════════════════════
# AŞAMA 5: Galeri paketi
# ═══════════════════════════════════════════════════════════

def build_gallery(
    master_url: str,
    angle_images: list[dict],
    lifestyle_images: list[dict],
    video: dict,
    form: dict,
    tenant_config: dict,
) -> dict:
    """
    Slot sıralaması (Etsy dönüşüm optimizasyonu):
    1: hero · 2,3,9: lifestyle · 4-8: açılar · 10: video
    """
    images = [{"slot": 1, "url": master_url, "type": "hero"}]
    for ls in lifestyle_images[:3]:
        images.append({"slot": ls["slot"], "url": ls["url"], "type": "lifestyle"})
    for ang in angle_images:
        images.append({"slot": ang["slot"], "url": ang["url"], "type": ang["view"]})
    images.sort(key=lambda x: x["slot"])

    return {
        "master_url": master_url,
        "images": images,
        "video_url": video.get("url"),
        "video_skipped": video.get("skipped", False),
        "form": form,
        "platform": tenant_config["platform"],
        "total_images": len(images),
        "ready": True,
    }


# ═══════════════════════════════════════════════════════════
# ANA PIPELINE
# ═══════════════════════════════════════════════════════════

async def run_visual_pipeline(image_url: str, product_hint: str, tenant_config: dict) -> dict:
    """
    Toplam maliyet (Etsy — video dahil): ~$0.61
    Toplam süre                        : ~65 sn
    """
    product_keywords = product_hint.lower().split() if product_hint else ["product"]
    logger.info(f"[pipeline] başladı: platform={tenant_config['platform']}, hint={product_hint}")

    # Aşama 1 — sıralı (master şart)
    master_url = await clean_background(image_url)

    # Aşama 2 — tam paralel
    angle_images, lifestyle_images, video, vision_caption = await asyncio.gather(
        generate_angles(master_url, product_hint),
        generate_lifestyle(master_url, tenant_config),
        generate_video(master_url, product_hint, tenant_config),
        analyze_image(master_url),
    )

    # Aşama 3 — kalite kontrol
    approved_angles = await quality_check(angle_images, master_url, product_keywords)

    # Aşama 4 — form doldur
    form = await fill_platform_form(product_hint, vision_caption, tenant_config)

    # Aşama 5 — galeri
    gallery = build_gallery(master_url, approved_angles, lifestyle_images, video, form, tenant_config)
    logger.info(f"[pipeline] tamamlandı: {gallery['total_images']} görsel")
    return gallery
