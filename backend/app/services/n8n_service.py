import json
import time
import logging
import requests
from typing import Dict, Any, Optional
from ..config import (
    N8N_BASE_URL,
    N8N_PUBLIC_URL,
    N8N_HEALTH_URL,
    N8N_WEBHOOK_PATH,
    N8N_WEBHOOK_PROD_URL,
    N8N_WEBHOOK_TEST_URL,
    NODE_JSON_PATH,
    REQUEST_TIMEOUT_SECONDS,
)

logger = logging.getLogger(__name__)

def check_n8n_health() -> Dict[str, Any]:
    """Check if n8n instance is reachable."""
    try:
        # Try healthz first, fallback to base URL
        try:
            resp = requests.get(N8N_HEALTH_URL, timeout=3)
            if resp.ok:
                return {"online": True, "editor_url": N8N_PUBLIC_URL, "status_code": resp.status_code, "error": None}
        except requests.RequestException:
            pass

        resp = requests.get(N8N_BASE_URL, timeout=3)
        return {
            "online": resp.status_code < 500,
            "editor_url": N8N_PUBLIC_URL,
            "status_code": resp.status_code,
            "error": None if resp.status_code < 500 else f"HTTP {resp.status_code}"
        }
    except requests.RequestException as exc:
        return {
            "online": False,
            "editor_url": N8N_PUBLIC_URL,
            "status_code": None,
            "error": f"n8n unavailable at {N8N_BASE_URL}: {str(exc)}"
        }

def trigger_n8n_webhook(payload: Dict[str, Any], is_test_mode: bool = False) -> Dict[str, Any]:
    """Trigger the n8n webhook with lead payload."""
    url = N8N_WEBHOOK_TEST_URL if is_test_mode else N8N_WEBHOOK_PROD_URL
    start_time = time.time()
    
    try:
        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=REQUEST_TIMEOUT_SECONDS
        )
        latency_ms = round((time.time() - start_time) * 1000, 2)
        
        response_text = response.text[:2000] if response.text else ""
        parsed_json = None
        if response_text:
            try:
                parsed_json = response.json()
            except ValueError:
                parsed_json = None

        if response.ok:
            return {
                "success": True,
                "status_code": response.status_code,
                "latency_ms": latency_ms,
                "target_url": url,
                "response": parsed_json or response_text or "Webhook triggered successfully",
                "error": None
            }
        else:
            return {
                "success": False,
                "status_code": response.status_code,
                "latency_ms": latency_ms,
                "target_url": url,
                "response": response_text,
                "error": f"n8n webhook returned HTTP {response.status_code}: {response_text}"
            }
    except requests.Timeout:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "success": False,
            "status_code": 504,
            "latency_ms": latency_ms,
            "target_url": url,
            "response": None,
            "error": f"Request to n8n webhook timed out after {REQUEST_TIMEOUT_SECONDS}s"
        }
    except requests.RequestException as exc:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "success": False,
            "status_code": 502,
            "latency_ms": latency_ms,
            "target_url": url,
            "response": None,
            "error": f"Could not connect to n8n webhook at {url}. Make sure n8n workflow is active! Error: {str(exc)}"
        }

def get_workflow_metadata() -> Dict[str, Any]:
    """Parse node.json and extract workflow metadata."""
    if not NODE_JSON_PATH.exists():
        return {
            "name": "Lead Magnet Funnel",
            "nodes": [],
            "connections": {},
            "setup_checklist": [],
            "webhook_path": "lead-magnet-signup",
            "active": False
        }

    try:
        with open(NODE_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        nodes = data.get("nodes", [])
        connections = data.get("connections", {})
        active = data.get("active", False)
        name = data.get("name", "Lead Magnet Funnel")
        
        # Find setup notes if present
        setup_checklist = []
        webhook_info = {
            "prod_url": N8N_WEBHOOK_PROD_URL,
            "test_url": N8N_WEBHOOK_TEST_URL,
            "path": N8N_WEBHOOK_PATH,
            "method": "POST"
        }

        for node in nodes:
            node_type = node.get("type", "")
            if node_type == "n8n-nodes-base.stickyNote":
                content = node.get("parameters", {}).get("content", "")
                setup_checklist = [line.strip() for line in content.split("\n") if line.strip()]
            elif node_type == "n8n-nodes-base.webhook":
                params = node.get("parameters", {})
                webhook_info["path"] = params.get("path", N8N_WEBHOOK_PATH)
                webhook_info["method"] = params.get("httpMethod", "POST")

        return {
            "name": name,
            "active": active,
            "nodes": nodes,
            "connections": connections,
            "setup_checklist": setup_checklist,
            "webhook_info": webhook_info
        }
    except Exception as exc:
        logger.exception("Error parsing node.json")
        return {
            "name": "Lead Magnet Funnel",
            "nodes": [],
            "connections": {},
            "setup_checklist": [],
            "error": str(exc)
        }
