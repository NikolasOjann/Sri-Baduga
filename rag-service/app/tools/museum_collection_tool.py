import difflib


# Definisi & deskripsi 10 jenis klasifikasi standar museum
CATEGORY_INFO = {
    "geologika": {
        "label": "Geologika/Geografika",
        "definisi": (
            "Koleksi benda-benda yang berkaitan dengan ilmu kebumian, seperti "
            "batuan, mineral, fosil, dan peta geografis. Koleksi ini menggambarkan "
            "kondisi alam dan bumi dari masa prasejarah hingga kini."
        ),
    },
    "biologika": {
        "label": "Biologika",
        "definisi": (
            "Koleksi benda-benda yang berkaitan dengan makhluk hidup, meliputi "
            "spesimen hewan, tumbuhan, serta bahan organik yang diawetkan. "
            "Mencerminkan kekayaan hayati Nusantara."
        ),
    },
    "etnografika": {
        "label": "Etnografika",
        "definisi": (
            "Koleksi benda-benda budaya dan keseharian masyarakat adat, seperti "
            "pakaian tradisional, peralatan dapur, senjata tradisional, dan alat "
            "upacara adat. Menggambarkan ragam budaya masyarakat Sunda dan Nusantara."
        ),
    },
    "arkeologika": {
        "label": "Arkeologika",
        "definisi": (
            "Koleksi benda-benda peninggalan zaman kuno yang ditemukan melalui "
            "ekskavasi arkeologi, seperti gerabah, arca, prasasti, dan artefak "
            "prasejarah maupun klasik."
        ),
    },
    "historika": {
        "label": "Historika",
        "definisi": (
            "Koleksi benda-benda bersejarah yang memiliki nilai penting bagi "
            "perjalanan sejarah bangsa, seperti dokumen, foto, senjata, dan benda "
            "peninggalan tokoh atau peristiwa bersejarah."
        ),
    },
    "numismatika": {
        "label": "Numismatika/Heraldika",
        "definisi": (
            "Koleksi mata uang kuno (numismatika) dan lambang-lambang resmi seperti "
            "stempel, lencana, dan tanda kehormatan (heraldika) dari berbagai era "
            "dan kerajaan Nusantara."
        ),
    },
    "filologika": {
        "label": "Filologika",
        "definisi": (
            "Koleksi naskah-naskah kuno (manuskrip) yang ditulis tangan di atas "
            "berbagai media seperti lontar, kulit kayu, dan kertas. Berisi ajaran "
            "agama, sastra, sejarah, ilmu pengetahuan, dan budaya masyarakat masa lampau."
        ),
    },
    "keramologika": {
        "label": "Keramologika",
        "definisi": (
            "Koleksi benda-benda dari bahan keramik, porselen, dan tembikar, baik "
            "buatan lokal maupun impor dari Cina, Eropa, dan Asia Tenggara. "
            "Mencerminkan jalur perdagangan dan interaksi budaya antar bangsa."
        ),
    },
    "seni rupa": {
        "label": "Seni Rupa",
        "definisi": (
            "Koleksi karya seni dua dimensi dan tiga dimensi seperti lukisan, patung, "
            "ukiran, dan batik. Menampilkan ekspresi estetika dan kreativitas seniman "
            "dari berbagai daerah di Jawa Barat dan Nusantara."
        ),
    },
    "teknologika": {
        "label": "Teknologika",
        "definisi": (
            "Koleksi peralatan dan mesin yang mencerminkan perkembangan teknologi "
            "dan industri masyarakat dari masa ke masa, termasuk alat tenun, "
            "peralatan pertanian tradisional, dan mesin cetak kuno."
        ),
    },
}


class MuseumCollectionTool:

    def __init__(self, retriever):
        self.retriever = retriever

    @property
    def name(self):
        return "museum_collection"

    @property
    def description(self):
        return "Menampilkan daftar koleksi Museum Sri Baduga."

    def get_category_info(self, keyword):
        """Cari definisi kategori dengan fuzzy matching."""
        keyword = keyword.lower().strip()
        all_keys = list(CATEGORY_INFO.keys())
        matches = difflib.get_close_matches(keyword, all_keys, n=1, cutoff=0.6)
        # Cek juga substring
        if not matches:
            for k in all_keys:
                if keyword in k or k in keyword:
                    matches = [k]
                    break
        if matches:
            return CATEGORY_INFO[matches[0]]
        return None

    def run(self, query=None, question=None, context=None, **kwargs):
        q = (question or query or "").strip().lower()

        # Cek apakah user menanyakan definisi kategori tertentu
        import re
        category_question_patterns = [
            r"apa itu (.+)",
            r"apa yang dimaksud (.+)",
            r"jelaskan (.+)",
            r"(.+) itu apa",
            r"(.+) adalah",
            r"pengertian (.+)",
            r"definisi (.+)",
        ]
        extracted_keyword = None
        for pattern in category_question_patterns:
            m = re.search(pattern, q)
            if m:
                extracted_keyword = m.group(1).strip()
                break

        if extracted_keyword:
            cat_info = self.get_category_info(extracted_keyword)
            if cat_info:
                answer = (
                    f"📚 {cat_info['label']}\n\n"
                    f"{cat_info['definisi']}\n\n"
                    f"---\n"
                    f"💡 Ketikkan '{cat_info['label']}' untuk melihat daftar koleksi dalam kategori ini."
                )
                return {
                    "tool": "museum_collection",
                    "status": "success",
                    "answer": answer,
                    "documents": [],
                    "sources": []
                }

        # Default: tampilkan semua 10 kategori beserta definisi singkat
        lines = [
            "🏛️ Klasifikasi Koleksi Museum Sri Baduga\n",
            "Museum Sri Baduga memiliki 10 jenis klasifikasi koleksi berdasarkan standar permuseuman nasional:\n",
        ]
        for i, (key, info) in enumerate(CATEGORY_INFO.items(), 1):
            ringkasan = info["definisi"].split(".")[0] + "."
            lines.append(f"{i}. {info['label']}")
            lines.append(f"   {ringkasan}\n")

        lines.append("---")
        lines.append(
            "💡 Tips: Ketikkan nama kategori (misalnya Etnografika) untuk melihat daftar koleksinya, "
            "atau ketik 'apa itu Filologika' untuk penjelasan lengkap suatu kategori."
        )

        answer = "\n".join(lines)

        return {
            "tool": "museum_collection",
            "status": "success",
            "answer": answer,
            "documents": [],
            "sources": []
        }