import os
import sys

sys.path.append(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)

from app.core.dependencies import get_retriever
from app.agent.tool_registry import ToolRegistry

# Trigger register tool
get_retriever()

print("=" * 50)
print("REGISTERED TOOLS")
print("=" * 50)

for name, tool in ToolRegistry.all().items():

    print(name)
    print(tool.description)
    print()