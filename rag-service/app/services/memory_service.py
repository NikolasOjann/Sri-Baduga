class MemoryService:

    def __init__(self):

        self.sessions = {}

    # =====================================================
    # SESSION
    # =====================================================

    def _get_session(self, session_id):

        if session_id not in self.sessions:

            self.sessions[session_id] = {

                "history": [],

                "selected_document": None,

                "waiting": False,

                "candidate_documents": [],

                "candidate_names": []

            }

        return self.sessions[session_id]

    # =====================================================
    # HISTORY
    # =====================================================

    def add_user(self, session_id, message):

        self._get_session(session_id)["history"].append({

            "role": "user",

            "content": message

        })

    def add_ai(self, session_id, message):

        self._get_session(session_id)["history"].append({

            "role": "assistant",

            "content": message

        })

    def history(self, session_id):

        return self._get_session(session_id)["history"]

    # =====================================================
    # DOCUMENT
    # =====================================================

    def set_document(

        self,

        session_id,

        document

    ):

        self._get_session(session_id)[

            "selected_document"

        ] = document

    def get_document(

        self,

        session_id

    ):

        return self._get_session(

            session_id

        )["selected_document"]

    # =====================================================
    # CLARIFICATION
    # =====================================================

    def start_clarification(

        self,

        session_id,

        candidates,

        documents=None

    ):

        session = self._get_session(

            session_id

        )

        session["waiting"] = True

        # store both display names and document objects
        session["candidate_names"] = candidates if candidates is not None else []

        session["candidate_documents"] = documents if documents is not None else []

    def stop_clarification(

        self,

        session_id

    ):

        session = self._get_session(

            session_id

        )

        session["waiting"] = False

        session["candidate_documents"] = []

        session["candidate_names"] = []

    def is_waiting(

        self,

        session_id

    ):

        return self._get_session(

            session_id

        )["waiting"]

    def get_candidates(

        self,

        session_id

    ):

        # return candidate display names (strings)
        return self._get_session(

            session_id

        )["candidate_names"]

    # =====================================================
    # FIND DOCUMENT
    # =====================================================

    def find_document(

        self,

        session_id,

        message

    ):

        message = message.lower().strip()

        session = self._get_session(session_id)

        docs = session.get("candidate_documents", [])

        for doc in docs:

            if doc is None:

                continue

            name = doc.metadata.get("name", "").lower()

            if message == name:

                return doc

            if message in name:

                return doc

        # fallback: no document object matched
        return None

    # =====================================================
    # FIND CANDIDATE NAME
    # =====================================================

    def find_candidate(self, session_id, message):

        message = message.lower().strip()

        session = self._get_session(session_id)

        # check candidate names first
        for name in session.get("candidate_names", []):

            if message == name.lower():

                return name

            if message in name.lower():

                return name

        # then try candidate documents
        for doc in session.get("candidate_documents", []):

            if doc is None:

                continue

            name = doc.metadata.get("name", "").lower()

            if message == name:

                return doc.metadata.get("name")

            if message in name:

                return doc.metadata.get("name")

        return None

    # =====================================================
    # SELECTED DOCUMENT
    # =====================================================

    def set_selected_document(self, session_id, document):

        self._get_session(session_id)["selected_document"] = document

    def get_selected_document(self, session_id):

        return self._get_session(session_id).get("selected_document")

    def get_candidate_documents(self, session_id):

        return self._get_session(session_id).get("candidate_documents", [])

    # =====================================================
    # ENTITY / METADATA HELPERS
    # =====================================================

    def set_entity(self, session_id, entity):

        self._get_session(session_id)["entity"] = entity

    def get_entity(self, session_id):

        return self._get_session(session_id).get("entity")

    def extract_entity(self, question, documents):

        # simple heuristic: if a document name appears in the question, return it
        if not question or not documents:
            return None

        q = question.lower()

        for doc in documents:

            if doc is None:

                continue

            name = doc.metadata.get("name", "").lower()

            if name and name in q:

                return doc.metadata.get("name")

        return None

    # =====================================================
    # CLEAR
    # =====================================================

    def clear(

        self,

        session_id

    ):

        if session_id in self.sessions:

            del self.sessions[session_id]