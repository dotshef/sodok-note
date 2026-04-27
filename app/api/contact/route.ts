import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";
import { sendEmail } from "@/lib/email/resend";
import { renderContactEmail } from "@/lib/email/templates/contact";

const CONTACT_INBOX = "contact@dotshef.com";

const CATEGORY_LABELS: Record<string, string> = {
  bug: "버그 신고",
  feature: "기능 제안",
  question: "사용 문의",
  etc: "기타",
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const category = typeof body.category === "string" ? body.category : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!CATEGORY_LABELS[category]) {
    return NextResponse.json({ error: "유효하지 않은 문의 유형입니다" }, { status: 400 });
  }
  if (!title || title.length > 100) {
    return NextResponse.json({ error: "제목을 1~100자로 입력해주세요" }, { status: 400 });
  }
  if (!content || content.length > 2000) {
    return NextResponse.json({ error: "내용을 1~2000자로 입력해주세요" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("name, phone")
    .eq("id", session.userId)
    .eq("tenant_id", session.tenantId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다" }, { status: 404 });
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", session.tenantId)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: "업체 정보를 찾을 수 없습니다" }, { status: 404 });
  }

  const { subject, html } = renderContactEmail({
    category,
    categoryLabel: CATEGORY_LABELS[category],
    title,
    content,
    user: {
      name: user.name,
      email: session.email,
      phone: user.phone,
      role: session.role,
    },
    tenant: {
      id: session.tenantId,
      companyName: tenant.name,
    },
  });

  try {
    await sendEmail({
      to: CONTACT_INBOX,
      subject,
      html,
      replyTo: session.email,
    });
  } catch (e) {
    console.error("[contact] email send failed:", e);
    return NextResponse.json(
      { error: "문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
