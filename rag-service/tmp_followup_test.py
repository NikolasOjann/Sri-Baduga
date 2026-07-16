import os
import sys
sys.path.append(os.getcwd())

from app.core import dependencies as deps

class StubLLM:
    def generate(self, prompt):
        return "STUB ANSWER"

deps.get_llm = lambda: StubLLM()

from app.rag.pipeline import MuseumPipeline

p = MuseumPipeline()

r1 = p.ask("Apa itu Tombak?", "demo")
print("first_answer", r1["answer"])
print("first_docs", [d.metadata.get("name") for d in r1["documents"]])
print("selected1", p.memory.get_selected_document("demo").metadata.get("name") if p.memory.get_selected_document("demo") else None)

r2 = p.ask("Terbuat dari apa?", "demo")
print("second_answer", r2["answer"])
print("second_docs", [d.metadata.get("name") for d in r2["documents"]])
print("selected2", p.memory.get_selected_document("demo").metadata.get("name") if p.memory.get_selected_document("demo") else None)
