class PlannerExecutor:

    def __init__(

        self,

        planner,

        executor

    ):

        self.planner = planner

        self.executor = executor

    # =====================================================
    # EXECUTE
    # =====================================================

    def execute(

        self,

        question

    ):

        plan = self.planner.plan(

            question

        )

        print()

        print("=" * 60)

        print("PLANNER RESULT")

        print("=" * 60)

        print(plan)

        print("=" * 60)

        tool = plan.get(

            "tool"

        )

        if tool is None:

            return None

        if tool == "NONE":

            return None

        arguments = plan.get(

            "arguments",

            {}

        )

        return self.executor.execute(

            tool,

            **arguments

        )