from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings
from app.utils.cleaner import TextCleaner


class MuseumSplitter:
    """
    Memecah document menjadi beberapa chunk
    sebelum dilakukan embedding.
    """

    def __init__(self):

        self.splitter = RecursiveCharacterTextSplitter(

            chunk_size=settings.CHUNK_SIZE,

            chunk_overlap=settings.CHUNK_OVERLAP,

            separators=[
                "\n\n",
                "\n",
                ".",
                ",",
                " ",
                ""
            ]
        )

    def split(self, documents):

        cleaned_documents = []

        for document in documents:

            document.page_content = TextCleaner.clean(
                document.page_content
            )

            cleaned_documents.append(document)

        chunks = self.splitter.split_documents(
            cleaned_documents
        )

        return chunks