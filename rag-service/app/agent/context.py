class AgentContext:

    def __init__(self):

        self.documents = []
        self.question = ""
        self.entity = ""
        self.tools_used = []
        self.reasoning = []

    # =====================================================
    # ADD DOCUMENT
    # =====================================================

    def add_documents(self, documents):

        if not documents:
            return

        self.documents.extend(documents)

    # =====================================================
    # ADD TOOL / REASON
    # =====================================================

    def add_tool(self, tool_name: str):
        if tool_name not in self.tools_used:
            self.tools_used.append(tool_name)

    def add_reason(self, reason: str):
        self.reasoning.append(reason)

    # =====================================================
    # CLEAR
    # =====================================================

    def clear(self):

        self.documents.clear()
        self.tools_used.clear()
        self.reasoning.clear()
        self.question = ""
        self.entity = ""