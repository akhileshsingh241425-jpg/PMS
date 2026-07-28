import os, threading
from flask import current_app


def send_email_async(subject, recipients, html_body, attachment_path=None):
    def _send():
        try:
            from routes.email_integration import send_via_graph
            from models.email_integration import EmailAccount
            acct = EmailAccount.query.filter_by(is_active=True).first()
            if not acct:
                return
            to = recipients[0] if recipients else ''
            send_via_graph(acct, to, None, subject, html_body, pdf_path=attachment_path if attachment_path and os.path.exists(attachment_path) else None)
        except Exception:
            pass

    threading.Thread(target=_send, daemon=True).start()


def send_notification_email(user_email, user_name, title, message, module_type=None, module_id=None, frontend_url='http://localhost:5174'):
    if not user_email:
        return
    link = ''
    if module_type == 'lead' and module_id:
        link = f'{frontend_url}/leads/{module_id}'
    html = f"""
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F0F2F8">
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
          <tr><td style="background:linear-gradient(90deg,#5B21B6,#7C3AED);padding:24px 32px">
            <h1 style="color:#fff;font-size:20px;margin:0;font-weight:800">InFocus IT PMS</h1>
          </td></tr>
          <tr><td style="padding:32px">
            <h2 style="font-size:18px;color:#1A1A2E;margin:0 0 8px">{title}</h2>
            <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px">{message}</p>
            <p style="font-size:13px;color:#9CA3AF;margin:0">Hi {user_name},</p>
            {"<a href='" + link + "' style='display:inline-block;margin-top:16px;padding:10px 24px;background:#5B21B6;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:700'>View Details</a>" if link else ""}
          </td></tr>
          <tr><td style="padding:16px 32px;border-top:1px solid #E5E7EB;font-size:11px;color:#9CA3AF;text-align:center">
            InFocus IT Project Management System
          </td></tr>
        </table>
      </td></tr></table>
    </body></html>
    """
    send_email_async(title, [user_email], html)
