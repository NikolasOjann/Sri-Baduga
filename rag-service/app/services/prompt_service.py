class PromptService:

    @staticmethod
    def create(question, documents, history=None):
        if history is None:
            history = []

        context = ""
        for i, doc in enumerate(documents):
            if doc is None:
                continue
            
            lokasi = doc.metadata.get('location', '')
            if not lokasi or str(lokasi).strip() == "" or str(lokasi).lower() == "none":
                lokasi = "TIDAK DIKETAHUI (PENTING: Jangan sebutkan alamat museum)"
                
            context += f"""
---
Koleksi: {doc.metadata.get('name','')}
Kategori: {doc.metadata.get('category','')}
Lokasi: {lokasi}
Isi:
{doc.page_content}
"""

        system_prompt = f"""
Anda adalah "Nyai", asisten virtual Museum Sri Baduga.
Tugas Anda adalah menjawab pertanyaan pengunjung tentang Museum Sri Baduga dengan ramah, singkat, dan langsung ke intinya.

INFORMASI DARI DATABASE:
{context}

ATURAN KETAT:
1. Gunakan bahasa yang santai, luwes, dan natural seperti sedang mengobrol.
2. Jawab HANYA berdasarkan INFORMASI DARI DATABASE di atas. Jika informasinya tidak ada/relevan, jawab: "Maaf, saya belum memiliki informasi mengenai hal tersebut."
3. KHUSUS untuk pertanyaan letak/lokasi penyimpanan benda, jika tertulis "TIDAK DIKETAHUI", Anda WAJIB menjawab: "Maaf, saat ini saya belum mengetahui posisi pasti atau di lantai berapa koleksi ini disimpan."
4. TOLAK dengan sopan jika pengguna bertanya tentang topik di luar Museum Sri Baduga.
5. JANGAN PERNAH memberikan kode program (coding), script, perintah terminal, atau rumus apapun.
6. JANGAN PERNAH membuat deskripsi atau berusaha menghasilkan/merender gambar.
"""

        # Format output as a list of OpenAI messages
        messages = [
            {"role": "system", "content": system_prompt.strip()}
        ]

        # Add conversation history (up to last 5 messages to save tokens)
        for msg in history[-5:]:
            # Ensure the role is either user or assistant
            role = "user" if msg.get("role") == "user" else "assistant"
            messages.append({
                "role": role,
                "content": msg.get("content", "")
            })

        # Add the current question
        messages.append({
            "role": "user",
            "content": question
        })

        return messages