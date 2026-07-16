import json


class Planner:

    def __init__(self, llm):

        self.llm = llm

    # =====================================================
    # CREATE PLAN
    # =====================================================

    def plan(self, question):

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
- museum buka jam berapa
- jam operasional museum
- harga tiket / HTM museum
- berapa tiket masuk
- dimana lokasi museum
- alamat museum sri baduga
- sejarah museum sri baduga
- ada apa saja di museum / apa yang ada di museum
- apa yang dipamerkan di museum
- telepon museum / kontak museum
- museum tutup hari apa
- koleksi museum ada apa saja (dalam konteks umum, bukan nama spesifik)

-------------------------------------

Hanya gunakan NONE apabila pertanyaan hanyalah sapaan.

Contoh:
Halo
Selamat pagi
Terima kasih

PENTING: Jika pengguna hanya mengetik satu atau dua kata (misalnya "golok", "kujang", "ciomas"), itu adalah nama koleksi. Gunakan museum_search.

Jawab HARUS berupa JSON.

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
    "tool":"NONE"
}}

Pertanyaan:

{question}
"""

        result = self.llm.generate(prompt)

        try:

            start = result.find("{")
            end = result.rfind("}") + 1

            return json.loads(result[start:end])

        except Exception:

            return {

                "tool": "museum_search",

                "arguments": {

                    "question": question

                }

            }