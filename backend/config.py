import os
from dotenv import load_dotenv

load_dotenv()

FAL_KEY = os.getenv("FAL_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# FAL key'i environment'a set et (fal_client bunu okur)
if FAL_KEY:
    os.environ["FAL_KEY"] = FAL_KEY
