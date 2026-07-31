import sys
import argparse
from config import settings
from django_client import DjangoRestClient
from voice_bot import PipecatVoiceBotService


def run_interactive_test(server_url: str):
    print("\n" + "=" * 70)
    print("  🎙️ PIPECAT VOICE AGENT CLI TEST HARNESS")
    print(f"  Target Django REST Server: {server_url}")
    print("=" * 70)
    print("Commands you can test:")
    print("  1. Update Alice's Mathematics marks to 35")
    print("  2. Mark Bob present")
    print("  3. Get academic summary for Charlie")
    print("  4. type 'exit' or 'quit' to stop.\n")

    client = DjangoRestClient(base_url=server_url)
    bot = PipecatVoiceBotService(client)

    sample_queries = [
        "Update Alice's Mathematics marks to 35.",
        "Mark Bob present",
        "Get academic summary for Alice"
    ]

    for sample in sample_queries:
        print(f"\n🗣️ Teacher Voice Command: \"{sample}\"")
        reply, data = bot.process_command(sample)
        print(f"🤖 Pipecat Response: {reply}")
        print(f"📊 REST API Payload Received: {data}")

    print("\n" + "-" * 70)
    print("Interactive Mode Active. Type your command below:")
    while True:
        try:
            cmd = input("\nTeacher Voice > ").strip()
            if not cmd:
                continue
            if cmd.lower() in ('exit', 'quit', 'q'):
                print("Exiting test harness.")
                break

            reply, data = bot.process_command(cmd)
            print(f"🤖 Pipecat Response: {reply}")
            print(f"📊 REST API Payload: {data}")

        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Pipecat Voice Agent REST Integration")
    parser.add_argument("--url", type=str, default=settings.DJANGO_API_BASE_URL, help="Django REST server URL (e.g. http://127.0.0.1:8000 or https://amkeerthana.pythonanywhere.com)")
    args = parser.parse_args()

    run_interactive_test(args.url)
