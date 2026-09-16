"""
VRYS AI — Transactional Email Client with Resend Integration
Dispatches formatted emails (Owner Account Recovery, Invoices, Renewal Alerts, Customer Receipts)
via Resend API (https://resend.com) with idempotency tracking and fallback logging.
"""
from typing import Dict, Any, Optional, List
import time
import uuid
import os
import json
import urllib.request
import urllib.error
from app.schemas.communication_schema import MessageStatus

class EmailClient:
    def __init__(self):
        self.email_store: Dict[str, Dict[str, Any]] = {}
        self.idempotency_cache: Dict[str, str] = {}
        
        # Load environment variables
        self.api_key = os.getenv("RESEND_API_KEY", "")
        self.from_email = os.getenv("RESEND_FROM_EMAIL", "VRYS Security <onboarding@resend.dev>")
        self.resend_endpoint = "https://api.resend.com/emails"

    def send_email(
        self,
        recipient_email: str,
        subject: str,
        body_html: str,
        org_id: Optional[str] = "SYSTEM",
        customer_id: Optional[str] = "ADMIN",
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dispatches transactional email through Resend API.
        """
        token = idempotency_key or str(uuid.uuid4())
        if token in self.idempotency_cache:
            existing_id = self.idempotency_cache[token]
            return {
                "email_id": existing_id,
                "status": MessageStatus.SENT.value,
                "is_duplicate": True,
                "delivery_channel": "RESEND_API"
            }

        msg_id = f"email_{uuid.uuid4().hex[:12]}"
        
        # Prepare payload for Resend
        payload = {
            "from": self.from_email,
            "to": [recipient_email],
            "subject": subject,
            "html": body_html
        }
        
        resend_response_data = None
        delivery_status = MessageStatus.SENT.value
        api_error_detail = None

        if self.api_key:
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "VRYS-CRM-EmailClient/1.0"
                }
                req = urllib.request.Request(
                    self.resend_endpoint,
                    data=json.dumps(payload).encode("utf-8"),
                    headers=headers,
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    res_body = response.read().decode("utf-8")
                    resend_response_data = json.loads(res_body)
                    if "id" in resend_response_data:
                        msg_id = f"resend_{resend_response_data['id']}"
            except urllib.error.HTTPError as he:
                error_body = he.read().decode("utf-8")
                api_error_detail = f"HTTP {he.code}: {error_body}"
                print(f"[RESEND EMAIL WARNING] HTTP Error dispatching email: {api_error_detail}")
            except Exception as e:
                api_error_detail = str(e)
                print(f"[RESEND EMAIL WARNING] Network Error: {api_error_detail}")

        record = {
            "email_id": msg_id,
            "organization_id": org_id,
            "customer_id": customer_id,
            "recipient_email": recipient_email,
            "channel": "EMAIL",
            "subject": subject,
            "body": body_html,
            "status": delivery_status,
            "timestamp": time.time(),
            "idempotency_key": token,
            "resend_meta": resend_response_data,
            "error_detail": api_error_detail
        }

        self.email_store[msg_id] = record
        self.idempotency_cache[token] = msg_id
        return record

    def send_owner_recovery_email(
        self,
        recovery_email: str,
        primary_login_email: str,
        reset_link: str,
        expires_minutes: int = 20
    ) -> Dict[str, Any]:
        """
        Step 20: Sends dedicated high-security Owner Password Reset template to recovery_email.
        Never transmits raw passwords; includes 20-min expiry and security advisories.
        """
        subject = "VRYS Owner Account — Password Recovery Instructions"
        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>VRYS Account Recovery</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="560" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 30px 40px; background: linear-gradient(135deg, #4f46e5, #7c3aed); text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 0.05em;">VRYS PLATFORM SECURITY</h1>
                      <p style="margin: 6px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 13px;">Super Admin Account Recovery</p>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding: 35px 40px;">
                      <p style="margin: 0 0 16px 0; font-size: 15px; color: #f8fafc; line-height: 1.6;">
                        A password reset was requested for your <strong>VRYS Platform Owner</strong> account linked to:
                      </p>
                      
                      <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                        <span style="font-size: 14px; color: #818cf8; font-family: monospace; font-weight: 600;">{primary_login_email}</span>
                      </div>

                      <p style="margin: 0 0 28px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                        To re-establish your Supabase Auth credentials and restore access to the Super Admin console, click the button below:
                      </p>

                      <div style="text-align: center; margin-bottom: 30px;">
                        <a href="{reset_link}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #6366f1); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.5);">
                          RESET OWNER PASSWORD
                        </a>
                      </div>

                      <!-- Expiry warning box -->
                      <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
                        <p style="margin: 0; font-size: 13px; color: #fca5a5; line-height: 1.5;">
                          <strong>Security Notice:</strong> This single-use link expires in <strong>{expires_minutes} minutes</strong>. Upon completion, all existing active sessions will be revoked.
                        </p>
                      </div>

                      <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                        If you did not initiate this request, your account is still secure — no changes have been made. However, we recommend auditing your Super Admin access logs in the VRYS console.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px; background: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
                      <p style="margin: 0; font-size: 11px; color: #475569;">
                        VRYS Business Operating System • Automated PostgreSQL RLS Security Engine
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """
        return self.send_email(
            recipient_email=recovery_email,
            subject=subject,
            body_html=body_html,
            org_id="PLATFORM_OWNER",
            customer_id="SUPER_ADMIN"
        )

email_client = EmailClient()
