import os
from pathlib import Path

# Paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"

NODE_JSON_PATH = Path(os.getenv("NODE_JSON_PATH", str(DATA_DIR / "node.json")))
DB_PATH = Path(os.getenv("DB_PATH", str(BACKEND_DIR / "leads.db")))

# Server configuration
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")

# n8n Configuration
# N8N_BASE_URL is used by backend container to call n8n (e.g. http://n8n:5678 or http://localhost:5678)
N8N_BASE_URL = os.getenv("N8N_BASE_URL", "http://localhost:5678").rstrip("/")
# N8N_PUBLIC_URL is used by the browser user to open n8n UI
N8N_PUBLIC_URL = os.getenv("N8N_PUBLIC_URL", "http://localhost:5678").rstrip("/")
N8N_HEALTH_URL = os.getenv("N8N_HEALTH_URL", f"{N8N_BASE_URL}/healthz")

# Default Webhook details from data/node.json
N8N_WEBHOOK_PATH = os.getenv("N8N_WEBHOOK_PATH", "lead-magnet-signup")
N8N_WEBHOOK_PROD_URL = os.getenv(
    "N8N_WEBHOOK_PROD_URL", f"{N8N_BASE_URL}/webhook/{N8N_WEBHOOK_PATH}"
)
N8N_WEBHOOK_TEST_URL = os.getenv(
    "N8N_WEBHOOK_TEST_URL", f"{N8N_BASE_URL}/webhook-test/{N8N_WEBHOOK_PATH}"
)

# Timeout
REQUEST_TIMEOUT_SECONDS = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "15"))
