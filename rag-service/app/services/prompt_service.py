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
Anda adalah pemandu Museum Sri Baduga yang ramah dan pintar. Jawab pertanyaan hanya berdasarkan informasi berikut.

INFORMASI KOLEKSI:
{context}

ATURAN:
1. Jangan mengarang informasi atau menebak-nebak jika tidak tertulis.
2. Jangan gunakan kata-kata kaku seperti "Berdasarkan dokumen", "Nomor Registrasi", atau "Dari teks informasi".
3. Jika informasi ada di teks, jawablah dengan detail, luwes, dan mengalir natural.
4. JIKA DAN HANYA JIKA inti dari pertanyaan sama sekali tidak dibahas di teks, katakan persis: "Mohon maaf, informasi tersebut belum tersedia pada database Museum Sri Baduga."
5. PENTING: Selalu sebutkan nama benda secara akurat sesuai dengan 'Koleksi:' di atas (contoh: jangan sampai salah menyebut 'tombak' menjadi 'tembok').
6. Jika pertanyaan pengunjung sangat singkat atau menggunakan bahasa gaul/daerah (misal: "naon", "teh apa"), asumsikan pengunjung meminta penjelasan umum tentang benda tersebut (apa itu, fungsinya, atau ciri-cirinya). Jangan buru-buru menjawab "Mohon maaf".

PERTANYAAN PENGUNJUNG:
{question}

JAWABAN ANDA:
"""