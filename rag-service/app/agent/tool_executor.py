from app.agent.tool_registry import ToolRegistry


class ToolExecutor:

    def __init__(self, context):

        self.context = context

    # =====================================================
    # EXECUTE TOOL
    # =====================================================

    def execute(self, tool_name, **kwargs):

        print()
        print("=" * 60)
        print("TOOL EXECUTOR")
        print("=" * 60)

        print("Requested Tool :", tool_name)
        print("Available :", list(ToolRegistry.all().keys()))

        tool = ToolRegistry.get(tool_name)

        if tool is None:

            print("Tool Not Found")

            return {

                "status": "failed"

            }

        if "query" in kwargs and "question" not in kwargs:
            kwargs["question"] = kwargs["query"]
        if "question" in kwargs and "query" not in kwargs:
            kwargs["query"] = kwargs["question"]

        result = tool.run(
            context=self.context,
            **kwargs
        )

        print()

        print("Tool Status :", result["status"])

        print("Documents :", len(self.context.documents))

        print("=" * 60)

        return result