from collections import defaultdict


class DocumentSelector:

    # =====================================================
    # NORMALIZE
    # =====================================================

    def normalize(self, text):

        if text is None:
            return ""

        return (
            text.lower()
            .replace("-", " ")
            .replace("_", " ")
            .strip()
        )

    # =====================================================
    # SELECT
    # =====================================================

    def select(
        self,
        question,
        documents
    ):

        if not documents:

            return {

                "status": "empty",

                "documents": []

            }

        question = self.normalize(question)

        # ==========================================
        # GROUP BERDASARKAN NAMA KOLEKSI
        # ==========================================

        groups = defaultdict(list)
        unique_names = []

        for doc in documents:

            if doc is None:
                continue

            name = doc.metadata.get("name", "")

            if not name:
                continue
                
            if name not in groups:
                unique_names.append(name)

            groups[name].append(doc)

        print()
        print("Unique Collection :", len(unique_names))

        for name in unique_names:

            print("-", name)



        # ==========================================
        # CARI BERDASARKAN KEYWORD / FUZZY MATCH
        # ==========================================
        import difflib
        matched = []

        # 1. Cek apakah keyword adalah nama kategori (dengan fuzzy)
        categories = {self.normalize(doc.metadata.get("category", "")) for doc in documents if doc and doc.metadata.get("category")}
        cat_matches = difflib.get_close_matches(question, categories, n=1, cutoff=0.85)
        if cat_matches:
            matched_cat = cat_matches[0]
            # Jika user mencari kategori, maka kembalikan semua nama unik dalam kategori tersebut
            matched_set = {doc.metadata.get("name") for doc in documents if doc and self.normalize(doc.metadata.get("category", "")) == matched_cat}
            matched = list(matched_set)
            
        # 2. Jika bukan kategori, cari berdasarkan nama koleksi (dengan fuzzy & substring)
        if not matched:
            name_matches = difflib.get_close_matches(question, unique_names, n=10, cutoff=0.7)
            for name in unique_names:
                if question in self.normalize(name) and name not in name_matches:
                    name_matches.append(name)
                elif self.normalize(name).startswith(question) and name not in name_matches:
                    name_matches.append(name)
            matched = name_matches

        # ==========================================
        # TIDAK ADA (FALLBACK TO TOP SEMANTIC MATCH)
        # ==========================================

        if len(matched) == 0:
            if len(unique_names) > 0:
                # Retriever found documents via Vector Search, but fuzzy string match failed.
                # Trust the #1 semantic match from the retriever.
                matched = [unique_names[0]]
            else:
                return {
                    "status": "empty",
                    "documents": []
                }

        # ==========================================
        # SATU
        # ==========================================

        if len(matched) == 1:

            return {

                "status": "success",

                "documents": groups[matched[0]]

            }

        # ==========================================
        # LEBIH DARI SATU
        # ==========================================

        # include document objects for each matched candidate name
        docs = []

        for name in matched:

            docs.extend(groups.get(name, []))

        return {

            "status": "clarification",

            "keyword": question,

            "candidates": matched,

            "documents": docs

        }