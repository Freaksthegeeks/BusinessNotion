from fastapi import APIRouter
from ..services.n8n_service import check_n8n_health

router = APIRouter(tags=["Health"])

@router.get("/health")
def health():
    n8n_status = check_n8n_health()
    return {
        "backend": {
            "online": True,
            "status": "operational",
            "port": 8000
        },
        "n8n": n8n_status
    }
