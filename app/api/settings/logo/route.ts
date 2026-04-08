import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "관리자만 업로드할 수 있습니다" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("logo") as File | null;
  if (!file) {
    return NextResponse.json({ error: "파일이 필요합니다" }, { status: 400 });
  }

  const supabase = getSupabase();
  const ext = file.name.split(".").pop();
  const filePath = `logos/${session.tenantId}/logo.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: "업로드에 실패했습니다" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("logos")
    .getPublicUrl(filePath);

  const logoUrl = urlData?.publicUrl || null;

  // tenants 테이블에 logo_url 업데이트
  await supabase
    .from("tenants")
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq("id", session.tenantId);

  return NextResponse.json({ logoUrl });
}
