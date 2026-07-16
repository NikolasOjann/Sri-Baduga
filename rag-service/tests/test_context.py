from app.agent.context import AgentContext

ctx = AgentContext()

ctx.question = "Apa itu Kujang?"

ctx.entity = "Kujang"

ctx.add_tool("museum_search")

ctx.add_reason("Cari database")

print(ctx.question)
print(ctx.entity)
print(ctx.tools_used)
print(ctx.reasoning)