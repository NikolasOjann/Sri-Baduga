class CitationService:

    @staticmethod
    def build(documents):

        citations = []

        for doc in documents:

            metadata = doc.metadata

            citations.append({

                "name": metadata.get("name"),

                "category": metadata.get("category"),

                "location": metadata.get("location")

            })

        return citations