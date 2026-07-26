import sqlite3
from datetime import datetime
from typing import Dict, Any, List, Optional
from .config import DB_PATH

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                source TEXT DEFAULT 'Lead Magnet Funnel',
                submitted_at TEXT NOT NULL,
                n8n_status TEXT DEFAULT 'pending',
                n8n_response_code INTEGER,
                n8n_response_body TEXT,
                error_message TEXT,
                is_test_mode INTEGER DEFAULT 0
            )
        """)
        conn.commit()

def save_lead(
    name: str,
    email: str,
    source: str = "Lead Magnet Funnel",
    is_test_mode: bool = False
) -> int:
    now_iso = datetime.now().isoformat()
    with get_db_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO leads (name, email, source, submitted_at, n8n_status, is_test_mode)
            VALUES (?, ?, ?, ?, 'pending', ?)
            """,
            (name, email, source, now_iso, 1 if is_test_mode else 0)
        )
        conn.commit()
        return cursor.lastrowid

def update_lead_n8n_status(
    lead_id: int,
    status: str,
    response_code: Optional[int] = None,
    response_body: Optional[str] = None,
    error_message: Optional[str] = None
):
    with get_db_connection() as conn:
        conn.execute(
            """
            UPDATE leads
            SET n8n_status = ?,
                n8n_response_code = ?,
                n8n_response_body = ?,
                error_message = ?
            WHERE id = ?
            """,
            (status, response_code, response_body, error_message, lead_id)
        )
        conn.commit()

def get_all_leads() -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.execute(
            "SELECT * FROM leads ORDER BY id DESC"
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def delete_lead(lead_id: int) -> bool:
    with get_db_connection() as conn:
        cursor = conn.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
        conn.commit()
        return cursor.rowcount > 0
