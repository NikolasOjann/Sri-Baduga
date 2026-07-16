from app.services.retriever_service import RetrieverService
from app.tools.museum_search_tool import MuseumSearchTool
from app.agent.context import AgentContext


def main(query="apa itu tombak"):

    retriever = RetrieverService()

    tool = MuseumSearchTool(retriever)

    context = AgentContext()

    result = tool.run(query, context)

    print('\n=== TOOL RESULT ===')

    print(result)

    print('\n=== CONTEXT DOCUMENTS ===')

    print(len(context.documents))

    for d in context.documents:

        print('-', d.metadata.get('name'))


if __name__ == '__main__':

    import sys

    q = sys.argv[1] if len(sys.argv) > 1 else "apa itu tombak"

    main(q)
