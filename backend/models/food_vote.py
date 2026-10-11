from core.database import get_db

async def upsert_vote(reg_no: str, date: str, day: str, meal: str, item_id: str, vote: str):
    db = await get_db()
    try:
        await db.execute("""
            INSERT INTO food_votes (reg_no, date, day, meal, item_id, vote)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(reg_no, date, meal, item_id)
            DO UPDATE SET vote=excluded.vote, updated_at=CURRENT_TIMESTAMP
        """, (reg_no, date, day, meal, item_id, vote))
        await db.commit()
    finally:
        await db.close()

async def delete_vote(reg_no: str, date: str, meal: str, item_id: str):
    db = await get_db()
    try:
        await db.execute("""
            DELETE FROM food_votes
            WHERE reg_no = ? AND date = ? AND meal = ? AND item_id = ?
        """, (reg_no, date, meal, item_id))
        await db.commit()
    finally:
        await db.close()

async def get_ratings_for_date(date: str):
    db = await get_db()
    try:
        cursor = await db.execute("""
            SELECT meal, item_id,
                   SUM(CASE WHEN vote='like' THEN 1 ELSE 0 END) as upvotes,
                   SUM(CASE WHEN vote='dislike' THEN 1 ELSE 0 END) as downvotes
            FROM food_votes
            WHERE date = ?
            GROUP BY meal, item_id
        """, (date,))
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()

async def get_user_votes_for_date(reg_no: str, date: str):
    db = await get_db()
    try:
        cursor = await db.execute("""
            SELECT meal, item_id, vote
            FROM food_votes
            WHERE reg_no = ? AND date = ?
        """, (reg_no, date))
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()
