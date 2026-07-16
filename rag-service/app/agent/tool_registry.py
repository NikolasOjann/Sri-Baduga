class ToolRegistry:

    _tools = {}

    # =====================================================
    # REGISTER
    # =====================================================

    @classmethod
    def register(cls, tool):

        cls._tools[tool.name] = tool

    # =====================================================
    # GET
    # =====================================================

    @classmethod
    def get(cls, name):

        return cls._tools.get(name)

    # =====================================================
    # EXISTS
    # =====================================================

    @classmethod
    def exists(cls, name):

        return name in cls._tools

    # =====================================================
    # ALL
    # =====================================================

    @classmethod
    def all(cls):

        return cls._tools

    # =====================================================
    # CLEAR
    # =====================================================

    @classmethod
    def clear(cls):

        cls._tools.clear()

    # =====================================================
    # PRINT
    # =====================================================

    @classmethod
    def list_tools(cls):

        result = ""

        for tool in cls._tools.values():

            result += f"""
Tool :
{tool.name}

Description :
{tool.description}

"""

        return result