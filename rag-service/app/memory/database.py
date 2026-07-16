import sqlite3

from app.core.config import settings


class MemoryDatabase:

    def __init__(self):

        self.connection = sqlite3.connect(

            settings.MEMORY_DB,

            check_same_thread=False

        )

        self.create_tables()

    def create_tables(self):

        cursor = self.connection.cursor()

        cursor.execute("""

        CREATE TABLE IF NOT EXISTS conversation(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            session_id TEXT,

            role TEXT,

            content TEXT,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )

        """)

        self.connection.commit()