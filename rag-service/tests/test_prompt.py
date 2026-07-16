import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from app.rag.retriever import MuseumRetriever
from app.core.prompt_builder import PromptBuilder

retriever = MuseumRetriever()

docs = retriever.retrieve(
    "Apa itu kujang?"
)

prompt = PromptBuilder.build(
    "Apa itu kujang?",
    docs
)

print(prompt)