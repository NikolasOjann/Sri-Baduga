class MuseumCollectionTool:

    def __init__(self, retriever):

        self.retriever = retriever

    @property
    def name(self):

        return "museum_collection"

    @property
    def description(self):

        return (

            "Menampilkan daftar koleksi "

            "Museum Sri Baduga."

        )

    def run(self, query=None, question=None, context=None, **kwargs):
        query = query or question or "koleksi museum"

        docs = self.retriever.search(

            query,

            k=10

        )

        hasil = []

        for doc in docs:

            hasil.append(

                {

                    "name": doc.metadata.get(

                        "name",

                        "-"

                    ),

                    "document": doc

                }

            )

        return {

            "tool": "museum_collection",

            "status": "success",

            "collections": hasil,

            "documents": docs

        }