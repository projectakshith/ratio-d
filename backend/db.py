import sqlite3
import os
import asyncio

DB_PATH = os.path.join(os.path.dirname(__file__), "ratio_d.db")

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                username TEXT PRIMARY KEY,
                hogwarts_house TEXT,
                hogwarts_intro_seen BOOLEAN DEFAULT 0
            )
        """)
        conn.commit()

async def get_user_preferences(username: str):
    def _get():
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT hogwarts_house, hogwarts_intro_seen FROM user_preferences WHERE username = ?",
                (username,)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    return await asyncio.to_thread(_get)

async def set_hogwarts_house(username: str, house: str) -> str:
    def _set():
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            # Upsert but only update if the existing house is NULL
            conn.execute("""
                INSERT INTO user_preferences (username, hogwarts_house)
                VALUES (?, ?)
                ON CONFLICT(username) DO UPDATE SET
                hogwarts_house = COALESCE(user_preferences.hogwarts_house, excluded.hogwarts_house)
            """, (username, house))
            conn.commit()

            cursor = conn.execute("SELECT hogwarts_house FROM user_preferences WHERE username = ?", (username,))
            row = cursor.fetchone()
            return row["hogwarts_house"]
    return await asyncio.to_thread(_set)

async def set_hogwarts_intro_seen(username: str):
    def _set():
        with sqlite3.connect(DB_PATH) as conn:
            # Upsert
            conn.execute("""
                INSERT INTO user_preferences (username, hogwarts_intro_seen)
                VALUES (?, 1)
                ON CONFLICT(username) DO UPDATE SET hogwarts_intro_seen=1
            """, (username,))
            conn.commit()
    await asyncio.to_thread(_set)
