import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";

// 업체 정보 조회
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", session.tenantId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "업체 정보를 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// 업체 정보 수정
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "관리자만 수정할 수 있습니다" }, { status: 403 });
  }

  const body = await request.json();
  const now = new Date().toISOString();
  const supabase = getSupabase();

  const updateData: Record<string, unknown> = { updated_at: now };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.businessNumber !== undefined) updateData.business_number = body.businessNumber;
  if (body.ownerName !== undefined) updateData.owner_name = body.ownerName;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.address !== undefined) updateData.address = body.address;

  const { error } = await supabase
    .from("tenants")
    .update(updateData)
    .eq("id", session.tenantId);

  if (error) {
    return NextResponse.json({ error: "수정에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
