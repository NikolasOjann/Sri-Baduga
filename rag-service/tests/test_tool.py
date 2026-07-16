import os
import sys

sys.path.append(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)

from app.core.dependencies import get_retriever
from app.agent.tool_executor import ToolExecutor
from app.agent.context import AgentContext


# supaya tool ter-register
get_retriever()

context = AgentContext()
executor = ToolExecutor(context)

result = executor.execute(
    "museum_search",
    question="Apa itu Kujang?"
)
docs = result.get("documents", [])

print("=" * 50)
print("Jumlah Dokumen :", len(docs))
print("=" * 50)

for i, doc in enumerate(docs):

    print(i + 1)
    print(doc.metadata.get("name"))
    print(doc.page_content[:150])
    print("-" * 50)