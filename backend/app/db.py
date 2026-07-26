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
        conn.execute("""
            CREATE TABLE IF NOT EXISTS campaigns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_name TEXT NOT NULL,
                channel TEXT NOT NULL,
                status TEXT DEFAULT 'Active',
                monthly_budget REAL NOT NULL,
                start_date TEXT NOT NULL,
                submitted_at TEXT NOT NULL,
                n8n_status TEXT DEFAULT 'pending',
                n8n_response_code INTEGER,
                n8n_response_body TEXT,
                error_message TEXT,
                is_test_mode INTEGER DEFAULT 0
            )
        """)
        conn.commit()

def save_campaign(
    campaign_name: str,
    channel: str,
    status: str = "Active",
    monthly_budget: float = 4000.0,
    start_date: str = "2026-01-07",
    is_test_mode: bool = False
) -> int:
    now_iso = datetime.now().isoformat()
    with get_db_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO campaigns (campaign_name, channel, status, monthly_budget, start_date, submitted_at, n8n_status, is_test_mode)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
            """,
            (campaign_name, channel, status, monthly_budget, start_date, now_iso, 1 if is_test_mode else 0)
        )
        conn.commit()
        return cursor.lastrowid

def update_campaign_n8n_status(
    campaign_id: int,
    status: str,
    response_code: Optional[int] = None,
    response_body: Optional[str] = None,
    error_message: Optional[str] = None
):
    with get_db_connection() as conn:
        conn.execute(
            """
            UPDATE campaigns
            SET n8n_status = ?,
                n8n_response_code = ?,
                n8n_response_body = ?,
                error_message = ?
            WHERE id = ?
            """,
            (status, response_code, response_body, error_message, campaign_id)
        )
        conn.commit()

def get_all_campaigns() -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.execute(
            "SELECT * FROM campaigns ORDER BY id DESC"
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def delete_campaign(campaign_id: int) -> bool:
    with get_db_connection() as conn:
        cursor = conn.execute("DELETE FROM campaigns WHERE id = ?", (campaign_id,))
        conn.commit()
        return cursor.rowcount > 0

# Backwards compatibility for leads functions
def save_lead(name: str, email: str, source: str = "Lead Magnet Funnel", is_test_mode: bool = False) -> int:
    return save_campaign(campaign_name=name, channel=source, status="Active", monthly_budget=4000, start_date="2026-01-07", is_test_mode=is_test_mode)

def update_lead_n8n_status(lead_id: int, status: str, response_code: Optional[int] = None, response_body: Optional[str] = None, error_message: Optional[str] = None):
    update_campaign_n8n_status(campaign_id=lead_id, status=status, response_code=response_code, response_body=response_body, error_message=error_message)

def get_all_leads() -> List[Dict[str, Any]]:
    campaigns = get_all_campaigns()
    # map campaigns to leads representation if requested by legacy callers
    result = []
    for c in campaigns:
        item = dict(c)
        item["name"] = c.get("campaign_name", "")
        item["email"] = f"{c.get('channel', 'marketing')}@domain.com"
        item["source"] = c.get("channel", "Campaign")
        result.append(item)
    return result

def delete_lead(lead_id: int) -> bool:
    return delete_campaign(lead_id)
