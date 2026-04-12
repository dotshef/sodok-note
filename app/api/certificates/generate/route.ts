import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";
import { generateCertificateHwpx } from "@/lib/hwpx/generate-certificate";
import { format } from "date-fns";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { visitId, issueNumber } = await request.json();
  if (!visitId) {
    return NextResponse.json({ error: "visitId가 필요합니다" }, { status: 400 });
  }

  const supabase = getSupabase();

  // 방문 정보 조회
  const { data: visit } = await supabase
    .from("visits")
    .select(`
      id, scheduled_date, completed_at, method, chemicals_used,
      clients(id, code, name, area, volume, address, contact_name, contact_position)
    `)
    .eq("id", visitId)
    .eq("tenant_id", session.tenantId)
    .single();

  if (!visit) {
    return NextResponse.json({ error: "방문 건을 찾을 수 없습니다" }, { status: 404 });
  }

  if (visit.completed_at === null) {
    return NextResponse.json({ error: "완료된 방문 건만 증명서를 생성할 수 있습니다" }, { status: 400 });
  }

  // 업체 정보 조회
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, owner_name, address")
    .eq("id", session.tenantId)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "업체 정보를 찾을 수 없습니다" }, { status: 500 });
  }

  // 기존 증명서 확인
  const { data: existingCert } = await supabase
    .from("certificates")
    .select("id, file_url")
    .eq("visit_id", visitId)
    .single();

  const client = visit.clients as unknown as {
    id: string; code: string; name: string;
    area: number | null; volume: number | null;
    address: string | null; contact_name: string | null; contact_position: string | null;
  } | null;

  const clientCode = client?.code || "C00000";

  // certificate_number 채번: CERT-{client_code}-{순번} (MAX 기반)
  const { data: lastCert } = await supabase
    .from("certificates")
    .select("certificate_number")
    .eq("tenant_id", session.tenantId)
    .like("certificate_number", `CERT-${clientCode}-%`)
    .order("certificate_number", { ascending: false })
    .limit(1)
    .single();

  let nextSeq = 1;
  if (lastCert?.certificate_number) {
    const lastSeq = parseInt(lastCert.certificate_number.split("-").pop() || "0", 10);
    nextSeq = lastSeq + 1;
  }
  const certificateNumber = `CERT-${clientCode}-${String(nextSeq).padStart(5, "0")}`;

  // 소독 완료일 (소독기간용)
  const completedDate = format(new Date(visit.completed_at!), "yyyy.MM.dd");
  // 발급일 (증명서 생성 시점)
  const now = new Date();

  // HWPX 생성
  const hwpxBuffer = await generateCertificateHwpx({
    issueNumber: issueNumber || "",
    businessName: client?.name || "",
    areaM2: client?.area?.toString() || "",
    areaM3: client?.volume?.toString() || "",
    address: client?.address || "",
    position: client?.contact_position || "",
    managerName: client?.contact_name || "",
    periodStart: completedDate,
    periodEnd: completedDate,
    disinfectionType: visit.method || "",
    chemicals: visit.chemicals_used?.join(", ") || "",
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, "0"),
    day: String(now.getDate()).padStart(2, "0"),
    operatorName: tenant.name,
    operatorAddress: tenant.address || "",
    operatorCeo: tenant.owner_name || "",
  });

  // 파일명 생성
  const completedDateCompact = format(new Date(visit.completed_at!), "yyyyMMdd");
  const fileName = `소독증명서_${client!.name}_${tenant.name}_${completedDateCompact}.hwpx`;

  // Supabase Storage에 업로드 (스토리지는 영문 키)
  const filePath = `${session.tenantId}/${certificateNumber}.hwpx`;
  const { error: uploadError } = await supabase.storage
    .from("certificates")
    .upload(filePath, hwpxBuffer, {
      contentType: "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    console.error("HWPX upload failed:", uploadError);
    return NextResponse.json({ error: "파일 업로드에 실패했습니다" }, { status: 500 });
  }

  const certNow = new Date().toISOString();

  // certificates 테이블에 기록 (재발급 시 기존 파일 삭제 후 업데이트)
  if (existingCert) {
    if (existingCert.file_url) {
      await supabase.storage.from("certificates").remove([existingCert.file_url]);
    }
    await supabase
      .from("certificates")
      .update({
        certificate_number: certificateNumber,
        issue_number: issueNumber || null,
        file_url: filePath,
        file_name: fileName,
        created_at: certNow,
      })
      .eq("id", existingCert.id);
  } else {
    await supabase
      .from("certificates")
      .insert({
        visit_id: visitId,
        tenant_id: session.tenantId,
        certificate_number: certificateNumber,
        issue_number: issueNumber || null,
        file_url: filePath,
        file_name: fileName,
        created_at: certNow,
      });
  }

  return NextResponse.json({
    certificateNumber,
    issueNumber: issueNumber || null,
  }, { status: 201 });
}
