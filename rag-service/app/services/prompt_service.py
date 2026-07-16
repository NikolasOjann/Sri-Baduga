class PromptService:

    @staticmethod
    def create(

        question,

        documents

    ):

        context = ""

        for i, doc in enumerate(documents):

            if doc is None:
                print("WARNING : Document None")
                continue

            context += f"""

        Dokumen {i+1}

        Nama :
        {doc.metadata.get('name','')}

        Kategori :
        {doc.metadata.get('category','')}

        Lokasi :
        {doc.metadata.get('location','')}

        Isi :

        {doc.page_content}

        """

        return f"""
Kamu adalah AI Assistant Museum Sri Baduga.

Jawablah HANYA menggunakan informasi pada database.

Jangan menggunakan pengetahuan umum.

Jika informasi tidak tersedia,
jawab:

"Mohon maaf, informasi tersebut belum tersedia
pada database Museum Sri Baduga."

=========================

DATABASE

{context}

=========================

Pertanyaan

{question}

Jawaban:
"""