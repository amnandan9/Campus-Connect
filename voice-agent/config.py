import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
env_file = BASE_DIR / '.env'
if env_file.exists():
    load_dotenv(env_file)

class Settings:
    DJANGO_API_BASE_URL: str = os.getenv('DJANGO_API_BASE_URL', 'https://amkeerthana.pythonanywhere.com').rstrip('/')
    VOICE_AGENT_API_KEY: str = os.getenv('VOICE_AGENT_API_KEY', 'campus_connect_voice_secret_key_2026')
    PARENT_CALL_OUTREACH_THRESHOLD: float = float(os.getenv('PARENT_CALL_OUTREACH_THRESHOLD', '40.0'))
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    VOICE_SERVICE_PORT: int = int(os.getenv('VOICE_SERVICE_PORT', '8765'))

    @classmethod
    def get_headers(cls) -> dict:
        return {
            'X-API-KEY': cls.VOICE_AGENT_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

settings = Settings()
