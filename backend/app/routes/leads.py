from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from ..db import save_lead, update_lead_n8n_status, get_all_leads, delete_lead
from ..services.n8n_service import trigger_n8n_webhook

router = APIRouter(prefix="/leads", tags=["Leads"])

class LeadSubmission(BaseModel):
    name: str
    email: EmailStr
    source: Optional[str] = "Lead Magnet Funnel"
    is_test_mode: Optional[bool] = False

@router.post("/submit")
def submit_lead(lead: LeadSubmission):
    # 1. Save lead locally to SQLite
    lead_id = save_lead(
        name=lead.name,
        email=lead.email,
        source=lead.source or "Lead Magnet Funnel",
        is_test_mode=lead.is_test_mode or False
    )

    # 2. Trigger n8n webhook
    payload = {
        "name": lead.name,
        "email": lead.email,
        "source": lead.source or "Lead Magnet Funnel",
        "lead_id": lead_id
    }

    n8n_result = trigger_n8n_webhook(payload, is_test_mode=lead.is_test_mode or False)

    # 3. Update lead status in SQLite
    new_status = "sent" if n8n_result["success"] else "failed"
    response_body = str(n8n_result.get("response") or "")
    update_lead_n8n_status(
        lead_id=lead_id,
        status=new_status,
        response_code=n8n_result.get("status_code"),
        response_body=response_body[:1000],
        error_message=n8n_result.get("error")
    )

    return {
        "lead_id": lead_id,
        "name": lead.name,
        "email": lead.email,
        "status": new_status,
        "n8n_result": n8n_result
    }

@router.get("")
def list_leads():
    leads = get_all_leads()
    return {
        "count": len(leads),
        "leads": leads
    }

@router.delete("/{lead_id}")
def remove_lead(lead_id: int):
    success = delete_lead(lead_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"success": True, "message": f"Lead {lead_id} deleted successfully"}
