import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from app.rag.retriever import MuseumRetriever

print("=" * 60)
print("Museum Retriever Test")
print("=" * 60)

retriever = MuseumRetriever()

query = "Apa fungsi kujang?"

results = retriever.retrieve(query)

print()

print(f"Pertanyaan : {query}")

print()

print("=" * 60)

for i, doc in enumerate(results, start=1):

    print(f"\nHasil {i}")

    print("-" * 40)

    print(doc.metadata["name"])

    print(doc.page_content)