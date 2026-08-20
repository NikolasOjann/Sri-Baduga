import json


class Planner:

    def __init__(self, llm):

        self.llm = llm

    # =====================================================
    # CREATE PLAN
    # =====================================================

    def plan(self, question):
        
        # BYPASS LLM UNTUK PERINTAH REMOTE CONTROL (Mencegah salah paham "buka")
        lower_q = question.lower()
        if any(keyword in lower_q for keyword in ["buka koleksi", "buka klasifikasi", "buka photobooth", "mainkan kuis", "buka layar"]):
            return {
                "tool": "remote_control",
                "arguments": {
                    "question": question
                }
            }

        prompt = f"""
Kamu adalah AI Planner Museum Sri Baduga.

Tugasmu hanya memilih tool.

Tool:

1. museum_search
Digunakan untuk mencari informasi spesifik tentang benda/koleksi museum.

Contoh:
- apa itu kujang
- fungsi kujang
- asal kujang
- siapa pembuat kujang
- dimana lokasi kujang
- mahkota binokasih
- golok
- keris

-------------------------------------

2. museum_collection

Digunakan jika pengguna meminta daftar koleksi.

Contoh:
- daftar koleksi
- koleksi museum
- benda apa saja
- tampilkan koleksi

-------------------------------------

3. museum_info

Digunakan untuk pertanyaan umum tentang Museum Sri Baduga itu sendiri (BUKAN tentang koleksi spesifik).

Contoh:
- jam operasional museum
- jadwal operasional museum
- harga tiket / HTM museum
- berapa tiket masuk
- dimana lokasi museum
- alamat museum sri baduga
- sejarah museum sri baduga
- ada apa saja di museum / apa yang ada di museum
- apa yang dipamerkan di museum
- telepon museum / kontak museum
- museum tutup hari apa
- daftar lengkap yang ada di museum

-------------------------------------

4. remote_control

Digunakan jika pengguna meminta untuk MEMBUKA, MENYALAKAN, MENAMPILKAN, atau MEMAINKAN sesuatu di layar komputer (layar photobooth, layar koleksi, layar kuis).

Contoh:
- tolong buka photobooth
- mainkan kuis
- buka katalog koleksi di layar
- buka koleksi
- buka koleksi museum
- buka klasifikasi
- tolong buka kamera
- nyalakan layar koleksi
- tutup browser

-------------------------------------

Hanya gunakan NONE apabila pertanyaan hanyalah sapaan.

Contoh:
Halo
Selamat pagi
Terima kasih

PENTING: Jika pengguna hanya mengetik satu atau dua kata (misalnya "golok", "kujang", "ciomas"), itu adalah nama koleksi. Gunakan museum_search.
PENTING: JIKA MENGANDUNG KATA "buka koleksi" ATAU "buka klasifikasi" ATAU "buka photobooth", WAJIB GUNAKAN remote_control! JANGAN PERNAH GUNAKAN museum_info!
SANGAT PENTING: Untuk bagian "arguments", kamu WAJIB menyalin Pertanyaan Asli SAMA PERSIS 100% huruf demi huruf ke dalam nilai "question" atau "query". DILARANG merangkum atau mengubah isi pertanyaan pengguna!

Jawab HARUS berupa format JSON yang valid.

Contoh:

{{
    "tool":"museum_search",
    "arguments":{{
        "question":"apa itu kujang"
    }}
}}

atau

{{
    "tool":"museum_collection",
    "arguments":{{
        "query":"koleksi museum"
    }}
}}

atau

{{
    "tool":"museum_info",
    "arguments":{{
        "question":"museum buka jam berapa"
    }}
}}

atau

{{
    "tool":"museum_info",
    "arguments":{{
        "question":"museum buka jam berapa"
    }}
}}

atau

{{
    "tool":"remote_control",
    "arguments":{{
        "question":"tolong buka photobooth"
    }}
}}

atau

{{
    "tool":"NONE"
}}

Pertanyaan:

{question}
"""

        result_str = self.llm.generate(prompt)
        
        try:
            start = result_str.find("{")
            end = result_str.rfind("}") + 1
            parsed = json.loads(result_str[start:end])
        except Exception:
            parsed = {
                "tool": "museum_search"
            }
            
        # PAKSAAN MUTLAK (ANTI-HALUSINASI ARGUMEN)
        # Apapun yang dihasilkan LLM, kita timpa argumennya dengan pertanyaan asli pengguna.
        # Ini sangat efektif untuk model kecil yang sering salah menyalin teks.
        tool_name = parsed.get("tool", "museum_search")
        
        if tool_name in ["museum_search", "museum_info", "remote_control"]:
            parsed["arguments"] = {"question": question}
        elif tool_name == "museum_collection":
            parsed["arguments"] = {"query": question}
            
        return parsed