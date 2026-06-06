import json
from pathlib import Path

_DATA_FILE = Path(__file__).parent / "mock_skus.json"


def get_mock_skus() -> list[dict]:
    with open(_DATA_FILE) as f:
        return json.load(f)
