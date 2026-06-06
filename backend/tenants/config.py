import json
from pathlib import Path
from pydantic import BaseModel


class TenantConfig(BaseModel):
    tenant_id: str
    platform: str
    language: str
    visual_rules: dict
    lifestyle_scenes: list[str]
    listing_fields: list[str]
    competitors: list[str]
    seo_marketplace: str
    llm_model: str = "gpt-4o-mini"
    tag_limit: int | None = None
    title_max_chars: int = 200


PRESETS_DIR = Path(__file__).parent / "presets"


def get_tenant_config(platform: str) -> TenantConfig:
    preset_file = PRESETS_DIR / f"{platform}.json"
    if not preset_file.exists():
        raise ValueError(f"Platform desteklenmiyor: {platform}")
    with open(preset_file) as f:
        data = json.load(f)
    return TenantConfig(**data)


def create_custom_tenant(user_input: dict) -> TenantConfig:
    base = get_tenant_config(user_input["platform"])

    if user_input.get("lifestyle_preference") == "minimal":
        base.lifestyle_scenes[0] = (
            "on white marble surface, minimal, soft light"
        )

    if user_input.get("language"):
        base.language = user_input["language"]

    return base
