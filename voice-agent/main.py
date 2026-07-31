import logging
import sys
from config import settings
from django_client import DjangoRestClient
from voice_bot import PipecatVoiceBotService

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("VoiceAgentMicroservice")


def main():
    logger.info("=" * 65)
    logger.info("  Starting Pipecat Voice Agent Microservice")
    logger.info(f"  Target Django REST Server: {settings.DJANGO_API_BASE_URL}")
    logger.info(f"  Parent Outreach Threshold: {settings.PARENT_CALL_OUTREACH_THRESHOLD}%")
    logger.info("=" * 65)

    client = DjangoRestClient()
    bot = PipecatVoiceBotService(client)

    logger.info("Voice Agent Microservice initialized successfully.")
    logger.info("Ready to receive voice streams / HTTPS REST API requests.")


if __name__ == "__main__":
    main()
