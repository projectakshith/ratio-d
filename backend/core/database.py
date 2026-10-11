import aiosqlite
import os

DATABASE_PATH = os.getenv("MESS_DB_PATH", "mess_votes.db")

async def get_db():
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    return db

async def init_db():
    db = await get_db()
    try:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS food_votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reg_no TEXT NOT NULL,
                date TEXT NOT NULL,
                day TEXT NOT NULL,
                meal TEXT NOT NULL,
                item_id TEXT NOT NULL,
                vote TEXT NOT NULL CHECK(vote IN ('like', 'dislike')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(reg_no, date, meal, item_id)
            )
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_food_votes_date_meal
            ON food_votes(date, meal)
        """)
        await db.commit()
    finally:
        await db.close()
