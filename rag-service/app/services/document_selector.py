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

        for doc in documents:

            if doc is None:
                continue

            name = doc.metadata.get(

                "name",

                ""

            )

            groups[name].append(doc)

        unique_names = sorted(groups.keys())

        print()
        print("Unique Collection :", len(unique_names))

        for name in unique_names:

            print("-", name)



        # ==========================================
        # CARI BERDASARKAN KEYWORD (AWALAN SAMA)
        # ==========================================

        matched = []

        for name in unique_names:
            if self.normalize(name).startswith(question):
                matched.append(name)

        # ==========================================
        # FALLBACK: CARI BERDASARKAN KEYWORD (MENGANDUNG KATA)
        # ==========================================

        if len(matched) == 0:
            for name in unique_names:
                if question in self.normalize(name):
                    matched.append(name)

        # ==========================================
        # TIDAK ADA
        # ==========================================

        if len(matched) == 0:

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