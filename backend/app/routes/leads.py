from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from ..db import save_campaign, update_campaign_n8n_status, get_all_campaigns, delete_campaign
from ..services.n8n_service import trigger_n8n_webhook

router = APIRouter(prefix="/leads", tags=["Campaigns & Leads"])

class CampaignSubmission(BaseModel):
    campaign_name: Optional[str] = None
    name: Optional[str] = None
    channel: Optional[str] = "Paid Social"
    source: Optional[str] = None
    status: Optional[str] = "Active"
    monthly_budget: Optional[float] = 4000.0
    start_date: Optional[str] = "2026-01-07"
    email: Optional[str] = None
    is_test_mode: Optional[bool] = False

@router.post("/submit")
def submit_campaign(submission: CampaignSubmission):
    campaign_name = submission.campaign_name or submission.name or "Summer Awareness Push"
    channel = submission.channel or submission.source or "Paid Social"
    status_val = submission.status or "Active"
    budget = submission.monthly_budget if submission.monthly_budget is not None else 4000.0
    start_date_val = submission.start_date or "2026-01-07"

    # 1. Save campaign locally to SQLite
    campaign_id = save_campaign(
        campaign_name=campaign_name,
        channel=channel,
        status=status_val,
        monthly_budget=budget,
        start_date=start_date_val,
        is_test_mode=submission.is_test_mode or False
    )

    # 2. Trigger n8n webhook
    payload = {
        "campaign_name": campaign_name,
        "name": campaign_name,
        "channel": channel,
        "source": channel,
        "status": status_val,
        "monthly_budget": budget,
        "start_date": start_date_val,
        "campaign_id": campaign_id,
        "lead_id": campaign_id
    }

    n8n_result = trigger_n8n_webhook(payload, is_test_mode=submission.is_test_mode or False)

    # 3. Update campaign status in SQLite
    new_status = "sent" if n8n_result["success"] else "failed"
    response_body = str(n8n_result.get("response") or "")
    update_campaign_n8n_status(
        campaign_id=campaign_id,
        status=new_status,
        response_code=n8n_result.get("status_code"),
        response_body=response_body[:1000],
        error_message=n8n_result.get("error")
    )

    return {
        "lead_id": campaign_id,
        "campaign_id": campaign_id,
        "campaign_name": campaign_name,
        "channel": channel,
        "status": new_status,
        "n8n_result": n8n_result
    }

@router.get("")
def list_campaigns():
    campaigns = get_all_campaigns()
    # Map for UI listing
    for c in campaigns:
        c["name"] = c.get("campaign_name", "")
        c["email"] = c.get("channel", "Paid Social")
        c["source"] = f"${c.get('monthly_budget', 0):,.0f}"
    return {
        "count": len(campaigns),
        "leads": campaigns,
        "campaigns": campaigns
    }

@router.delete("/{campaign_id}")
def remove_campaign(campaign_id: int):
    success = delete_campaign(campaign_id)
    if not success:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"success": True, "message": f"Campaign {campaign_id} deleted successfully"}
