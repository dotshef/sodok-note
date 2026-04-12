import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabase();

  const { data: cert } = await supabase
    .from("certificates")
    .select("certificate_number, file_url")
    .eq("id", id)
    .eq("tenant_id", session.tenantId)
    .single();

  if (!cert || !cert.file_url) {
    return NextResponse.json({ error: "증명서를 찾을 수 없습니다" }, { status: 404 });
  }

  const { data: fileData, error } = await supabase.storage
    .from("certificates")
    .download(cert.file_url);

  if (error || !fileData) {
    return NextResponse.json({ error: "파일 다운로드에 실패했습니다" }, { status: 500 });
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const fileName = `${cert.certificate_number}.hwpx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
