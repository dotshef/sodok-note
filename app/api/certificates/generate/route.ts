import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";
import { renderToBuffer } from "@react-pdf/renderer";
import { CertificateTemplate } from "@/lib/pdf/certificate-template";
import { FACILITY_TYPES } from "@/lib/constants/facility-types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createElement } from "react";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { visitId } = await request.json();
  if (!visitId) {
    return NextResponse.json({ error: "visitId가 필요합니다" }, { status: 400 });
  }

  const supabase = getSupabase();

  // 방문 정보 조회
  const { data: visit } = await supabase
    .from("visits")
    .select(`
      id, scheduled_date, completed_at, method, chemicals_used,
      clients(id, name, facility_type, address)
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
    .select("name, owner_name, logo_url")
    .eq("id", session.tenantId)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "업체 정보를 찾을 수 없습니다" }, { status: 500 });
  }

  // 기존 증명서 확인
  const { data: existingCert } = await supabase
    .from("certificates")
    .select("id")
    .eq("visit_id", visitId)
    .single();

  // 증명서 번호 채번
  const today = format(new Date(), "yyyyMMdd");
  const { count } = await supabase
    .from("certificates")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", session.tenantId)
    .like("certificate_number", `CERT-${today}-%`);

  const seq = String((count || 0) + 1).padStart(5, "0");
  const certificateNumber = `CERT-${today}-${seq}`;

  // 시설 유형 라벨
  const client = visit.clients as unknown as { id: string; name: string; facility_type: string; address: string | null } | null;
  const facilityType = FACILITY_TYPES.find(
    (ft) => ft.id === client?.facility_type
  )?.label || client?.facility_type || "";

  // PDF 생성
  const now = new Date();
  const certData = {
    certificateNumber,
    companyName: tenant.name,
    ownerName: tenant.owner_name || "",
    logoUrl: tenant.logo_url,
    facilityName: client?.name || "",
    facilityAddress: client?.address || "",
    facilityType,
    disinfectionDate: format(new Date(visit.completed_at!), "yyyy년 M월 d일 (EEE)", { locale: ko }),
    disinfectionMethod: visit.method || "",
    chemicalsUsed: visit.chemicals_used?.join(", ") || "",
    issuedDate: format(now, "yyyy년 M월 d일", { locale: ko }),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(
    createElement(CertificateTemplate, { data: certData }) as any
  );

  // Supabase Storage에 업로드
  const filePath = `certificates/${session.tenantId}/${certificateNumber}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("certificates")
    .upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error("PDF upload failed:", uploadError);
  }

  const { data: urlData } = supabase.storage
    .from("certificates")
    .getPublicUrl(filePath);

  const pdfUrl = urlData?.publicUrl || null;
  const certNow = new Date().toISOString();

  // certificates 테이블에 기록 (재발급 시 업데이트)
  if (existingCert) {
    await supabase
      .from("certificates")
      .update({
        certificate_number: certificateNumber,
        pdf_url: pdfUrl,
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
        pdf_url: pdfUrl,
        created_at: certNow,
      });
  }

  return NextResponse.json({
    certificateNumber,
    pdfUrl,
  }, { status: 201 });
}
