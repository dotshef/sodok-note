interface RenderContactEmailParams {
  category: string;
  categoryLabel: string;
  title: string;
  content: string;
  user: {
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
  tenant: {
    id: string;
    companyName: string;
  };
}

interface RenderedEmail {
  subject: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderContactEmail({
  categoryLabel,
  title,
  content,
  user,
  tenant,
}: RenderContactEmailParams): RenderedEmail {
  const subject = `[소독노트 문의] [${categoryLabel}] ${title}`;
  const safeTitle = escapeHtml(title);
  const safeContent = escapeHtml(content).replace(/\n/g, "<br/>");
  const safeCompany = escapeHtml(tenant.companyName);
  const safeName = escapeHtml(user.name);
  const safeEmail = escapeHtml(user.email);
  const safePhone = user.phone ? escapeHtml(user.phone) : "-";
  const safeRole = user.role === "admin" ? "관리자" : "직원";

  const html = `
<!doctype html>
<html lang="ko">
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f6f7f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <div style="display:inline-block;padding:4px 10px;border-radius:9999px;background:#eef2ff;color:#4338ca;font-size:12px;font-weight:600;">${escapeHtml(categoryLabel)}</div>
                <h1 style="margin:12px 0 0 0;font-size:20px;color:#111827;line-height:1.4;">${safeTitle}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 8px 32px;">
                <div style="background:#f9fafb;border-radius:8px;padding:16px 18px;font-size:14px;color:#111827;line-height:1.7;">
                  ${safeContent}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px 32px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size:13px;color:#374151;">
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;width:96px;">업체명</td>
                    <td style="padding:6px 0;">${safeCompany}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">이름</td>
                    <td style="padding:6px 0;">${safeName} <span style="color:#9ca3af;">(${safeRole})</span></td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">이메일</td>
                    <td style="padding:6px 0;">${safeEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">전화번호</td>
                    <td style="padding:6px 0;">${safePhone}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">tenant_id</td>
                    <td style="padding:6px 0;color:#9ca3af;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${escapeHtml(tenant.id)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px 32px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">이 메일은 소독노트 문의하기 폼에서 발송되었습니다. 답장하면 발신자(${safeEmail})에게 직접 회신됩니다.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}
