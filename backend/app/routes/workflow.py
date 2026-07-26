from fastapi import APIRouter
from ..services.n8n_service import get_workflow_metadata

router = APIRouter(prefix="/workflow", tags=["Workflow"])

@router.get("")
def get_workflow():
    return get_workflow_metadata()
