from app.services.document_selector import DocumentSelector


class MuseumSearchTool:

    def __init__(self, retriever):

        self.retriever = retriever

        self.selector = DocumentSelector()

    # =====================================================
    # TOOL NAME
    # =====================================================

    @property
    def name(self):

        return "museum_search"

    # =====================================================
    # DESCRIPTION
    # =====================================================

    @property
    def description(self):

        return (
            "Mencari informasi koleksi Museum Sri Baduga."
        )

    # =====================================================
    # RUN
    # =====================================================

    def run(
        self,
        question=None,
        query=None,
        context=None,
        **kwargs
    ):
        question = question or query or ""

        print()
        print("=" * 60)
        print("MUSEUM SEARCH TOOL")
        print("=" * 60)
        print("Question :", question)

        # ==============================================
        # RETRIEVER
        # If the user asks a short follow-up question (e.g. "terbuat dari apa?")
        # prefer using the current context documents so we answer about the
        # already-selected collection instead of doing a global search which
        # can return unrelated results (e.g. paintings on canvas).
        # ==============================================

        q_lower = (question or "").strip().lower()

        if context and getattr(context, "documents", None) and (
            "terbuat" in q_lower or q_lower in ["apa", "apa?"]
        ):

            documents = context.documents

        else:

            documents = self.retriever.search(
                question,
                k=10
            )

        print()
        print("Retriever :", len(documents))

        for i, doc in enumerate(documents):

            if doc is None:
                continue

            print("-" * 40)

            print("Document", i + 1)

            print(
                doc.metadata.get("name")
            )

        # ==============================================
        # DOCUMENT SELECTOR
        # ==============================================

        # The selector expects a normalized keyword (e.g. 'tombak'),
        # not the full question text. Extract keyword from the
        # retriever to keep behavior consistent.
        try:
            keyword = self.retriever.extract_keyword(question)
        except Exception:
            keyword = question

        result = self.selector.select(

            keyword,

            documents

        )

        status = result["status"]

        # ==============================================
        # EMPTY
        # ==============================================

        if status == "empty":

            print()

            print("Status : EMPTY")

            return {

                "tool": "museum_search",

                "status": "empty",

                "documents": []

            }

        # ==============================================
        # CLARIFICATION
        # ==============================================

        if status == "clarification":

            print()

            print("Status : CLARIFICATION")

            print()

            for item in result["candidates"]:

                print("-", item)

            return {

                "tool": "museum_search",

                "status": "clarification",

                "keyword": result["keyword"],

                "total": len(result["candidates"]),

                "candidates": result["candidates"],

                "documents": result.get("documents", [])

            }

        # ==============================================
        # SUCCESS
        # ==============================================

        documents = result["documents"]

        context.clear()

        context.add_documents(documents)

        print()

        print("Selected :", len(documents))

        for doc in documents:

            print(
                doc.metadata.get("name")
            )

        print()

        print("Context :", len(context.documents))

        print("=" * 60)

        return {

            "tool": "museum_search",

            "status": "success",

            "documents": documents

        }