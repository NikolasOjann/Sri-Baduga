import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

sys.path.append(str(BASE_DIR))

from app.ai.chat_engine import MuseumChatEngine

engine = MuseumChatEngine()

print("="*60)

print("Museum AI")

print("="*60)

while True:

    question = input("\nAnda : ")

    if question.lower() == "exit":

        break

    answer = engine.ask(question)

    print()

    print("AI :")

    print(answer)

    print()