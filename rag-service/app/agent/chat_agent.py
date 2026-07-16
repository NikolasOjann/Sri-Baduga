from app.agent.context import AgentContext
from app.agent.planner import Planner
from app.agent.tool_executor import ToolExecutor
from app.agent.planner_executor import PlannerExecutor


class ChatAgent:

    def __init__(self, llm):

        self.context = AgentContext()

        self.planner = Planner(llm)

        self.executor = ToolExecutor(
            self.context
        )

        self.runner = PlannerExecutor(
            self.planner,
            self.executor
        )

    # =====================================================
    # RUN
    # =====================================================

    def run(
        self,
        question
    ):

        self.context.clear()

        result = self.runner.execute(
            question
        )

        print()
        print("=" * 60)
        print("CHAT AGENT")
        print("=" * 60)
        print("Documents :", len(self.context.documents))
        print("=" * 60)

        # ----------------------------------------
        # Sapaan / NONE
        # ----------------------------------------

        if result is None:

            return {
                "status": "none",
                "documents": []
            }

        # ----------------------------------------
        # Pastikan documents selalu berasal
        # dari context terbaru HANYA JIKA SUCCESS
        # Jika context kosong, gunakan dokumen dari result
        # ----------------------------------------

        if result.get("status") == "success":
            if self.context.documents:
                result["documents"] = self.context.documents
            # else: biarkan result["documents"] dari tool (misal museum_info_tool)

        return result