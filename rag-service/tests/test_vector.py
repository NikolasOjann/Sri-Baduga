import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from app.core.config import settings
from app.rag.loader import MuseumLoader
from app.rag.splitter import MuseumSplitter
from app.rag.vectorstore import MuseumVectorStore


def main():

    print("=" * 60)
    print("Museum Vector Database Test")
    print("=" * 60)

    # Load data
    loader = MuseumLoader(settings.DATASET)
    documents = loader.load()

    # Split data
    splitter = MuseumSplitter()
    chunks = splitter.split(documents)

    print(f"Jumlah Chunk : {len(chunks)}")

    # Simpan ke Chroma
    vectorstore = MuseumVectorStore()
    vectorstore.add_documents(chunks)

    print("\nData berhasil disimpan ke ChromaDB.\n")

    # Uji pencarian
    results = vectorstore.similarity_search(
        "Apa itu kujang?"
    )

    print("=" * 60)
    print("HASIL PENCARIAN")
    print("=" * 60)

    for i, doc in enumerate(results, start=1):
        print(f"\nHasil {i}")
        print("-" * 40)
        print(doc.page_content)
        print(doc.metadata)


if __name__ == "__main__":
    main()