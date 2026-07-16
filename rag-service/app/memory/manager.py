from app.memory.storage import get_storage


class MemoryManager:

    def __init__(self):

        self.storage = get_storage()

        # Menyimpan entity terakhir setiap session
        self.entities = {}

    # ===============================
    # Conversation
    # ===============================

    def add_user(self, session_id, message):

        self.storage.add(
            session_id,
            "user",
            message
        )

    def add_ai(self, session_id, message):

        self.storage.add(
            session_id,
            "assistant",
            message
        )

    def history(self, session_id):

        messages = self.storage.get(session_id)

        return [
            {
                "role": msg.role,
                "content": msg.content
            }
            for msg in messages
        ]

    def clear(self, session_id):

        self.storage.clear(session_id)

        if session_id in self.entities:
            del self.entities[session_id]

    # ===============================
    # Entity Memory
    # ===============================

    def set_entity(self, session_id, entity):

        self.entities[session_id] = entity

    def get_entity(self, session_id):

        return self.entities.get(session_id)