import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";
import { renderCertificateEmail } from "@/lib/email/templates/certificate";
import { sendEmail } from "@/lib/email/resend";
import { kstDateString } from "@/lib/date/kst";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "관리자만 발송할 수 있습니다" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const to: string = typeof body.to === "string" ? body.to.trim() : "";
  const updateClientEmail: boolean = Boolean(body.updateClientEmail);

  if (!to || !EMAIL_REGEX.test(to)) {
    return NextResponse.json({ error: "올바른 이메일을 입력해주세요" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: cert } = await supabase
    .from("certificates")
    .select(`
      id, certificate_number, pdf_file_url, pdf_file_name,
      visits(completed_at, client_id, client_name, client_contact_name),
      tenants(name)
    `)
    .eq("id", id)
    .eq("tenant_id", session.tenantId)
    .single();

  if (!cert) {
    return NextResponse.json({ error: "증명서를 찾을 수 없습니다" }, { status: 404 });
  }

  if (!cert.pdf_file_url) {
    return NextResponse.json({ error: "PDF가 아직 생성되지 않았습니다" }, { status: 409 });
  }

  const visit = cert.visits as unknown as {
    completed_at: string | null;
    client_id: string;
    client_name: string;
    client_contact_name: string | null;
  } | null;
  const tenant = cert.tenants as unknown as { name: string } | null;

  if (!visit || !tenant || !visit.completed_at) {
    return NextResponse.json({ error: "발송에 필요한 정보가 부족합니다" }, { status: 500 });
  }

  const completedDate = kstDateString(visit.completed_at).replace(/-/g, ".");

  const { data: fileData, error: dlError } = await supabase.storage
    .from("certificates")
    .download(cert.pdf_file_url);

  if (dlError || !fileData) {
    return NextResponse.json({ error: "PDF 다운로드에 실패했습니다" }, { status: 500 });
  }

  const pdfBuffer = Buffer.from(await fileData.arrayBuffer());
  const pdfFileName = cert.pdf_file_name || `${cert.certificate_number}.pdf`;

  try {
    const { subject, html, attachments } = renderCertificateEmail({
      recipientName: visit.client_contact_name,
      clientName: visit.client_name,
      tenantName: tenant.name,
      completedDate,
      pdfBuffer,
      pdfFileName,
    });
    await sendEmail({ to, subject, html, attachments });
  } catch (e) {
    console.error("Certificate email send failed:", e);
    return NextResponse.json({ error: "이메일 발송에 실패했습니다" }, { status: 500 });
  }

  const sentAt = new Date().toISOString();

  await supabase
    .from("certificates")
    .update({ sent_at: sentAt, sent_to: to })
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (updateClientEmail) {
    await supabase
      .from("clients")
      .update({ contact_email: to, updated_at: sentAt })
      .eq("id", visit.client_id)
      .eq("tenant_id", session.tenantId);
  }

  return NextResponse.json({ sentAt, sentTo: to });
}
