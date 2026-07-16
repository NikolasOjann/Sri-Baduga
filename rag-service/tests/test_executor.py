from app.agent.context import AgentContext

from app.agent.tool_executor import ToolExecutor

from app.agent.tool_registry import ToolRegistry

from app.tools.museum_search_tool import MuseumSearchTool

from app.core.dependencies import get_retriever


ToolRegistry.register(

    "museum_search",

    MuseumSearchTool(

        get_retriever()

    )

)


ctx = AgentContext()

ctx.question = "Apa itu kujang?"

executor = ToolExecutor(ctx)

result = executor.execute(

    "museum_search",

    question=ctx.question

)

print(result["status"])

print(len(ctx.documents))

print(ctx.tools_used)

print(ctx.reasoning)