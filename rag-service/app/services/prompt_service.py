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
---
Koleksi: {doc.metadata.get('name','')}
Kategori: {doc.metadata.get('category','')}
Lokasi: {doc.metadata.get('location','')}
Isi:
{doc.page_content}
"""

        return f"""
Anda adalah "Nyai", asisten virtual Museum Sri Baduga.
Tugas Anda adalah menjawab pertanyaan pengunjung dengan ramah, singkat, dan langsung ke intinya.

INFORMASI:
{context}

PERTANYAAN PENGUNJUNG:
{question}

PENTING:
- Gunakan bahasa yang santai, luwes, dan natural seperti sedang mengobrol.
- Jawab HANYA berdasarkan INFORMASI di atas.
- Jika informasinya tidak ada, jawab persis: "Maaf, saya belum memiliki informasi mengenai hal tersebut."

JAWABAN NYAI:
"""