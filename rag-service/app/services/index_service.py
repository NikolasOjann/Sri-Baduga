from app.rag.database_manager import get_database


class IndexService:

    def __init__(self):

        self.database = get_database()

    def rebuild(self):

        return self.database.rebuild()