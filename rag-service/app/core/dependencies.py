from functools import lru_cache

# =====================================================
# AI
# =====================================================

from app.ai.ollama_client import OllamaClient

# =====================================================
# DATABASE
# =====================================================

from app.rag.database_manager import get_database

# =====================================================
# SERVICES
# =====================================================

from app.services.retriever_service import RetrieverService

# =====================================================
# TOOLS
# =====================================================

from app.agent.tool_registry import ToolRegistry

from app.tools.museum_search_tool import MuseumSearchTool
from app.tools.museum_collection_tool import MuseumCollectionTool
from app.tools.museum_info_tool import MuseumInfoTool


# =====================================================
# LLM
# =====================================================

@lru_cache(maxsize=1)
def get_llm():

    return OllamaClient()


# =====================================================
# DATABASE
# =====================================================

@lru_cache(maxsize=1)
def get_database_manager():

    return get_database()


# =====================================================
# RETRIEVER
# =====================================================

@lru_cache(maxsize=1)
def get_retriever():

    retriever = RetrieverService()

    if not ToolRegistry.exists("museum_search"):

        ToolRegistry.register(

            MuseumSearchTool(retriever)

        )

    if not ToolRegistry.exists("museum_collection"):

        ToolRegistry.register(

            MuseumCollectionTool(retriever)

        )

    if not ToolRegistry.exists("museum_info"):

        ToolRegistry.register(

            MuseumInfoTool(retriever)

        )

    return retriever